"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useTossConfirm } from "@/components/admin-toss";

// 2026-06-13 HOTFIX: GET 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
//   camelCase(recorderId/isActive/createdAt)로 읽으면 전 행 undefined → 빈 목록 버그.
type Recorder = {
  id: string;
  recorder_id: string;
  is_active: boolean;
  created_at: string;
  recorder: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

// Track B-d — 경기별 기록자 배정용 매치 타입.
//   GET /matches 응답(snake_case). settings.recorder_id 가 경기별 배정된 기록자 userId(string).
type MatchRow = {
  id: string;
  // 2026-06-21 정합: GET /matches 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
  //   Prisma 필드 roundName/scheduledAt 은 응답에서 round_name/scheduled_at 로 변환됨.
  //   camelCase 로 읽으면 round_name 라벨이 항상 fallback("라운드 N")으로만 떨어짐 → snake 로 교정.
  round_name: string | null;
  round_number: number | null;
  match_number: number | null;
  scheduled_at: string | null;
  venue_name: string | null;
  homeTeam: { team: { name: string } } | null;
  awayTeam: { team: { name: string } } | null;
  settings: { recorder_id?: string | null; division_code?: string | null; [k: string]: unknown } | null;
};

// 매치 settings 에서 경기별 배정된 기록자 userId 추출 (없으면 null).
function getMatchRecorderId(m: MatchRow): string | null {
  const s = m.settings as Record<string, unknown> | null;
  if (!s) return null;
  const rid = s.recorder_id;
  return rid != null && rid !== "" ? String(rid) : null;
}

export default function TournamentRecordersPage() {
  const { id } = useParams<{ id: string }>();
  const [recorders, setRecorders] = useState<Recorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Track B-d — 경기별 기록자 배정 state
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [matchError, setMatchError] = useState("");
  const tossConfirm = useTossConfirm();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`);
      if (res.ok) setRecorders(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  // Track B-d — 경기 목록 로드 (경기별 배정 현황 표시용)
  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/matches`);
      if (res.ok) setMatches(await res.json());
    } catch { /* ignore */ } finally {
      setMatchesLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMatches(); }, [loadMatches]);

  const addRecorder = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.recorder?.nickname ?? email} 님을 기록원으로 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeRecorder = async (recorderId: string, name: string) => {
    const ok = await tossConfirm.confirm({
      title: "기록원 권한 제거",
      sub: `${name} 님의 기록원 권한이 제거됩니다.`,
      body: "배정된 경기의 기록 담당자도 함께 확인해 주세요.",
      confirmLabel: "제거",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorderId }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const activeRecorders = recorders.filter((r) => r.is_active);

  // Track B-d — 경기별 기록자 배정/해제 (settings.recorder_id PATCH).
  //   recorderUserId="" → 해제. 풀 인원만 select 에 노출되므로 클라단 검증 추가 불요(서버 풀 검증 존재).
  const assignRecorder = async (matchId: string, recorderUserId: string) => {
    setAssigningId(matchId);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/matches/${matchId}/recorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // snake_case 키 — 서버가 body.recorder_id 로 수신
          body: JSON.stringify({ recorder_id: recorderUserId || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "배정 실패");
      // 낙관 갱신 — 해당 매치 settings.recorder_id 만 로컬 반영
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                settings: {
                  ...(m.settings ?? {}),
                  recorder_id: recorderUserId || null,
                },
              }
            : m
        )
      );
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
      // 실패 시 서버 진실로 재동기화
      await loadMatches();
    } finally {
      setAssigningId(null);
    }
  };

  // Track B-d — 자동 배정 (풀 라운드로빈). 미배정 경기만 채움(overwrite=false).
  const autoAssign = async () => {
    if (activeRecorders.length === 0) {
      setMatchError("먼저 기록원 풀에 인원을 추가하세요.");
      return;
    }
    const ok = await tossConfirm.confirm({
      title: "기록원 자동 배정",
      sub: `미배정 경기 ${unassignedCount}개에 기록원을 순환 배정합니다.`,
      body: "이미 배정된 경기는 유지되고, 비어 있는 경기만 채워집니다.",
      confirmLabel: "자동 배정",
    });
    if (!ok) return;
    setAutoAssigning(true);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/recorders/auto-assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overwrite: false }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "자동 배정 실패");
      await loadMatches(); // 서버 결과로 전체 재동기화
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAutoAssigning(false);
    }
  };

  // 기록자 userId → 표시명 매핑 (활성 풀에서 조회)
  const recorderNameById = (userId: string | null): string => {
    if (!userId) return "미배정";
    const found = activeRecorders.find((r) => r.recorder_id === userId);
    return found ? (found.recorder.nickname ?? found.recorder.email) : "(풀 외 인원)";
  };

  // 미배정 경기 수 (자동배정 버튼 보조 안내)
  const unassignedCount = matches.filter((m) => !getMatchRecorderId(m)).length;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss" className="space-y-6">
      {tossConfirm.dialog}
      {/* 기록원 추가 */}
      <section className="ts-card space-y-3 p-4">
        <h2 className="tp-title">기록원 추가</h2>
        <p className="tp-desc">
          mybdr 가입 회원의 이메일로 기록원을 지정합니다. 기록원은 bdr_stat 앱으로 경기를 실시간 기록할 수 있습니다.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") addRecorder();
            }}
            className="ts-input flex-1"
          />
          <button type="button" onClick={addRecorder} disabled={adding || !email.trim()} className="ts-btn ts-btn--primary">
            {adding ? "추가 중..." : "추가"}
          </button>
        </div>
        {error && <p className="tp-message" data-tone="danger">{error}</p>}
        {success && <p className="tp-message" data-tone="ok">{success}</p>}
      </section>

      {/* 기록원 목록 */}
      <section className="ts-card space-y-3 p-4">
        <h2 className="tp-title">
          현재 기록원 {activeRecorders.length > 0 && `(${activeRecorders.length}명)`}
        </h2>

        {loading ? (
          <p className="tp-desc">불러오는 중...</p>
        ) : activeRecorders.length === 0 ? (
          <p className="tp-desc">등록된 기록원이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {activeRecorders.map((r) => (
              <li
                key={r.id}
                className="tp-list-row"
              >
                <div className="flex items-center gap-3">
                  {r.recorder.profile_image_url ? (
                    <Image
                      src={r.recorder.profile_image_url}
                      alt=""
                      width={32}
                      height={32}
                      className="tp-avatar"
                      unoptimized /* 외부 프로필 이미지 URL — 도메인이 다양 */
                    />
                  ) : (
                    <div className="tp-avatar tp-avatar--fallback">
                      {(r.recorder.nickname ?? r.recorder.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="tp-list-name">
                      {r.recorder.nickname ?? r.recorder.email}
                    </p>
                    <p className="tp-list-meta">{r.recorder.email}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    removeRecorder(
                      r.recorder_id,
                      r.recorder.nickname ?? r.recorder.email
                    )
                  }
                  className="tp-danger-link"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Track B-d — 경기별 기록자 배정 (settings.recorder_id).
          위 "기록원 풀"에 등록된 인원을 개별 경기에 배정한다. */}
      <section className="ts-card space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="tp-title">경기별 기록자 배정</h2>
          {/* 자동 배정 — 미배정 경기에 풀 라운드로빈 */}
          <button
            type="button"
            onClick={autoAssign}
            disabled={autoAssigning || activeRecorders.length === 0 || unassignedCount === 0}
            className="ts-btn ts-btn--secondary ts-btn--sm"
          >
            {autoAssigning ? "배정 중..." : "자동 배정"}
          </button>
        </div>
        <p className="tp-desc">
          위 풀에 등록된 기록원을 각 경기에 지정합니다.
          {unassignedCount > 0 && ` 미배정 ${unassignedCount}경기.`}
        </p>

        {matchError && <p className="tp-message" data-tone="danger">{matchError}</p>}

        {matchesLoading ? (
          <p className="tp-desc">불러오는 중...</p>
        ) : matches.length === 0 ? (
          <p className="tp-desc">
            등록된 경기가 없습니다. 대진표를 먼저 생성하세요.
          </p>
        ) : activeRecorders.length === 0 ? (
          <p className="tp-desc">
            먼저 기록원 풀에 인원을 추가하면 경기별 배정을 할 수 있습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => {
              const recorderId = getMatchRecorderId(m);
              // 라벨: 라운드/경기번호 + 대진(홈 vs 원정)
              const roundLabel =
                m.round_name ?? (m.round_number != null ? `라운드 ${m.round_number}` : "경기");
              const vsLabel = `${m.homeTeam?.team.name ?? "미정"} vs ${m.awayTeam?.team.name ?? "미정"}`;
              return (
                <li
                  key={m.id}
                  className="tp-match-row"
                >
                  <div className="min-w-0">
                    <p className="tp-list-name truncate">
                      {roundLabel}
                      {m.match_number != null && ` · #${m.match_number}`}
                    </p>
                    <p className="tp-list-meta truncate">{vsLabel}</p>
                    {/* 현재 배정 상태 라벨 */}
                    <p className="tp-list-meta">
                      배정:{" "}
                      <span className={recorderId ? "tp-assigned" : ""}>
                        {recorderNameById(recorderId)}
                      </span>
                    </p>
                  </div>
                  {/* 기록자 select — 풀 활성 인원 + (미배정) */}
                  <select
                    value={recorderId ?? ""}
                    disabled={assigningId === m.id}
                    onChange={(e) => assignRecorder(m.id, e.target.value)}
                    className="ts-select disabled:opacity-50 sm:w-48"
                  >
                    <option value="">(미배정)</option>
                    {activeRecorders.map((r) => (
                      <option key={r.recorder_id} value={r.recorder_id}>
                        {r.recorder.nickname ?? r.recorder.email}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
