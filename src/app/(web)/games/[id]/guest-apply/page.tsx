"use client";

// Phase 9 P1-2b — 게스트 지원 신규 라우트 (UI only 박제)
// 시안 출처: Dev/design/BDR v2 (1)/screens/GuestApply.jsx
// 단일 client 페이지: 시안이 단순 폼 + submitted 분기뿐이라 server wrapper 불필요.
// DB/API 연결 0건 — game 카드는 placeholder 더미.
// 실제 game_applications 저장 / 호스트 알림 / 승인 흐름 / 결제는 추후 구현 (scratchpad 항목 신설).

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

// 시안 fallback game 더미 — 실제 DB 조회 안 함
const PLACEHOLDER_GAME = {
  title: "토요 아침 픽업 @ 장충",
  when: "2026.04.27 (토) 07:00 - 09:00",
  court: "장충체육관 B코트",
  host: { name: "3POINT", tag: "3PT" },
  level: "중급",
  fee: "5,000원",
};

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

export default function GuestApplyPage() {
  const router = useRouter();
  // Next.js 15 client params — Promise 가 아닌 record 형태로 즉시 사용 가능
  const params = useParams<{ id: string }>();
  const gameId = params?.id ?? "";

  // 시안 라인 13~17 박제: submitted/pos/exp/msg/accept 5개 state
  const [submitted, setSubmitted] = useState(false);
  const [pos, setPos] = useState<"G" | "F" | "C">("G");
  const [exp, setExp] = useState("2");
  const [msg, setMsg] = useState("");
  const [accept, setAccept] = useState<Record<AcceptKey, boolean>>({
    insurance: true,
    cancel: false,
  });

  const g = PLACEHOLDER_GAME;

  // 지원 버튼 핸들러 — DB 미연결이라 alert + state 만 토글
  // 추후 game_applications API 연결 시 fetch POST 로 교체
  function handleSubmit() {
    alert("준비 중 — 게스트 지원 기능은 game_applications API 연결 후 활성화됩니다");
    setSubmitted(true);
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
                background: "#0F5FCC",
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
              disabled={!accept.insurance || !accept.cancel}
              onClick={handleSubmit}
            >
              게스트로 지원하기
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
