"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * TransferProgressCard — Phase 3 PR10+PR11
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 본인 pending 이적 신청 (final_status='pending') 이 있으면 마이페이지 상단
 *   aside 카드로 진행 상태 노출. 양쪽 사이드 결정 진척도 (현 팀장 / 새 팀장) 시각화.
 *
 * 표시 룰:
 *  - pending 0건: 카드 자체 미렌더 (return null)
 *  - pending 1건: 카드 1개 — fromTeam → toTeam / 양쪽 사이드 status 뱃지 / 진행률
 *
 * fetch 시점: 마운트 시 1회 (GET /api/web/transfer-requests?status=pending)
 *   silent fail (운영 부하 회피).
 */

type TransferRow = {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  fromTeam: { id: string; name: string } | null;
  toTeam: { id: string; name: string } | null;
  fromTeamStatus: string;
  toTeamStatus: string;
  finalStatus: string;
  reason: string | null;
  createdAt: string;
};

export function TransferProgressCard() {
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/web/transfer-requests?status=pending`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const list = (json?.data?.transferRequests ?? []) as TransferRow[];
        setTransfers(list);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // pending 0건 또는 미로드 시 카드 숨김 — 시각 노이즈 회피
  if (!loaded || transfers.length === 0) return null;

  return (
    <div className="card mypage-aside-card" style={{ padding: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: "var(--info, #0079B9)" }}
        >
          swap_horiz
        </span>
        <span
          className="eyebrow"
          style={{ fontSize: 10, color: "var(--info, #0079B9)" }}
        >
          이적 진행 중
        </span>
      </div>

      {transfers.map((t) => {
        const fromName = t.fromTeam?.name ?? "현 팀";
        const toName = t.toTeam?.name ?? "새 팀";
        // 사이드별 라벨 + 색상 (pending=대기 / approved=승인됨 / rejected=거부)
        // fallback hex 동기화 — globals.css 토큰값과 일치 (--ok=#1CA05E, --danger=#E24C4B)
        function statusInfo(s: string): { label: string; color: string } {
          if (s === "approved") return { label: "승인", color: "var(--ok, #1CA05E)" };
          if (s === "rejected") return { label: "거부", color: "var(--danger, #E24C4B)" };
          return { label: "대기", color: "var(--ink-mute, #888)" };
        }
        const fromInfo = statusInfo(t.fromTeamStatus);
        const toInfo = statusInfo(t.toTeamStatus);

        return (
          <div
            key={t.id}
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              // --surface-2 미정의 fix → --bg-alt (정의됨, 카드 내부 row 톤)
              background: "var(--bg-alt, var(--bg))",
              border: "1px solid var(--border)",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              {fromName} → {toName}
            </div>

            {/* 양쪽 사이드 뱃지 — 현 팀장 / 새 팀장 진척도 */}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ color: "var(--ink-mute)", minWidth: 56 }}>현 팀장:</span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 600,
                    color: fromInfo.color,
                    background: `color-mix(in srgb, ${fromInfo.color} 12%, transparent)`,
                  }}
                >
                  {fromInfo.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ color: "var(--ink-mute)", minWidth: 56 }}>새 팀장:</span>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 600,
                    color: toInfo.color,
                    background: `color-mix(in srgb, ${toInfo.color} 12%, transparent)`,
                  }}
                >
                  {toInfo.label}
                </span>
                {/* 현 팀장 미승인이면 새 팀장 알림 미발송 — 안내 */}
                {t.fromTeamStatus === "pending" && t.toTeamStatus === "pending" && (
                  <span style={{ fontSize: 10, color: "var(--ink-mute)" }}>
                    (현 팀장 결정 후 진행)
                  </span>
                )}
              </div>
            </div>

            {/* 안내 + 팀 페이지 링크 */}
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: "var(--ink-mute)",
                lineHeight: 1.5,
              }}
            >
              양쪽 팀장 모두 승인 시 자동 이동. 한쪽이라도 거부하면 종결됩니다.
            </div>
            {t.toTeam?.id && (
              <Link
                href={`/teams/${t.toTeam.id}`}
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--info, #0079B9)",
                  textDecoration: "underline",
                }}
              >
                새 팀 보기 →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
