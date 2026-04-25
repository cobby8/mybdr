"use client";

/* ============================================================
 * BookingClient — 회원용 예약 화면 (Phase A)
 *
 * 시안: Dev/design/BDR v2/screens/CourtBooking.jsx
 * 차이점:
 *   - 시안의 코트 멀티 선택 → 본 페이지는 단일 코트 (URL 진입한 코트만)
 *   - 시안의 mock 슬롯 → SWR 로 /api/web/courts/[id]/bookings?date=... 조회
 *   - 시안의 BDR+ 할인 라인은 유지하되 Phase A 는 0원 표시
 *   - "결제하고 예약 확정" → Phase A 는 final_amount=0 무료 확정 (텍스트도 "무료 예약 확정"으로 변경)
 * ============================================================ */

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 시간대 슬롯 — 06~21시 (시안과 동일)
const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i);

// 시안 4종 목적
const PURPOSES = [
  { id: "pickup", l: "픽업경기", d: "개인 모집" },
  { id: "team", l: "팀 훈련", d: "팀원 전용" },
  { id: "scrim", l: "스크림", d: "팀간 연습" },
  { id: "private", l: "개인 연습", d: "혼자/소규모" },
] as const;

// 7일 날짜 배열 생성 — 오늘부터 +6일 (KST 기준)
function generateDays() {
  const days: { ds: string; day: number; dow: string; weekend: boolean }[] = [];
  const dows = ["일", "월", "화", "수", "목", "금", "토"];
  // KST 자정 기준
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKst = new Date(Date.now() + kstOffset);
  const baseY = nowKst.getUTCFullYear();
  const baseM = nowKst.getUTCMonth();
  const baseD = nowKst.getUTCDate();
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(baseY, baseM, baseD + i));
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const dow = d.getUTCDay();
    days.push({
      ds: `${yyyy}-${mm}-${dd}`,
      day: d.getUTCDate(),
      dow: dows[dow],
      weekend: dow === 0 || dow === 6,
    });
  }
  return days;
}

// API 응답 타입 (snake_case)
interface BookingItem {
  id: string;
  start_at: string;
  end_at: string;
  duration_hours: number;
  status: string;
  purpose: string;
}
interface BookingsResponse {
  court?: { id: string; booking_fee_per_hour: number | null };
  day?: string;
  bookings?: BookingItem[];
}

interface CourtData {
  id: string;
  name: string;
  address: string;
  area: string | null;
  court_type: string;
  average_rating: number | null;
  booking_fee_per_hour: number;
  facilities: string[];
  primary_color: string;
}

export function BookingClient({ court }: { court: CourtData }) {
  const router = useRouter();
  const days = useMemo(() => generateDays(), []);
  const [date, setDate] = useState(days[0].ds);
  const [hour, setHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(2);
  const [purpose, setPurpose] = useState<string>("pickup");
  const [expectedCount, setExpectedCount] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 선택 일자 활성 슬롯 조회 (SWR)
  const { data, isLoading } = useSWR<BookingsResponse>(
    `/api/web/courts/${court.id}/bookings?date=${date}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // 시안의 점유 시간 계산 — bookings 의 start~end 안에 들어오는 정시 시간을 모두 점유로 표시
  const occupiedHours = useMemo(() => {
    const set = new Set<number>();
    if (!data?.bookings) return set;
    for (const b of data.bookings) {
      const start = new Date(b.start_at);
      const end = new Date(b.end_at);
      // 해당 일자 KST 자정~익일 자정 범위로 자름
      const dayStart = new Date(`${date}T00:00:00+09:00`);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const s = new Date(Math.max(start.getTime(), dayStart.getTime()));
      const e = new Date(Math.min(end.getTime(), dayEnd.getTime()));
      // KST hour 기준으로 점유 시간 채움
      for (let t = s.getTime(); t < e.getTime(); t += 60 * 60 * 1000) {
        const kst = new Date(t + 9 * 60 * 60 * 1000);
        set.add(kst.getUTCHours());
      }
    }
    return set;
  }, [data?.bookings, date]);

  const fee = court.booking_fee_per_hour;
  const total = hour !== null ? fee * duration : 0;
  const discount = 0; // Phase A: BDR+ 할인 미적용 (시안 0% 표시)
  const finalAmount = 0; // Phase A: 무료 확정 강제
  const accentColor = court.primary_color || "var(--accent)";

  // 시간 라벨 (HH:00 형식)
  const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

  // 예약 확정 — POST /api/web/courts/[id]/bookings
  async function handleSubmit() {
    if (hour === null) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      // 선택 KST → UTC ISO 변환
      const startKstIso = `${date}T${hourLabel(hour)}:00+09:00`;
      const startAt = new Date(startKstIso).toISOString();
      const res = await fetch(`/api/web/courts/${court.id}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_at: startAt,
          duration_hours: duration,
          purpose,
          expected_count: expectedCount,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // 충돌(409) 또는 기타 에러
        const msg =
          (typeof json?.error === "string" && json.error) ||
          "예약 처리 중 오류가 발생했습니다";
        setErrorMsg(msg);
        // 슬롯 변동 가능성 → 다시 fetch
        await mutate(`/api/web/courts/${court.id}/bookings?date=${date}`);
        return;
      }
      // 성공 → /profile/bookings 로 이동
      router.push("/profile/bookings?just_booked=1");
    } catch (e) {
      setErrorMsg("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      {/* 브레드크럼 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <Link href="/" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/courts" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          코트
        </Link>
        <span>›</span>
        <Link
          href={`/courts/${court.id}`}
          style={{ color: "var(--ink-mute)", textDecoration: "none" }}
        >
          {court.name}
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>예약</span>
      </div>

      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".12em",
            color: "var(--ink-dim)",
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          COURT BOOKING · 코트 대관
        </div>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          {court.name} 예약
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            color: "var(--ink-mute)",
            fontSize: 13,
          }}
        >
          시간 단위로 예약하세요. 환불 정책은 운영자에게 문의 — Phase A 는 무료 예약 단계입니다.
        </p>
      </div>

      {/* 본문 그리드 */}
      <div
        className="court-booking-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        {/* 좌측 — 선택 카드 */}
        <div>
          {/* 1. 날짜 선택 */}
          <div className="card" style={{ padding: "18px 20px", marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 800,
                letterSpacing: ".12em",
                marginBottom: 10,
              }}
            >
              1. 날짜 선택
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 6,
              }}
            >
              {days.map((d) => (
                <button
                  key={d.ds}
                  onClick={() => {
                    setDate(d.ds);
                    setHour(null); // 날짜 바꾸면 시간 초기화
                  }}
                  style={{
                    padding: "10px 0",
                    background:
                      date === d.ds ? accentColor : "var(--bg-alt)",
                    color: date === d.ds ? "#fff" : "var(--ink)",
                    border: 0,
                    borderRadius: 4,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700 }}>
                    {d.dow}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--ff-display)",
                      fontSize: 20,
                      fontWeight: 900,
                      letterSpacing: "-0.01em",
                      color:
                        d.weekend && date !== d.ds
                          ? d.dow === "일"
                            ? "var(--err)"
                            : "var(--cafe-blue)"
                          : undefined,
                    }}
                  >
                    {d.day}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. 시간 선택 */}
          <div className="card" style={{ padding: "18px 20px", marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontWeight: 800,
                  letterSpacing: ".12em",
                }}
              >
                2. 시간 선택
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  fontFamily: "var(--ff-mono)",
                }}
              >
                {isLoading
                  ? "불러오는 중…"
                  : `${HOURS.length - occupiedHours.size}/${HOURS.length} 예약가능`}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {HOURS.map((h) => {
                const occupied = occupiedHours.has(h);
                const isSelected = hour === h;
                return (
                  <button
                    key={h}
                    disabled={occupied || isLoading}
                    onClick={() => setHour(h)}
                    style={{
                      padding: "12px 8px",
                      background: isSelected
                        ? accentColor
                        : occupied
                        ? "var(--bg)"
                        : "var(--bg-alt)",
                      color: isSelected
                        ? "#fff"
                        : occupied
                        ? "var(--ink-dim)"
                        : "var(--ink)",
                      border: isSelected ? 0 : "1px solid var(--border)",
                      borderRadius: 4,
                      cursor: occupied ? "not-allowed" : "pointer",
                      textAlign: "center",
                      opacity: occupied ? 0.55 : 1,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {hourLabel(h)}
                    </div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>
                      {occupied ? "예약 마감" : "예약가능"}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* 이용 시간 (1~4) */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                이용 시간
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[1, 2, 3, 4].map((h) => (
                  <button
                    key={h}
                    onClick={() => setDuration(h)}
                    className={`btn btn--sm ${duration === h ? "btn--primary" : ""}`}
                  >
                    {h}시간
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 이용 목적 */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 800,
                letterSpacing: ".12em",
                marginBottom: 10,
              }}
            >
              3. 이용 목적
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {PURPOSES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPurpose(p.id)}
                  style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    background:
                      purpose === p.id ? "var(--bg-alt)" : "transparent",
                    border:
                      purpose === p.id
                        ? `2px solid ${accentColor}`
                        : "1px solid var(--border)",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "var(--ink)",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.l}</div>
                  <div
                    style={{ fontSize: 10, color: "var(--ink-dim)", marginTop: 2 }}
                  >
                    {p.d}
                  </div>
                </button>
              ))}
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                참가인원 (예상)
              </div>
              <input
                className="input"
                type="number"
                value={expectedCount}
                min={1}
                max={30}
                onChange={(e) =>
                  setExpectedCount(
                    Math.max(1, Math.min(30, Number(e.target.value) || 1))
                  )
                }
                style={{ width: 120 }}
              />
            </div>
          </div>
        </div>

        {/* 우측 — 요약 카드 */}
        <aside className="court-booking-aside" style={{ position: "sticky", top: 120 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                background: `linear-gradient(135deg, ${accentColor}, #000)`,
                color: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: ".12em",
                  opacity: 0.85,
                  fontWeight: 800,
                }}
              >
                BOOKING SUMMARY
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>
                {court.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.85,
                  fontFamily: "var(--ff-mono)",
                  marginTop: 2,
                }}
              >
                {court.area ?? ""}
                {court.average_rating ? ` · ★ ${court.average_rating.toFixed(1)}` : ""}
              </div>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <SummaryRow label="날짜" value={date} mono />
                <SummaryRow
                  label="시간"
                  value={hour !== null ? `${hourLabel(hour)} (${duration}시간)` : "선택 필요"}
                  missing={hour === null}
                  mono
                />
                <SummaryRow
                  label="목적"
                  value={
                    PURPOSES.find((p) => p.id === purpose)?.l ?? "픽업경기"
                  }
                />
                <SummaryRow
                  label="시설"
                  value={court.facilities.length > 0 ? court.facilities.join(" · ") : "-"}
                />
              </div>

              {/* 금액 영역 — Phase A 는 모두 0 */}
              <div
                style={{
                  borderTop: "1px dashed var(--border)",
                  paddingTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 14,
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ink-mute)" }}>
                    대관료 (₩{fee.toLocaleString()} × {duration}H)
                  </span>
                  <span style={{ fontFamily: "var(--ff-mono)" }}>
                    ₩{total.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--ok)",
                  }}
                >
                  <span>BDR+ 할인 (Phase D 도입 예정)</span>
                  <span style={{ fontFamily: "var(--ff-mono)" }}>
                    − ₩{discount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                  결제금액
                </span>
                <span
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontSize: 26,
                    fontWeight: 900,
                    color: accentColor,
                  }}
                >
                  무료
                </span>
              </div>

              {/* 에러 메시지 */}
              {errorMsg && (
                <div
                  style={{
                    background:
                      "color-mix(in srgb, var(--err) 12%, transparent)",
                    color: "var(--err)",
                    padding: "8px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                className="btn btn--primary btn--xl"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleSubmit}
                disabled={hour === null || submitting || isLoading}
              >
                {submitting
                  ? "처리 중…"
                  : hour === null
                  ? "시간을 선택해주세요"
                  : "무료 예약 확정"}
              </button>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  marginTop: 10,
                  lineHeight: 1.5,
                }}
              >
                · Phase A (무료 베타) — 결제 미도입
                <br />· 취소는 내 예약 페이지에서 가능
                <br />· 환불 정책 자동화는 Phase C 도입 예정
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 반응형 */}
      <style jsx>{`
        @media (min-width: 900px) {
          :global(.court-booking-grid) {
            grid-template-columns: minmax(0, 1fr) 340px !important;
          }
        }
        @media (max-width: 899px) {
          :global(.court-booking-aside) {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  missing,
  mono,
}: {
  label: string;
  value: string;
  missing?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        gap: 10,
      }}
    >
      <span style={{ color: "var(--ink-dim)", fontWeight: 700 }}>{label}</span>
      <span
        style={{
          fontWeight: missing ? 600 : 700,
          fontFamily: mono ? "var(--ff-mono)" : "inherit",
          color: missing ? "var(--err)" : "var(--ink)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
