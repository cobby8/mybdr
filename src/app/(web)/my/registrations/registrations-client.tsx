/* ============================================================
 * MyRegistrationsClient — /my/registrations 본문 (M2 wave2)
 *
 * 이유: 내가 신청한 경기 상태(신청완료·확정·대기 N번·승격 확정 대기)를 한 화면에.
 *   시안 MyRegistrationStatus.jsx 박제 — 단, mock 4행 대신 실제
 *   GET /api/web/me/registrations 응답으로 채운다.
 *
 * 상태 분기(파생):
 *   status 0 → applied(신청완료) / 1 → confirmed(확정) / 2 → rejected(거절)
 *   status 3 → promotion_deadline 가 미래면 promoted(승격·확정 대기) / 아니면 waiting(대기 N번)
 *
 * 액션:
 *   - 승격(promoted): POST .../applications/[appId]/confirm (카운트다운 표시)
 *   - 대기(waiting)/신청완료(applied): DELETE .../apply/cancel (신청·대기 취소)
 *
 * ⚠️ 응답 snake_case 자동 변환 — 접근자도 snake_case.
 * 디자인: var(--*) 토큰만 / Material Symbols / 720px 분기 / 44px 터치.
 * ============================================================ */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 응답 item 타입 — /api/web/me/registrations (snake_case)
interface RegGame {
  id: string;
  uuid: string | null;
  short_id: string | null;
  title: string | null;
  game_type: number; // 0=픽업/1=게스트/2=연습
  scheduled_at: string | null;
  venue_name: string | null;
  city: string | null;
  district: string | null;
  status: number; // 1=모집중/2=확정/3=완료/4=취소
  max_participants: number | null;
  current_participants: number | null;
}
interface RegItem {
  id: string; // 신청 id (confirm 대상)
  status: number; // 0=신청완료/1=확정/2=거절/3=대기
  waitlist_position: number | null;
  promotion_deadline: string | null;
  created_at: string;
  game: RegGame | null;
}

// 파생 상태 키 (시안 STATUS enum 과 매핑)
type RegStateKey = "promoted" | "waiting" | "confirmed" | "applied" | "rejected";

// 신청 status(+deadline) → 파생 상태 키.
function deriveState(item: RegItem): RegStateKey {
  if (item.status === 1) return "confirmed";
  if (item.status === 2) return "rejected";
  if (item.status === 3) {
    const promoted =
      item.promotion_deadline != null &&
      new Date(item.promotion_deadline).getTime() > Date.now();
    return promoted ? "promoted" : "waiting";
  }
  return "applied"; // status 0
}

// 상태 키 → 배지 라벨 + 토큰 색상
const STATE_META: Record<
  RegStateKey,
  { label: string; tone: string }
> = {
  promoted: { label: "승격 · 확정 대기", tone: "var(--accent)" },
  waiting: { label: "대기중", tone: "var(--warn)" },
  confirmed: { label: "확정", tone: "var(--ok)" },
  applied: { label: "신청완료", tone: "var(--cafe-blue)" },
  rejected: { label: "거절", tone: "var(--ink-mute)" },
};

// game_type → 아이콘 (Material Symbols — lucide 금지)
const KIND_ICON: Record<number, string> = {
  0: "sports_basketball", // 픽업
  1: "group_add", // 게스트
  2: "fitness_center", // 연습
};

// 남은 초 (음수=0 클램프) — 카운트다운 표시용
function secondsLeft(deadlineIso: string | null): number {
  if (!deadlineIso) return 0;
  const diff = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

// 일시 포맷 — "M/D (요일) HH:mm"
const KO_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;
function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = KO_WEEKDAY[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} (${w}) ${hh}:${mi}`;
}

// 상세 딥링크 — short_id 우선
function gameHref(game: RegGame | null): string {
  if (!game) return "/games";
  if (game.short_id) return `/games/${game.short_id}`;
  if (game.uuid) return `/games/${game.uuid.slice(0, 8)}`;
  return `/games/${game.id}`;
}

// 카운트다운 텍스트 — 1초 갱신 (승격 행 표시용)
function CountdownText({ deadline }: { deadline: string }) {
  const [left, setLeft] = useState<number>(() => secondsLeft(deadline));
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft(secondsLeft(deadline)), 1000);
    return () => clearInterval(t);
  }, [left, deadline]);
  if (left <= 0) {
    return (
      <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>마감 임박</span>
    );
  }
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>
      {mm}:{ss} 남음
    </span>
  );
}

export function MyRegistrationsClient() {
  const router = useRouter();
  const [items, setItems] = useState<RegItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // 데이터 fetch (읽기 전용)
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/web/me/registrations", {
        credentials: "include",
      });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const json = (await res.json()) as { items?: RegItem[] };
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 승격 확정 — POST confirm. 410/409 도 안내 후 새로고침.
  async function confirmPromotion(item: RegItem) {
    const g = item.game;
    if (!g) return;
    setBusyId(item.id);
    try {
      const shortId = g.short_id ?? g.uuid?.slice(0, 8) ?? g.id;
      const res = await fetch(
        `/api/web/games/${shortId}/applications/${item.id}/confirm`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        alert(data.message ?? "참가가 확정되었습니다.");
      } else if (res.status === 410) {
        alert(data.error ?? "승격 확정 시간이 만료되었습니다. 다음 순번으로 넘어갑니다.");
      } else if (res.status === 409) {
        alert(data.error ?? "정원이 다시 마감되어 확정할 수 없습니다.");
      } else {
        alert(data.error ?? "확정 처리 중 오류가 발생했습니다.");
      }
      await load();
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  // 신청/대기 취소 — DELETE apply/cancel (status 0/3 모두 처리)
  async function cancelRegistration(item: RegItem) {
    const g = item.game;
    if (!g) return;
    if (!confirm("신청을 취소하시겠습니까?")) return;
    setBusyId(item.id);
    try {
      const shortId = g.short_id ?? g.uuid?.slice(0, 8) ?? g.id;
      const res = await fetch(`/api/web/games/${shortId}/apply/cancel`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        alert(data.error ?? "취소 중 오류가 발생했습니다.");
      }
      await load();
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  // 상태별 카운트 (counters)
  const counts = {
    confirmed: 0,
    promoted: 0,
    waiting: 0,
    applied: 0,
  };
  (items ?? []).forEach((it) => {
    const k = deriveState(it);
    if (k === "confirmed") counts.confirmed += 1;
    else if (k === "promoted") counts.promoted += 1;
    else if (k === "waiting") counts.waiting += 1;
    else if (k === "applied") counts.applied += 1;
  });

  return (
    <div className="page">
      {/* 빵부스러기 */}
      <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 10 }}>
        <Link href="/profile" style={{ color: "var(--ink-mute)" }}>
          프로필
        </Link>{" "}
        › <span style={{ color: "var(--ink)" }}>내 신청 현황</span>
      </div>

      {/* 헤더 */}
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">내 신청 · REGISTRATIONS</div>
        <h1
          style={{
            margin: "6px 0 4px",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          내 신청 현황
        </h1>
        <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
          신청 · 대기 · 확정 상태를 한 화면에서 관리하세요
        </div>
      </div>

      {/* 승격 알림 배너 — 승격(확정 대기) 1건 이상일 때만 (mock 금지) */}
      {counts.promoted > 0 && (
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            borderLeft: "3px solid var(--accent)",
            background: "color-mix(in srgb, var(--accent) 7%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 26, color: "var(--accent)" }}
            aria-hidden
          >
            notifications_active
          </span>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>
              자리가 났어요 · 지금 확정하세요
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
              대기 1번 경기의 빈자리가 발생했습니다
            </div>
          </div>
        </div>
      )}

      {/* counters 4종 — 모바일 2x2 / sm+ 1x4 */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-[18px]"
      >
        {[
          { n: counts.confirmed, lbl: "확정", tone: "var(--ok)" },
          { n: counts.promoted, lbl: "확정 대기", tone: "var(--accent)" },
          { n: counts.waiting, lbl: "대기중", tone: "var(--warn)" },
          { n: counts.applied, lbl: "신청완료", tone: "var(--cafe-blue)" },
        ].map((c, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: "14px 16px", borderTop: `3px solid ${c.tone}` }}
          >
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 32,
                fontWeight: 900,
                lineHeight: 1,
                color: c.tone,
              }}
            >
              {c.n}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>
              {c.lbl}
            </div>
          </div>
        ))}
      </div>

      {/* 본문 — 로딩 / 빈 상태 / 리스트 */}
      {items === null ? (
        <div
          className="py-12 text-center text-sm"
          style={{ color: "var(--ink-mute)" }}
        >
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 py-12 text-center"
          style={{
            border: "1px dashed var(--border)",
            borderRadius: 4,
            color: "var(--ink-mute)",
          }}
        >
          <span
            className="material-symbols-outlined text-4xl"
            style={{ color: "var(--ink-mute)" }}
            aria-hidden
          >
            sports_basketball
          </span>
          <p className="text-sm">아직 신청한 경기가 없어요</p>
          <Link
            href="/games"
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wide"
            style={{ backgroundColor: "var(--accent)", color: "var(--ink-on-brand)", borderRadius: 4 }}
          >
            경기 둘러보기
            <span className="material-symbols-outlined text-sm" aria-hidden>
              arrow_forward
            </span>
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {items.map((it, i) => (
            <RegRow
              key={it.id}
              item={it}
              isLast={i === items.length - 1}
              busy={busyId === it.id}
              onConfirm={() => confirmPromotion(it)}
              onCancel={() => cancelRegistration(it)}
            />
          ))}
        </div>
      )}

      {/* 하단 빠른 이동 */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Link href="/games" className="btn" style={{ textDecoration: "none" }}>
          경기 더 찾기
        </Link>
        <Link
          href="/profile/activity"
          className="btn"
          style={{ textDecoration: "none" }}
        >
          내 활동 전체
        </Link>
      </div>

      {/* 모바일 분기 — 720px 이하에서 행 그리드/액션 재배치 */}
      <style>{`
        @media (max-width: 720px) {
          .reg-row { grid-template-columns: 32px 1fr !important; }
          .reg-actions { grid-column: 1 / -1; justify-content: flex-start !important; margin-top: 6px; }
        }
      `}</style>
    </div>
  );
}

// 개별 신청 행 — 아이콘 + 배지/순번/카운트다운/일시 + 타이틀/장소 + 액션
function RegRow({
  item,
  isLast,
  busy,
  onConfirm,
  onCancel,
}: {
  item: RegItem;
  isLast: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const stateKey = deriveState(item);
  const meta = STATE_META[stateKey];
  const g = item.game;
  const when = formatWhen(g?.scheduled_at ?? null);
  const place = g?.venue_name ?? [g?.city, g?.district].filter(Boolean).join(" ") ?? "";

  return (
    <div
      className="reg-row"
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "16px 18px",
        borderBottom: isLast ? 0 : "1px solid var(--border)",
        borderLeft: `3px solid ${meta.tone}`,
      }}
    >
      {/* 종별 아이콘 */}
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 24, color: "var(--ink-mute)" }}
        aria-hidden
      >
        {KIND_ICON[g?.game_type ?? 0] ?? "sports_basketball"}
      </span>

      {/* 본문 */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          {/* 상태 배지 */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              background: `color-mix(in srgb, ${meta.tone} 15%, transparent)`,
              color: meta.tone,
            }}
          >
            {meta.label}
          </span>
          {/* 대기 N번 (waiting) */}
          {stateKey === "waiting" && item.waitlist_position != null && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "var(--warn)",
                fontFamily: "var(--ff-mono)",
              }}
            >
              대기 {item.waitlist_position}번
            </span>
          )}
          {/* 카운트다운 (promoted) */}
          {stateKey === "promoted" && item.promotion_deadline && (
            <span style={{ fontSize: 12, color: "var(--accent)" }}>
              <CountdownText deadline={item.promotion_deadline} />
            </span>
          )}
          {when && (
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
              }}
            >
              {when}
            </span>
          )}
        </div>
        <Link
          href={gameHref(g)}
          style={{
            display: "block",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--ink)",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {g?.title ?? "경기"}
        </Link>
        {place && (
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 1 }}>
            {place}
          </div>
        )}
      </div>

      {/* 액션 — 상태별 */}
      <div
        className="reg-actions"
        style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}
      >
        {stateKey === "promoted" && (
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={onConfirm}
            disabled={busy}
            style={{ minHeight: 44 }}
          >
            {busy ? "확정 중..." : "확정"}
          </button>
        )}
        {(stateKey === "waiting" || stateKey === "applied") && (
          <button
            type="button"
            className="btn btn--sm"
            onClick={onCancel}
            disabled={busy}
            style={{ minHeight: 44 }}
          >
            {busy ? "처리 중..." : stateKey === "waiting" ? "대기 취소" : "신청 취소"}
          </button>
        )}
        {(stateKey === "confirmed" || stateKey === "rejected") && (
          <Link
            href={gameHref(g)}
            className="btn btn--sm"
            style={{ textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
          >
            상세
          </Link>
        )}
      </div>
    </div>
  );
}
