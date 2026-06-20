import Link from "next/link";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

// ============================================================
// AdminCompletedCardGrid — PR-1C-13 PA7 (D1 · 종료 후 hub 신규 라우트)
//   시안 BDR-current/screens/AdminTournamentCompleted.jsx 의 acp-grid + Card 박제.
//   5 카드 후속 작업 hub (결과 / 통계 / 알기자 / 사진영상 / 사이트 archive).
//
// 이유 (왜):
//   - 5 카드 = 관리자 측 종료 후 분산 진입점 통합. 단, 시안 mock 수치
//     (24매치 / 1,847득점 / 342조회 / 6장 등) 는 운영 미보유 → hide.
//   - ★ 가짜링크 금지 — 운영 실재 라우트 카드만 활성 Link. 라우트 없는
//     카드(통계 대시보드 전용 / 사진영상)는 disabled "준비 중" span.
//   - href 유무로 활성/disabled 자동 분기 (page.tsx 가 라우트 실재 판정).
// ============================================================

export interface CompletedCard {
  num: string; // STEP 번호
  title: string; // 카드 제목
  icon: string; // lucide 키트 아이콘명 (page.tsx 에서 lucide 이름으로 전달)
  desc: string; // 설명
  state: "done" | "auto" | "idle"; // 상태 톤 (시안 acp-card__state--*)
  stateLabel: string; // 상태 라벨
  // 카드 진입 — href 있으면 활성 Link / 없으면 disabled "준비 중"
  href?: string; // 운영 실재 라우트 (없으면 disabled)
  external?: boolean; // 외부 링크 여부 (사이트 archive 등 — <a target=_blank>)
  cta: string; // CTA 라벨
  // 진짜 데이터 메트릭만 (mock 수치 ❌). 빈 배열이면 meta 영역 hide.
  metrics?: { v: string; l: string }[];
}

function CardBody({ c }: { c: CompletedCard }) {
  // 활성 여부 — href 있을 때만 진입 가능
  const enabled = !!c.href;

  return (
    <div className={`acp-card${enabled ? "" : " acp-card--disabled"}`}>
      <div className="acp-card__head">
        {/* c.icon = lucide 키트 이름(trophy/layout-dashboard/newspaper/images/globe) */}
        <Icon name={c.icon} size={22} className="acp-card__icon" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="acp-card__num">STEP {c.num}</div>
          <h3 className="acp-card__title">{c.title}</h3>
        </div>
        <span className={`acp-card__state acp-card__state--${c.state}`}>
          {c.stateLabel}
        </span>
      </div>
      <p className="acp-card__desc">{c.desc}</p>

      {/* 진짜 메트릭만 표시 (mock 수치는 page.tsx 에서 미전달) */}
      {c.metrics && c.metrics.length > 0 && (
        <div className="acp-card__meta">
          {c.metrics.map((m, i) => (
            <span key={i} className="acp-card__metric">
              <b>{m.v}</b>
              {m.l}
            </span>
          ))}
        </div>
      )}

      {/* CTA — 활성: Link / 비활성: disabled span ("준비 중") */}
      {enabled ? (
        c.external ? (
          // 외부 링크 (공개 사이트) — 새 탭
          <a
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="acp-card__cta"
          >
            {c.cta}
            {/* Material open_in_new → lucide external-link */}
            <Icon name="external-link" size={16} />
          </a>
        ) : (
          <Link href={c.href!} className="acp-card__cta">
            {c.cta}
            {/* Material arrow_forward → lucide arrow-right */}
            <Icon name="arrow-right" size={16} />
          </Link>
        )
      ) : (
        // 운영 라우트 부재 — 가짜링크 대신 disabled "준비 중"
        <span className="acp-card__cta acp-card__cta--disabled" aria-disabled="true">
          준비 중
          {/* Material schedule → lucide clock */}
          <Icon name="clock" size={16} />
        </span>
      )}
    </div>
  );
}

export function AdminCompletedCardGrid({ cards }: { cards: CompletedCard[] }) {
  return (
    <div className="acp-grid">
      {cards.map((c) => (
        <CardBody key={c.num} c={c} />
      ))}
    </div>
  );
}
