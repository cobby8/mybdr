"use client";

// 경기 후 리포트 페이지 — 시안: Dev/design/BDR v2 (1)/screens/GameReport.jsx (198줄)
// 이유:
//   - 시안이 단일 화면 + submitted 분기 (다단계 아님) → server wrapper 분리 시 props drill만 늘고 효용 0.
//   - B-7: GET/POST/PATCH /api/web/games/[id]/report 연결 완료. 신규=POST, 기존+can_edit=PATCH, !can_edit=차단.
//   - 선수 6명은 PLACEHOLDER_PLAYERS 모듈 상수 박제. 추후 실 game.participants fetch 도입 시 placeholder 대체
//     (현재는 더미 ID라 실제 submit 시 FK 에러 가능 — 서버 응답 alert로 노출).
//   - 임시저장은 LocalStorage 사용 (Q4 결정). 서버 리포트가 prefill되면 LocalStorage는 무시.
//   - StarRating 컴포넌트는 "선수별 평점(작은 별 5칸)" 자리에 사용 (sm 사이즈). 시안의 "전반 평가" 큰 별(54×54px)은
//     라벨 표시 + 인터랙션 변형이라 시안 박제를 위해 인라인 button 그대로 유지.

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { StarRating } from "@/components/ui/star-rating";

// 시안 라인 12~19 박제 — 추후 실 game.participants 데이터로 교체
// id/name/team/pos/num/color 5필드 그대로
const PLACEHOLDER_PLAYERS = [
  { id: 1, name: "rdm_sniper", team: "A", pos: "G", num: 7, color: "#DC2626" },
  { id: 2, name: "rdm_forward", team: "A", pos: "F", num: 23, color: "#DC2626" },
  { id: 3, name: "rdm_pivot", team: "A", pos: "C", num: 44, color: "#DC2626" },
  { id: 4, name: "hoops_alex", team: "B", pos: "G", num: 11, color: "#0F5FCC" },
  { id: 5, name: "threes_jk", team: "B", pos: "F", num: 22, color: "#0F5FCC" },
  { id: 6, name: "paint_bk", team: "B", pos: "C", num: 33, color: "#0F5FCC" },
] as const;

// 시안 라인 56~62 박제 — 신고 플래그 5종
// k=key / l=label / c=색상 토큰
const FLAGS = [
  { k: "noshow", l: "노쇼·지각", c: "var(--warn)" },
  { k: "manner", l: "매너 이슈", c: "var(--warn)" },
  { k: "foul", l: "과격 플레이", c: "var(--err)" },
  { k: "verbal", l: "폭언·비방", c: "var(--err)" },
  { k: "cheat", l: "부정 행위", c: "var(--err)" },
] as const;

// 전반 평가 별 1~5에 매핑되는 라벨 (시안 라인 94~99 박제)
const OVERALL_LABELS: Record<number, string> = {
  0: "평가 없음",
  1: "매우 나빴음",
  2: "아쉬움",
  3: "보통",
  4: "좋았음",
  5: "최고!",
};

// 더미 placeholder 게임 메타 — 추후 실 데이터 fetch 도입 시 props drill or useSWR
const PLACEHOLDER_META = {
  title: "토요 아침 픽업 @ 장충",
  date: "2026.04.24",
  hostNote: "호스트로서 리포트 작성",
};

// 권한 가드 화면용 상태 (gate)
// loading: GET prefill 중 / ok: 폼 진행 가능 / blocked: 진입 차단 (메시지 표시)
type GateState =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "blocked"; title: string; message: string; backHref?: string };

export default function GameReportPage(): ReactElement {
  // Next.js 15 App Router: useParams는 client 에서만. id 미존재 케이스 폴백
  const params = useParams<{ id: string }>();
  const gameId = params?.id ?? "";
  const router = useRouter();

  // 7개 state 시안 라인 4~10 박제
  const [submitted, setSubmitted] = useState(false);
  // ratings: { [playerId]: 1~5 }
  const [ratings, setRatings] = useState<Record<number, number>>({});
  // reports: { [playerId]: ['noshow', 'foul', ...] }
  const [reports, setReports] = useState<Record<number, string[]>>({});
  // mvp: 추천한 선수 id (단일 선택, 토글)
  const [mvp, setMvp] = useState<number | null>(null);
  // noshows: 불참/노쇼 체크된 선수 id 배열
  const [noshows, setNoshows] = useState<number[]>([]);
  // overall: 전반 평가 0~5
  const [overall, setOverall] = useState(0);
  // comment: 운영 특이사항 textarea
  const [comment, setComment] = useState("");

  // B-7 추가 state
  // reportId: 기존 리포트 있으면 PATCH 분기용 / null = 신규(POST)
  const [reportId, setReportId] = useState<string | null>(null);
  // canEdit: 24h 이내 여부. false면 제출 차단
  const [canEdit, setCanEdit] = useState(true);
  // submitting: 제출 중 중복 클릭 방지
  const [submitting, setSubmitting] = useState(false);
  // gate: 권한 가드 화면 분기 (401/403/400 시 폼 자체를 숨김)
  const [gate, setGate] = useState<GateState>({ kind: "loading" });

  // LocalStorage 임시저장 키 — gameId 별로 분리
  const draftKey = gameId ? `game-report-draft-${gameId}` : "";

  // 마운트 시: GET → 권한 가드 + prefill. 서버에 리포트 없으면 LocalStorage 임시저장 fallback prefill.
  // 이유: 24h 내 재진입 시 서버 데이터 우선, 신규 작성 중 새로고침 대응은 LocalStorage로.
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const loadDraftFromLocalStorage = () => {
      // 서버 리포트 없을 때만 LocalStorage prefill 시도
      if (typeof window === "undefined" || !draftKey) return;
      try {
        const raw = window.localStorage.getItem(draftKey);
        if (!raw) return;
        const draft = JSON.parse(raw) as {
          overall?: number;
          comment?: string;
          mvp?: number | null;
          ratings?: Record<number, number>;
          reports?: Record<number, string[]>;
          noshows?: number[];
        };
        if (typeof draft.overall === "number") setOverall(draft.overall);
        if (typeof draft.comment === "string") setComment(draft.comment);
        if (draft.mvp === null || typeof draft.mvp === "number") setMvp(draft.mvp ?? null);
        if (draft.ratings && typeof draft.ratings === "object") setRatings(draft.ratings);
        if (draft.reports && typeof draft.reports === "object") setReports(draft.reports);
        if (Array.isArray(draft.noshows)) setNoshows(draft.noshows);
      } catch {
        // 파싱 실패 시 조용히 무시
      }
    };

    (async () => {
      try {
        const res = await fetch(`/api/web/games/${gameId}/report`);

        // 401: 비로그인 → 로그인 페이지 redirect (returnTo 보존)
        if (res.status === 401) {
          if (!cancelled) {
            router.replace(`/login?returnTo=/games/${gameId}/report`);
          }
          return;
        }

        // 403: 참가자가 아님 → 차단 화면
        if (res.status === 403) {
          if (!cancelled) {
            setGate({
              kind: "blocked",
              title: "참가자만 평가할 수 있습니다",
              message: "이 경기에 참가하지 않은 사용자는 리포트를 작성할 수 없습니다.",
              backHref: `/games/${gameId}`,
            });
          }
          return;
        }

        // 400: 종료 안 된 경기 → 차단 화면
        if (res.status === 400) {
          if (!cancelled) {
            setGate({
              kind: "blocked",
              title: "아직 평가할 수 없습니다",
              message: "종료된 경기만 평가할 수 있습니다. 경기 종료 후 다시 시도해주세요.",
              backHref: `/games/${gameId}`,
            });
          }
          return;
        }

        // 404: 리포트 없음 = 신규 작성 모드 (정상)
        if (res.status === 404) {
          if (!cancelled) {
            loadDraftFromLocalStorage();
            setGate({ kind: "ok" });
          }
          return;
        }

        if (!res.ok) {
          // 기타 에러 — 일단 폼은 열어두고 alert만 (사용자가 작성할 수 있도록)
          if (!cancelled) {
            setGate({ kind: "ok" });
          }
          return;
        }

        // 200: 기존 리포트 prefill
        // apiSuccess는 data 직접 반환 (data 래핑 X)
        const json = (await res.json()) as {
          report?: {
            id: string;
            overall_rating: number;
            comment: string | null;
            mvp_user_id: string | null;
            ratings: Array<{
              rated_user_id: string;
              rating: number;
              flags: string[];
              is_noshow: boolean;
            }>;
          };
          can_edit?: boolean;
        };
        const rep = json.report;
        const ce = json.can_edit ?? false;
        if (cancelled) return;

        if (rep) {
          setReportId(rep.id);
          setOverall(rep.overall_rating);
          setComment(rep.comment ?? "");
          // mvp_user_id는 서버상 string(UUID), placeholder는 number — 매칭은 String(p.id) 비교로 처리.
          // 현재 placeholder 더미라 mvp는 prefill 안 되는 케이스가 일반적.
          // p.id 기반으로 number 추론 시도 (UUID라면 NaN → null 유지).
          if (rep.mvp_user_id !== null && rep.mvp_user_id !== undefined) {
            const n = Number(rep.mvp_user_id);
            setMvp(Number.isFinite(n) ? n : null);
          }
          // ratings 배열 → state map 변환
          const ratingMap: Record<number, number> = {};
          const flagMap: Record<number, string[]> = {};
          const noshowList: number[] = [];
          for (const r of rep.ratings) {
            const idNum = Number(r.rated_user_id);
            if (!Number.isFinite(idNum)) continue; // UUID는 placeholder와 매핑 불가 — skip
            ratingMap[idNum] = r.rating;
            flagMap[idNum] = r.flags;
            if (r.is_noshow) noshowList.push(idNum);
          }
          setRatings(ratingMap);
          setReports(flagMap);
          setNoshows(noshowList);
          setCanEdit(ce);
        } else {
          loadDraftFromLocalStorage();
        }
        setGate({ kind: "ok" });
      } catch {
        // 네트워크 오류 등 — 폼은 열어두되 LocalStorage prefill만 시도
        if (!cancelled) {
          loadDraftFromLocalStorage();
          setGate({ kind: "ok" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId, draftKey, router]);

  // 선수별 평점 setter (StarRating onChange 와 호환)
  const setRating = (id: number, v: number) => {
    setRatings((prev) => ({ ...prev, [id]: v }));
  };

  // 신고 플래그 토글 — 이미 있으면 제거, 없으면 추가
  const toggleReport = (id: number, flag: string) => {
    setReports((prev) => {
      const cur = prev[id] || [];
      const next = cur.includes(flag) ? cur.filter((f) => f !== flag) : [...cur, flag];
      return { ...prev, [id]: next };
    });
  };

  // 노쇼 체크박스 토글
  const toggleNoshow = (id: number) => {
    setNoshows((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  };

  // 제출 핸들러 — POST(신규) / PATCH(기존+수정가능) 분기
  // 이유: 동일 endpoint에 method만 분기. 24h 경과 시 PATCH도 서버에서 차단되지만, UX 위해 클라이언트 선차단.
  const handleSubmit = async () => {
    if (!gameId) return;

    // 기존 리포트 + 수정 불가 → 차단
    if (reportId && !canEdit) {
      alert("24시간이 경과되어 수정할 수 없습니다.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      // 페이로드 빌드 — 평점 0(미평가)은 제외. 주의: PLACEHOLDER_PLAYERS의 id가 number라
      // 서버는 UUID(string) 기대 → 현재는 String(p.id) 변환만. 실 참가자 fetch 도입 시 교체 필요.
      const ratingsBody = PLACEHOLDER_PLAYERS.filter(
        (p) =>
          (ratings[p.id] ?? 0) > 0 ||
          (reports[p.id] ?? []).length > 0 ||
          noshows.includes(p.id)
      ).map((p) => ({
        rated_user_id: String(p.id),
        rating: ratings[p.id] ?? 3,
        flags: reports[p.id] ?? [],
        is_noshow: noshows.includes(p.id),
      }));

      const body = {
        overall_rating: overall,
        comment: comment.trim() ? comment.trim() : null,
        mvp_user_id: mvp !== null ? String(mvp) : null,
        ratings: ratingsBody,
      };

      const method = reportId ? "PATCH" : "POST";
      const res = await fetch(`/api/web/games/${gameId}/report`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = "제출에 실패했습니다.";
        try {
          const err = (await res.json()) as { error?: { message?: string } };
          if (err?.error?.message) msg = err.error.message;
        } catch {
          // ignore parse error
        }
        alert(msg);
        return;
      }

      // 성공 시 LocalStorage 임시저장 정리
      if (typeof window !== "undefined" && draftKey) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // ignore
        }
      }
      setSubmitted(true);
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // 임시 저장 — LocalStorage (Q4 결정). 서버 호출 없음.
  const handleDraft = () => {
    if (typeof window === "undefined" || !draftKey) {
      alert("임시 저장을 사용할 수 없습니다.");
      return;
    }
    try {
      const draft = { overall, comment, mvp, ratings, reports, noshows };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
      alert("임시 저장되었습니다.");
    } catch {
      alert("임시 저장에 실패했습니다 (저장 공간 부족 등).");
    }
  };

  // === gate 분기: loading / blocked === (B-7 권한 가드)
  // 이유: 401/403/400 케이스에 폼 자체를 보여주면 혼란. 명확한 차단 화면으로 분리.
  if (gate.kind === "loading") {
    return (
      <div className="page" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
          <p style={{ margin: 0, color: "var(--ink-mute)", fontSize: 13 }}>리포트 정보를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (gate.kind === "blocked") {
    return (
      <div className="page" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>{gate.title}</h1>
          <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            {gate.message}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn btn--lg" onClick={() => router.push("/games/my-games")}>
              내 경기로
            </button>
            {gate.backHref ? (
              <button
                className="btn btn--primary btn--lg"
                onClick={() => router.push(gate.backHref ?? "/games/my-games")}
              >
                경기 상세
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // === submitted=true 분기 (시안 라인 28~54 박제) ===
  if (submitted) {
    const ratedCount = Object.keys(ratings).length;
    const reportCount = Object.keys(reports).filter((k) => (reports[Number(k)] ?? []).length > 0).length;
    const mvpName = mvp ? PLACEHOLDER_PLAYERS.find((p) => p.id === mvp)?.name ?? "—" : "—";

    return (
      <div className="page" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "color-mix(in oklab, var(--ok) 16%, transparent)",
              color: "var(--ok)",
              display: "grid",
              placeItems: "center",
              fontSize: 40,
              margin: "0 auto 18px",
              fontWeight: 900,
            }}
          >
            ✓
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>리포트 제출 완료</h1>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            평가해주셔서 감사합니다. 각 플레이어의 매너 점수에 반영됩니다.
            <br />
            심각한 신고는 BDR 운영팀이 별도 검토합니다.
          </p>
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              margin: "0 0 22px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                marginBottom: 6,
                letterSpacing: ".08em",
              }}
            >
              리포트 요약
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 8, fontSize: 13 }}>
              <div style={{ color: "var(--ink-dim)" }}>평가한 선수</div>
              <div style={{ fontWeight: 700 }}>{ratedCount}명</div>
              <div style={{ color: "var(--ink-dim)" }}>신고</div>
              <div>{reportCount}건</div>
              <div style={{ color: "var(--ink-dim)" }}>노쇼</div>
              <div>{noshows.length}명</div>
              <div style={{ color: "var(--ink-dim)" }}>MVP 추천</div>
              <div style={{ fontWeight: 700 }}>{mvpName}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn btn--lg" onClick={() => router.push("/games/my-games")}>
              내 경기로
            </button>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => router.push(`/games/${gameId}`)}
            >
              결과 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === 메인 폼 (시안 라인 64~194 박제) ===
  return (
    <div className="page">
      {/* 빵부스러기 — 홈 › 내 경기 › 경기 후 리포트 (시안 라인 66~70) */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <a onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          홈
        </a>
        <span>›</span>
        <a onClick={() => router.push("/games/my-games")} style={{ cursor: "pointer" }}>
          내 경기
        </a>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>경기 후 리포트</span>
      </div>

      {/* 페이지 헤더 (시안 라인 72~76) */}
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">POST-GAME REPORT · 경기 후 평가</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
          경기 후 리포트
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--ink-mute)", fontSize: 13 }}>
          {PLACEHOLDER_META.title} · {PLACEHOLDER_META.date} · {PLACEHOLDER_META.hostNote}
        </p>
      </div>

      {/* 본문 그리드: 좌 메인 + 우 sticky aside 300px (시안 라인 78) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 300px",
          gap: 18,
          alignItems: "flex-start",
        }}
        className="report-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* === 전반 평가 카드 (시안 라인 80~104) === */}
          <div className="card" style={{ padding: "22px 24px" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>경기 전반</h2>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink-dim)",
                display: "block",
                marginBottom: 6,
              }}
            >
              오늘 경기는 어땠나요?
            </label>
            {/* 큰 별(54x54) — 시안 의도된 큰 인터랙션 박스. StarRating 의 lg(32px)로는 너무 작아 시안 박제 위해 인라인 유지 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setOverall(overall === n ? 0 : n)}
                  type="button"
                  aria-label={`전반 평가 ${n}점`}
                  aria-pressed={overall === n}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 4,
                    background: overall >= n ? "var(--accent)" : "var(--bg-alt)",
                    color: overall >= n ? "#fff" : "var(--ink-dim)",
                    border: 0,
                    cursor: "pointer",
                    fontSize: 22,
                    fontWeight: 900,
                  }}
                >
                  ★
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                }}
              >
                {OVERALL_LABELS[overall]}
              </div>
            </div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink-dim)",
                display: "block",
                marginBottom: 6,
              }}
            >
              운영 관련 특이사항 (선택)
            </label>
            <textarea
              className="input"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="예: 골대 하나가 낮아서 불편했음. 화장실 만실. 다음엔 30분 빨리 오픈 권장."
              style={{ resize: "vertical" }}
            />
          </div>

          {/* === 선수별 평가 카드 (시안 라인 106~160) === */}
          <div className="card" style={{ padding: "22px 24px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>선수별 평가</h2>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--ink-mute)" }}>
              매너 점수 · 문제 있었다면 신고 (익명)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {PLACEHOLDER_PLAYERS.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    padding: "16px 0",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {/* 선수 헤더: Avatar + 이름/포지션/팀 + MVP 버튼 */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "44px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    {/* Avatar 인라인 div 박스 (lucide-react 금지, 시안 Avatar 컴포넌트 대체) */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        background: p.color,
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        fontSize: 13,
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      {p.team}
                      {p.num}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                        <span className="badge badge--soft">{p.pos}</span>
                        {/* 팀 칩 — 시안 라인 119 박제 */}
                        <span
                          className="badge badge--ghost"
                          style={{ background: p.color + "22", color: p.color }}
                        >
                          팀 {p.team}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-dim)",
                          fontFamily: "var(--ff-mono)",
                          marginTop: 2,
                        }}
                      >
                        #{p.num} · 매너 4.8 · 과거 픽업 23회
                      </div>
                    </div>
                    <button
                      onClick={() => setMvp(p.id === mvp ? null : p.id)}
                      type="button"
                      className={`btn btn--sm ${mvp === p.id ? "btn--primary" : ""}`}
                    >
                      {mvp === p.id ? "★ MVP 추천" : "★ MVP로"}
                    </button>
                  </div>

                  {/* 선수별 평점(StarRating sm) + 신고 플래그 + 노쇼 체크 (시안 라인 127~156) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      marginLeft: 56,
                    }}
                  >
                    {/* StarRating 사용 — sm 사이즈, fillColor=var(--warn) (시안 노란 별 박제) */}
                    <StarRating
                      value={ratings[p.id] ?? 0}
                      onChange={(v) => setRating(p.id, v)}
                      size="sm"
                      fillColor="var(--warn)"
                      label=""
                    />

                    {/* 신고 플래그 칩 5종 — 토글 (시안 라인 136~151) */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {FLAGS.map((f) => {
                        const on = (reports[p.id] || []).includes(f.k);
                        return (
                          <button
                            key={f.k}
                            type="button"
                            onClick={() => toggleReport(p.id, f.k)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 10,
                              background: on ? f.c : "transparent",
                              color: on ? "#fff" : "var(--ink-dim)",
                              border: `1px solid ${on ? f.c : "var(--border)"}`,
                              cursor: "pointer",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {f.l}
                          </button>
                        );
                      })}
                    </div>

                    {/* 불참/노쇼 체크박스 */}
                    <label
                      style={{
                        display: "flex",
                        gap: 4,
                        alignItems: "center",
                        fontSize: 11,
                        color: "var(--ink-soft)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={noshows.includes(p.id)}
                        onChange={() => toggleNoshow(p.id)}
                      />
                      불참/노쇼
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* === 익명성 안내 (시안 라인 162~164) === */}
          <div
            className="card"
            style={{
              padding: "16px 20px",
              background: "var(--bg-alt)",
              fontSize: 12,
              color: "var(--ink-soft)",
              lineHeight: 1.6,
            }}
          >
            <b>🔒 익명성 보장</b> — 신고 내용은 해당 선수에게 공개되지 않습니다. 누적 신고가 많은 선수는 BDR 운영팀이 개별 확인합니다.
          </div>

          {/* === 푸터 액션 (시안 라인 166~172) === */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => router.push("/games/my-games")}
            >
              나중에 하기
            </button>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* 24h 경과 시 안내 텍스트 — 폼 위에 별도 카드로도 보여주고 싶지만, 일단 버튼 옆 미니 라벨로 */}
              {reportId && !canEdit ? (
                <span style={{ fontSize: 11, color: "var(--ink-dim)", marginRight: 4 }}>
                  24시간 경과 — 수정 불가
                </span>
              ) : null}
              <button
                type="button"
                className="btn"
                onClick={handleDraft}
                disabled={submitting}
              >
                임시 저장
              </button>
              {/* overall=0(평가 없음) 또는 제출 중 또는 24h 경과 시 비활성 */}
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={handleSubmit}
                disabled={overall === 0 || submitting || (!!reportId && !canEdit)}
              >
                {submitting ? "제출 중…" : reportId ? "리포트 수정" : "리포트 제출"}
              </button>
            </div>
          </div>
        </div>

        {/* === 우측 sticky aside (시안 라인 175~192) === */}
        <aside
          style={{
            position: "sticky",
            top: 120,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
          className="report-aside"
        >
          {/* 진행 상황 카드 */}
          <div className="card" style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 800,
                letterSpacing: ".1em",
                marginBottom: 8,
              }}
            >
              진행 상황
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 13,
              }}
            >
              <span>전반 평가</span>
              <b style={{ color: overall ? "var(--ok)" : "var(--ink-dim)" }}>
                {overall ? "✓" : "—"}
              </b>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 13,
              }}
            >
              <span>선수별 평가</span>
              <b style={{ fontFamily: "var(--ff-mono)" }}>
                {Object.keys(ratings).length}/{PLACEHOLDER_PLAYERS.length}
              </b>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 13,
              }}
            >
              <span>MVP 추천</span>
              <b style={{ color: mvp ? "var(--ok)" : "var(--ink-dim)" }}>{mvp ? "✓" : "—"}</b>
            </div>
          </div>

          {/* 신고 기준 안내 카드 */}
          <div className="card" style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 800,
                letterSpacing: ".1em",
                marginBottom: 8,
              }}
            >
              🛡 신고 기준
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--ink-soft)" }}>
              <b>노쇼·지각</b> 연락 없이 불참
              <br />
              <b>매너 이슈</b> 비협조·무례
              <br />
              <b>과격 플레이</b> 고의 파울, 부상 유발
              <br />
              <b>폭언</b> 욕설·비방·성희롱
              <br />
              <b>부정</b> 콜 조작·점수 속임
              <br />
            </div>
          </div>
        </aside>
      </div>

      {/* 모바일 대응 — 720px 미만에서 grid 1열 + aside 정상 흐름 */}
      <style jsx>{`
        @media (max-width: 720px) {
          .report-grid {
            grid-template-columns: 1fr !important;
          }
          .report-aside {
            position: static !important;
            top: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
