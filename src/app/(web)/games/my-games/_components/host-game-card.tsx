"use client";

/* ============================================================
 * HostGameCard — [M6 E-2] 내가 만든 경기 호스트 운영 카드
 *
 * 왜 client 컴포넌트:
 *   - 빠른 액션 중 "취소"는 confirm 후 DELETE 호출(서버 write) → 상호작용 필요.
 *   - 취소/마감확정 후 화면 갱신(router.refresh).
 *
 * 시안 MyGames.jsx E-2 호스트 카드 박제:
 *   - 종류 배지 + 상태 배지 + 지역
 *   - 제목 / 코트 · 일시
 *   - 신청 현황 칩: 승인 N/정원 · 승인대기 N · 대기열 N (page.tsx groupBy 집계)
 *   - 빠른 액션: 신청 관리(상세/E-1) · 마감·확정 · 수정 · 취소
 *
 * 데이터 패칭:
 *   - 취소 = 기존 DELETE /api/web/games/[uuid] 재사용(soft delete status=4 + 신청자 알림).
 *   - 신청 관리/수정 = 페이지 라우팅(상세 E-1 / 수정 폼).
 *   - 마감·확정(status 1→2) = [M6 보완①] 신규 POST /api/web/games/[uuid]/close.
 *     호스트만·모집중(1)일 때만 확정(2)으로 전환. 정원 충족 시 자동확정(M1)과 충돌 없도록
 *     '정원 미충족 모집중' 일 때만 버튼 노출(isFull 이면 숨김).
 *
 * 디자인: var(--*) 토큰만 · Material Symbols · pill 9999px 금지(칩=radius-chip) ·
 *   터치 44px · 720px 분기는 부모 grid 가 담당.
 * ============================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface HostGameCardData {
  /** games.id (string) — key 용 */
  id: string;
  /** 상세/수정 라우팅용 식별자 (short uuid 8자 또는 id) */
  href: string;
  /** 취소 API 용 full uuid (없으면 취소 버튼 비활성) */
  uuid: string | null;
  /** 경기 종류 코드 — 0=픽업, 1=게스트, 2=연습경기 (games.game_type Int) */
  gameType: number | null;
  /** game status: 1=모집중 2=확정 3=완료 4=취소 */
  status: number;
  title: string | null;
  /** 코트명 · 지역 등 메타 라인 */
  metaLine: string;
  areaLabel: string;
  /** 신청 현황 집계 */
  approved: number;
  pending: number;
  waiting: number;
  maxParticipants: number | null;
}

// 경기 종류 라벨/색 — game_type Int 코드(0=픽업/1=게스트/2=연습경기) 기준 (GameCard 정합)
const KIND_LABEL: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "연습경기",
};
function kindColor(t: number | null): string {
  if (t === 1) return "var(--accent)"; // 게스트
  if (t === 2) return "var(--ok)"; // 연습경기
  return "var(--cafe-blue)"; // 픽업(0) / 기타
}

// game status → 라벨/배지 클래스 (game-status.ts 정본과 동일 의미)
const STATUS_META: Record<number, { label: string; cls: string }> = {
  1: { label: "모집중", cls: "badge--ok" },
  2: { label: "확정", cls: "badge--blue" },
  3: { label: "완료", cls: "badge--ghost" },
  4: { label: "취소", cls: "badge--ghost" },
};

export function HostGameCard({ g }: { g: HostGameCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const cancelled = g.status === 4;
  const done = g.status === 3;
  const recruiting = g.status === 1;
  const kc = kindColor(g.gameType);
  const st = STATUS_META[g.status] ?? { label: "—", cls: "badge--ghost" };
  const kindLabel =
    g.gameType != null && g.gameType in KIND_LABEL ? KIND_LABEL[g.gameType] : "경기";
  const isFull = g.maxParticipants != null && g.approved >= g.maxParticipants;

  // 마감·확정 — [M6 보완①] 신규 POST /close 호출(status 1→2). confirm 후 호출.
  //   정원 미충족 상태에서 호스트가 수동으로 모집을 닫고 경기를 확정.
  async function handleClose() {
    if (!g.uuid) {
      alert("이 경기는 마감·확정할 수 없습니다.");
      return;
    }
    if (
      !confirm(
        "모집을 마감하고 경기를 확정할까요? 확정 후에는 새 신청을 받지 않습니다."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/web/games/${g.uuid}/close`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "마감·확정 처리 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  // 취소 — 기존 DELETE 재사용(full uuid). confirm 후 호출.
  async function handleCancel() {
    if (!g.uuid) {
      alert("이 경기는 취소할 수 없습니다.");
      return;
    }
    if (!confirm("경기를 취소하면 신청자 전원에게 취소 알림이 발송됩니다. 되돌릴 수 없습니다. 취소할까요?")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/web/games/${g.uuid}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? "취소 처리 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: cancelled ? 0.6 : 1,
      }}
    >
      {/* 상단 컬러 바 — 종류 색 (취소 시 무채) */}
      <div style={{ height: 3, background: cancelled ? "var(--ink-dim)" : kc }} />
      <div
        style={{
          padding: "16px 18px 14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* 배지 줄: 종류 + 상태 + 지역 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            className="badge"
            style={{ background: kc, color: "var(--ink-on-brand)", borderColor: kc }}
          >
            {kindLabel}
          </span>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          {g.areaLabel && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--ff-mono)",
                color: "var(--cafe-blue)",
                marginLeft: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {g.areaLabel}
            </span>
          )}
        </div>

        {/* 제목 */}
        <Link
          href={g.href}
          style={{
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.4,
            marginBottom: 6,
            color: "var(--ink)",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {g.title ?? "제목 없음"}
        </Link>
        {/* 메타 라인 */}
        <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 12 }}>
          {g.metaLine}
        </div>

        {/* 신청 현황 칩 — 승인 N/정원 · 승인대기 · 대기열 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: "var(--radius-chip)",
              background: "var(--bg-alt)",
              fontFamily: "var(--ff-mono)",
              fontWeight: 700,
            }}
          >
            승인{" "}
            <span style={{ color: isFull ? "var(--accent)" : "var(--ink)" }}>
              {g.approved}/{g.maxParticipants ?? "?"}
            </span>
          </span>
          {g.pending > 0 && !cancelled && !done && (
            <span
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: "var(--radius-chip)",
                background: "color-mix(in srgb, var(--warn) 14%, transparent)",
                color: "var(--warn)",
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
              }}
            >
              승인 대기 {g.pending}
            </span>
          )}
          {g.waiting > 0 && !cancelled && !done && (
            <span
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: "var(--radius-chip)",
                background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                color: "var(--accent)",
                fontFamily: "var(--ff-mono)",
                fontWeight: 700,
              }}
            >
              대기열 {g.waiting}
            </span>
          )}
        </div>

        {/* 빠른 액션 — minHeight 44px 터치 */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: "auto",
            flexWrap: "wrap",
          }}
        >
          {!cancelled && !done && (
            <Link
              href={g.href}
              className="btn btn--sm btn--primary"
              style={{
                flex: "1 1 auto",
                textAlign: "center",
                textDecoration: "none",
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              신청 관리{g.pending > 0 ? ` · ${g.pending}` : ""}
            </Link>
          )}
          {recruiting && !isFull && (
            // 마감·확정: [M6 보완①] POST /close 호출(status 1→2).
            //   정원 충족(isFull) 시에는 M1 자동확정 경로가 처리하므로 버튼 숨김(충돌 방지).
            <button
              type="button"
              className="btn btn--sm"
              style={{ flex: "0 1 auto", minHeight: 44 }}
              onClick={handleClose}
              disabled={busy}
            >
              {busy ? "처리 중..." : "마감·확정"}
            </button>
          )}
          {!cancelled && !done && (
            <Link
              href={`${g.href}/edit`}
              className="btn btn--sm"
              style={{
                flex: "0 1 auto",
                textAlign: "center",
                textDecoration: "none",
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              수정
            </Link>
          )}
          {!cancelled && !done && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              style={{ flex: "0 1 auto", color: "var(--danger)", minHeight: 44 }}
              onClick={handleCancel}
              disabled={busy}
            >
              {busy ? "처리 중..." : "취소"}
            </button>
          )}
          {done && (
            <Link
              href={g.href}
              className="btn btn--sm"
              style={{
                flex: "1 1 auto",
                textAlign: "center",
                textDecoration: "none",
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              경기 결과 · 리포트
            </Link>
          )}
          {cancelled && (
            <span style={{ fontSize: 12, color: "var(--ink-dim)", padding: "6px 0" }}>
              취소된 경기 · 신청자 알림 완료
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
