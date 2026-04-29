"use client";

// Phase 10-3 B-5 — 게스트 지원 폼 (client)
// 이유: page.tsx 가 server wrapper 로 분리되면서, useState/useRouter 가 필요한
//       시안 박제 본문은 이쪽으로 이전한다. server 가 검증한 game/host 정보를
//       props 로 받아 그대로 렌더링한다.
// API: POST /api/web/games/[id]/apply  (role: "guest" 분기 — B-3+B-4 에서 이미 구현)
// 시안 출처: Dev/design/BDR v2 (1)/screens/GuestApply.jsx

import { useState } from "react";
import { useRouter } from "next/navigation";

// server 에서 전달받는 게임/호스트 — 시안 카드용 최소 셋
export interface GuestApplyGameProps {
  /** short-uuid (8자) — fetch URL 및 router 이동에 사용 */
  gameId: string;
  /** 시안 카드용 게임 메타. 모두 server 에서 fetch 한 실데이터 */
  game: {
    title: string;
    when: string; // 사람이 읽는 일시 문자열 — server 에서 포맷팅 완료
    court: string; // 코트명/주소 — server 에서 결합
    level: string; // skill_level 한글
    fee: string; // "5,000원" / "무료"
  };
  host: {
    name: string;
    tag: string; // 이니셜 등 호스트 식별자 (시안 라인 90 의 g.host.name)
  };
}

// 시안의 구력 옵션 5종 — 0~4 인덱스로 시안 그대로 박제
const EXP_OPTIONS = [
  { value: "0", label: "1년 미만" },
  { value: "1", label: "1~3년" },
  { value: "2", label: "3~5년" },
  { value: "3", label: "5~10년" },
  { value: "4", label: "10년 이상" },
];

// 시안의 약관 동의 항목 2종 — 둘 다 필수
const ACCEPT_ITEMS = [
  { k: "insurance", l: "스포츠 상해에 대한 본인 책임 이해", req: true },
  { k: "cancel", l: "수락 후 24시간 이내 취소 시 매너점수 차감 가능", req: true },
] as const;

type AcceptKey = (typeof ACCEPT_ITEMS)[number]["k"];

export function GuestApplyForm({ gameId, game, host }: GuestApplyGameProps) {
  const router = useRouter();

  // 시안 라인 13~17 박제: submitted/pos/exp/msg/accept 5개 state
  const [submitted, setSubmitted] = useState(false);
  const [pos, setPos] = useState<"G" | "F" | "C">("G");
  const [exp, setExp] = useState("2");
  const [msg, setMsg] = useState("");
  const [accept, setAccept] = useState<Record<AcceptKey, boolean>>({
    insurance: true,
    cancel: false,
  });
  // 중복 클릭 방지 — fetch 진행 중에는 버튼 비활성화
  const [submitting, setSubmitting] = useState(false);

  // server 에서 받은 게임/호스트 정보를 시안의 g 변수에 주입
  const g = { ...game, host };

  // 지원 버튼 핸들러 — POST /api/web/games/[id]/apply (role: "guest")
  // 이유: B-3+B-4 에서 apply route 에 게스트 분기를 이미 추가했으므로
  //       동일 엔드포인트에 role:"guest" 와 추가 필드를 넘기면 끝.
  async function handleSubmit() {
    if (submitting) return; // 중복 클릭 방어
    setSubmitting(true);
    try {
      const res = await fetch(`/api/web/games/${gameId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "guest",
          position: pos,
          // 시안 select 가 string 이라 int 변환. 0~4 만 허용 (zod 에서 추가 검증)
          experience_years: parseInt(exp, 10),
          // 빈 문자열은 null 로 — DB message 필드 NULL 허용
          message: msg.trim() || null,
          accepted_terms: {
            insurance: accept.insurance,
            cancel: accept.cancel,
          },
        }),
      });

      if (!res.ok) {
        // apiError 응답은 { error: { message: string } } 형태 (apiError 표준)
        // 일부 호출에서는 error 가 string 일 수도 있어 둘 다 방어
        const err = await res.json().catch(() => ({}));
        const m =
          err?.error?.message ??
          (typeof err?.error === "string" ? err.error : null) ??
          "지원 실패";
        alert(m);
        return;
      }

      // 성공 — 시안의 submitted 분기로 전환
      setSubmitted(true);
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  // 시안 19~45줄: 제출 완료 화면
  if (submitted) {
    return (
      <div className="page" style={{ maxWidth: 560 }}>
        <div className="card" style={{ padding: "40px 36px", textAlign: "center" }}>
          {/* ✓ 큰 동그라미 — 시안 라인 23 박제 */}
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
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>
            지원 완료
          </h1>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            <b style={{ color: "var(--ink)" }}>{g.host.name}</b> 호스트가 검토 후 수락·거절을 알려줍니다.
            <br />
            보통 <b>2시간 이내</b> 응답이 와요.
          </p>

          {/* 신청 요약 박스 — 시안 라인 29~37 */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              margin: "20px 0 24px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".08em",
                marginBottom: 6,
              }}
            >
              신청 요약
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 8, fontSize: 13 }}>
              <div style={{ color: "var(--ink-dim)" }}>경기</div>
              <div style={{ fontWeight: 700 }}>{g.title}</div>
              <div style={{ color: "var(--ink-dim)" }}>일시</div>
              <div style={{ fontFamily: "var(--ff-mono)" }}>{g.when}</div>
              <div style={{ color: "var(--ink-dim)" }}>포지션</div>
              <div style={{ fontWeight: 700 }}>{pos}</div>
              <div style={{ color: "var(--ink-dim)" }}>참가비</div>
              <div style={{ fontFamily: "var(--ff-mono)" }}>{g.fee} (현장 결제)</div>
            </div>
          </div>

          {/* CTA 2버튼 — 시안 라인 38~41 */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              className="btn btn--lg"
              type="button"
              onClick={() => router.push("/games/my-games")}
            >
              지원 현황 보기
            </button>
            <button
              className="btn btn--primary btn--lg"
              type="button"
              onClick={() => router.push("/games")}
            >
              다른 경기 찾기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 시안 47~167줄: 폼 화면
  return (
    <div className="page page--wide">
      {/* 빵 부스러기 네비 — 시안 라인 49~54 */}
      <div style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
        <a onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          홈
        </a>
        <span>›</span>
        <a onClick={() => router.push("/games")} style={{ cursor: "pointer" }}>
          경기
        </a>
        <span>›</span>
        <a onClick={() => router.push(`/games/${gameId}`)} style={{ cursor: "pointer" }}>
          경기 상세
        </a>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>게스트 지원</span>
      </div>

      {/* 페이지 타이틀 — 시안 라인 56~59 */}
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">GUEST APPLY · 게스트 지원</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
          게스트로 지원하기
        </h1>
      </div>

      {/* 메인 그리드: 폼(좌) + sticky 사이드(우 340px) — 시안 라인 61 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 340px",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        {/* 좌측 폼 카드 */}
        <div className="card" style={{ padding: "24px 28px" }}>
          {/* 지원 대상 요약 — 시안 라인 64~68 */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".08em",
                marginBottom: 4,
              }}
            >
              지원 대상
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{g.title}</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "var(--ff-mono)" }}>
              {g.when} · {g.court} · {g.level}
            </div>
          </div>

          {/* 내 정보: 포지션 + 구력 — 시안 라인 70~94 */}
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>내 정보</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink-dim)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                주 포지션 *
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["G", "F", "C"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPos(p)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      // 선택된 포지션은 액센트 배경 — 시안 라인 77 박제
                      background: pos === p ? "var(--accent)" : "var(--bg-alt)",
                      color: pos === p ? "#fff" : "var(--ink)",
                      border: 0,
                      borderRadius: 4,
                      cursor: "pointer",
                      fontFamily: "var(--ff-display)",
                      fontWeight: 800,
                      fontSize: 15,
                      letterSpacing: ".02em",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink-dim)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                구력
              </label>
              <select
                className="input"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
              >
                {EXP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 내 프로필 미리보기 (호스트가 보는 카드) — 시안 라인 96~103 */}
          {/* Avatar 컴포넌트는 시안 전용이라 인라인 div 박스로 대체 (lucide-react 등 외부 라이브러리 금지 규칙 준수) */}
          <div
            style={{
              padding: "12px 14px",
              background: "var(--bg-alt)",
              borderRadius: 4,
              marginBottom: 18,
              display: "grid",
              gridTemplateColumns: "40px 1fr auto",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                // 디자인 토큰 사용 — Cafe Blue
                background: "var(--cafe-blue)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--ff-display)",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: ".02em",
              }}
            >
              ME
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>@me_player · Lv.6</div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontFamily: "var(--ff-mono)",
                }}
              >
                매너 4.8 · 픽업 23회 · 노쇼 0
              </div>
            </div>
            <span className="badge badge--ok">인증</span>
          </div>

          {/* 호스트에게 한마디 — 시안 라인 105~117 */}
          <h2 style={{ margin: "24px 0 10px", fontSize: 16, fontWeight: 700 }}>호스트에게 한마디</h2>
          <textarea
            className="input"
            rows={4}
            value={msg}
            // 시안 placeholder 그대로
            onChange={(e) => setMsg(e.target.value.slice(0, 300))}
            placeholder="예: 슛이 좋은 편이고, 처음이지만 열심히 뛰겠습니다. 혹시 주차 가능할까요?"
            style={{ resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
              수락 확률을 높이는 좋은 소개말을 적어주세요
            </span>
            <span style={{ fontSize: 11, color: "var(--ink-dim)", fontFamily: "var(--ff-mono)" }}>
              {msg.length}/300
            </span>
          </div>

          {/* 약관 동의 — 시안 라인 119~130 */}
          <h2 style={{ margin: "24px 0 10px", fontSize: 16, fontWeight: 700 }}>약관 동의</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ACCEPT_ITEMS.map((t) => (
              <label
                key={t.k}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13,
                  cursor: "pointer",
                  alignItems: "flex-start",
                }}
              >
                <input
                  type="checkbox"
                  checked={accept[t.k]}
                  onChange={(e) =>
                    setAccept((prev) => ({ ...prev, [t.k]: e.target.checked }))
                  }
                  style={{ marginTop: 3 }}
                />
                <span>
                  <span style={{ color: "var(--err)", fontWeight: 800, marginRight: 2 }}>*</span>
                  {t.l}
                </span>
              </label>
            ))}
          </div>

          {/* 푸터: 취소 + 지원 버튼 — 시안 라인 132~139 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              className="btn"
              type="button"
              onClick={() => router.push(`/games/${gameId}`)}
            >
              ← 취소
            </button>
            <button
              className="btn btn--primary btn--lg"
              type="button"
              // 약관 둘 다 체크 안 되면 버튼 비활성화 — 시안 라인 136 박제
              // submitting 중에도 비활성화 (중복 신청 방지)
              disabled={!accept.insurance || !accept.cancel || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "지원 중..." : "게스트로 지원하기"}
            </button>
          </div>
        </div>

        {/* 우측 sticky aside — 시안 라인 142~164 */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "sticky",
            top: 120,
          }}
        >
          {/* 호스트가 보는 것 박스 */}
          <div className="card" style={{ padding: "16px 18px", background: "var(--bg-alt)" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 800,
                letterSpacing: ".1em",
                marginBottom: 8,
              }}
            >
              💡 호스트가 보는 것
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                fontSize: 12,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
              }}
            >
              <li>내 아이디·매너점수·레벨</li>
              <li>주 포지션과 구력</li>
              <li>호스트에게 남긴 메시지</li>
              <li>과거 픽업 이력 (노쇼 여부)</li>
            </ul>
          </div>

          {/* 예상 대기시간 박스 — placeholder 값 */}
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 700, marginBottom: 6 }}>
              예상 대기 시간
            </div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 900 }}>
              ~ 2시간
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>
              이 호스트 평균 응답
            </div>
          </div>

          {/* 동시 지원 안내 박스 — placeholder 값 */}
          <div className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 700, marginBottom: 6 }}>
              동시 지원
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ink-soft)" }}>
              다른 경기 <b>2개</b>에 동시 지원 중. 어느 쪽이든 수락되면 자동으로 나머지는 취소됩니다.
            </div>
            <a
              onClick={() => router.push("/games/my-games")}
              style={{
                fontSize: 11,
                color: "var(--cafe-blue)",
                cursor: "pointer",
                fontWeight: 700,
                marginTop: 6,
                display: "inline-block",
              }}
            >
              지원 현황 보기 →
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
