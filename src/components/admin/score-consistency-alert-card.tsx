/**
 * ScoreConsistencyAlertCard — 점수 정합성 daily cron 결과 알림 위젯.
 *
 * 2026-05-21 PR-4 F2 신규 (decisions.md [2026-05-21] 점수 정합성 영구 fix Sprint 1).
 *
 * 이유 (왜):
 *   - daily cron (`/api/cron/score-consistency`) 이 매일 01:00 KST 4 source 불일치 검출 후
 *     score_consistency_audit 테이블에 INSERT 박제.
 *   - 운영자가 admin 대시보드 첫 화면에서 24h 내 불일치 매치 수 + 분류 분포 확인 후
 *     해당 매치 수동 정정 진입 가능.
 *
 * 어떻게:
 *   - server component (Prisma 직접 SELECT / API 호출 0)
 *   - 최근 24h `audited_at >= NOW() - INTERVAL 1 DAY` 박제 매치 + 분류별 group by
 *   - 0건 = 카드 미렌더 (운영자 노이즈 ↓)
 *   - 1건+ = 카드 렌더 + 분류별 chip + "상세 보기" 링크 (Sprint 3 admin 매치 페이지 별도 박제)
 *
 * 디자인 룰 (CLAUDE.md §디자인 핵심):
 *   - Material Symbols Outlined 아이콘 (lucide-react 금지)
 *   - var(--color-*) 토큰 (하드코딩 색상 금지)
 *   - 다크모드 호환 (admin 대시보드 기존 카드 패턴 답습)
 */

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Icon } from "@/components/admin-toss";

// 분류별 한국어 label + tone (ad-pill 패턴 답습)
const MISMATCH_LABELS: Record<string, { label: string; tone: "err" | "warn" | "info" }> = {
  HEADER_ZERO: { label: "헤더 0/0", tone: "err" },
  MULTI_DIFF: { label: "다중 불일치", tone: "err" },
  MPS_HEADER_DIFF: { label: "MPS 불일치", tone: "warn" },
  PBP_HEADER_DIFF: { label: "PBP 불일치", tone: "warn" },
  QS_HEADER_DIFF: { label: "QS 불일치", tone: "info" },
  QS_ZERO: { label: "QS=0/0", tone: "info" },
};

const TONE_COLOR: Record<string, string> = {
  err: "var(--color-primary)",
  warn: "var(--color-warning, var(--color-primary))",
  info: "var(--color-info, var(--color-accent))",
};

export async function ScoreConsistencyAlertCard() {
  // 최근 24h 내 박제 audit 결과 — 같은 매치 중복 박제 가능하나 위젯은 단순 매치수 표시 (분류별)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 분류별 매치 수 (중복 제거 X — cron 1회/일 박제 가정)
  const rows = await prisma.score_consistency_audit.groupBy({
    by: ["mismatchType"],
    where: { auditedAt: { gte: since } },
    _count: { _all: true },
  });

  const total = rows.reduce((s, r) => s + r._count._all, 0);

  // 24h 내 박제 0건 = 위젯 미렌더 (운영자 노이즈 ↓)
  if (total === 0) return null;

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "14px 16px",
        borderRadius: 6,
        border: "1px solid var(--color-border)",
        background: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon name="warning" size={20} color="var(--color-primary)" />
        <h3
          style={{
            fontSize: 13,
            fontWeight: 800,
            margin: 0,
            color: "var(--color-text-primary)",
            fontFamily: "var(--ff-display)",
          }}
        >
          점수 정합성 알림
        </h3>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            marginLeft: "auto",
          }}
        >
          최근 24h · {total}건 불일치 매치
        </span>
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--color-text-muted)",
          margin: "0 0 10px 0",
          lineHeight: 1.5,
        }}
      >
        daily cron 검출 결과. 매치 4 source (헤더/QS/MPS/PBP) 불일치는 score-sheet 또는 운영자 수동 정정 필요.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {rows.map((r) => {
          const meta = MISMATCH_LABELS[r.mismatchType] ?? {
            label: r.mismatchType,
            tone: "info" as const,
          };
          const color = TONE_COLOR[meta.tone] ?? TONE_COLOR.info;
          return (
            <span
              key={r.mismatchType}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--ff-mono)",
                borderRadius: 4,
                color,
                background: "color-mix(in oklab, currentColor 10%, transparent)",
                border: "1px solid color-mix(in oklab, currentColor 25%, transparent)",
              }}
            >
              {meta.label}
              <span style={{ opacity: 0.7 }}>· {r._count._all}</span>
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 10, textAlign: "right" }}>
        {/* Sprint 3 별도 박제 — 본 PR 은 위젯만. 임시로 대회 목록 페이지 링크 */}
        <Link
          href="/tournament-admin/tournaments"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-accent)",
            textDecoration: "none",
          }}
        >
          대회 매치 확인 →
        </Link>
      </div>
    </div>
  );
}
