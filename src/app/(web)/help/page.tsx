"use client";

/* ============================================================
 * 도움말 (Help) — IU3-A · Phase 10 박제 (BDR v2.30)
 *
 * 이유: 신규 사용자가 FAQ·용어·정책을 한 화면에서 빠르게 훑어볼
 *      통합 허브. 시안(Dev/design/BDR-current/screens/Help.jsx +
 *      info-shared.jsx HELP_FAQ/GLOSSARY_MINI/HELP_POLICY)을 그대로
 *      박제. 검색(FAQ+용어 동시) + 탭 3종 + 1:1 문의 안내.
 *
 * 박제 원칙 (CLAUDE.md):
 *  - API/Prisma/서비스 0 변경. 데이터는 시안 박제(상수). DB 없음.
 *  - /help/glossary 페이지 0 변경. "전체 용어 사전 보기 →" 링크로만 연결.
 *  - 정책 카드: terms / privacy 만 활성. 나머지 4종은 "준비 중" 비활성.
 *  - 1:1 문의: Inquiry 모델 미존재 → UI만 배치(mailto 안내).
 *  - var(--*) 토큰만 / Material Symbols Outlined만 / lucide-react 금지.
 *  - .hlp-* 클래스는 globals.css 의 IU3 블록(시안 info-shared.css 이식) 사용.
 *
 * 시안 대비 변경: 검색이 FAQ + 용어를 동시 필터(기존엔 용어만 필터).
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// ---- 데이터: 시안 info-shared.jsx 그대로 박제 (DB 없음) ----

// FAQ 6건 (HELP_FAQ)
const HELP_FAQ: { q: string; a: string }[] = [
  { q: "팀 등록은 어떻게 하나요?", a: "상단 메뉴 [팀] → [팀 등록] 버튼으로 최소 3명 이상이 모인 팀을 등록할 수 있습니다. 팀장 1명, 부팀장 1명, 팀원 1명이 기본 구성입니다." },
  { q: "대회 신청 후 취소할 수 있나요?", a: "접수 마감 3일 전까지는 자유롭게 취소 가능하며, 참가비는 100% 환불됩니다. 이후에는 50%만 환불됩니다." },
  { q: "레이팅은 어떻게 계산되나요?", a: "기본 1500에서 시작하여, 각 경기의 승패·점수차·상대 레이팅에 따라 매 경기 ±5~±40 변동됩니다." },
  { q: "픽업과 게스트의 차이는?", a: "픽업은 개인 단위로 모여 즉석 팀을 구성하는 것이고, 게스트는 기존 팀의 부족한 인원을 일회성으로 채우는 역할입니다." },
  { q: "대회 성적은 어디에 반영되나요?", a: "OPEN·PRO 대회는 팀 레이팅에 반영되고, 선수별 기록(PPG/APG/RPG)은 개인 프로필과 선수 랭킹에 반영됩니다." },
  { q: "유료 멤버십은 꼭 필요한가요?", a: "아니요. 기본 기능은 모두 무료입니다. PRO 멤버십은 대회 우선 접수·상세 통계·광고 제거 등 편의 기능입니다." },
];

// 용어집 mini 16건 (GLOSSARY_MINI) — 짧은 정의. 전체 사전은 /help/glossary
const GLOSSARY_MINI: { term: string; desc: string }[] = [
  { term: "픽업 (Pick-up)", desc: "사전 팀 구성 없이 현장에서 인원을 모아 즉석으로 진행하는 경기." },
  { term: "게스트 (Guest)", desc: "기존 팀에 일회성으로 합류하는 외부 선수. 팀원 공백을 메우기 위함." },
  { term: "연습경기 (Scrimmage)", desc: "팀 간 합의된 비공식 연습경기. 기록은 개인 기록에만 반영." },
  { term: "픽앤롤 (Pick & Roll)", desc: "스크리너가 스크린 후 골대 방향으로 돌아 공을 받는 공격 전술." },
  { term: "풀코트 (Full-court)", desc: "농구장 전체를 사용하는 5v5 경기. 국내 아마추어 표준." },
  { term: "하프코트 (Half-court)", desc: "골대 한 쪽만 사용. 3v3·픽업의 기본 형식." },
  { term: "OPEN", desc: "레벨 제한 없는 대회. 모든 팀 참가 가능." },
  { term: "PRO", desc: "선수 등록·경력 제한이 있는 상위 레벨 대회." },
  { term: "AMATEUR", desc: "비선출·아마추어 전용 레벨. 참가 자격 심사 있음." },
  { term: "더블 엘리미네이션", desc: "두 번 패할 때까지 탈락하지 않는 대진 방식." },
  { term: "싱글 엘리미네이션", desc: "한 번 패하면 탈락하는 대진 방식. 짧은 대회에 적합." },
  { term: "레이팅", desc: "경기 결과 기반 계산되는 팀·선수 실력 지표. 기본값 1500." },
  { term: "승률", desc: "승 / (승 + 패) × 100. 시즌 단위로 집계." },
  { term: "PPG / APG / RPG", desc: "경기당 평균 득점 / 어시스트 / 리바운드." },
  { term: "D-N", desc: "접수 마감까지 남은 일 수. D-0은 오늘 마감." },
  { term: "운영진", desc: "대회·경기·커뮤니티를 관리하는 BDR 공식 스태프." },
];

// 정책 카드 6종 (HELP_POLICY) — terms/privacy 활성, 나머지 4 "준비 중"
// href 는 활성 카드에만 존재(시안의 active:true → 운영 라우트 매핑)
type PolicyCard = { title: string; desc: string; active: boolean; href?: string };
const HELP_POLICY: PolicyCard[] = [
  { title: "이용약관", desc: "커뮤니티 참여, 경기·대회 신청·취소 규정 전반", active: true, href: "/terms" },
  { title: "개인정보처리방침", desc: "수집 항목, 보관 기간, 제3자 제공 여부", active: true, href: "/privacy" },
  { title: "운영정책", desc: "게시물 관리, 제재 기준, 이의 제기 절차", active: false },
  { title: "환불규정", desc: "대회 참가비, 멤버십 결제 환불 기준", active: false },
  { title: "광고·제휴 문의", desc: "브랜드 제휴, 배너 광고, 코트 스폰서십", active: false },
  { title: "저작권 안내", desc: "이미지·영상 사용, 무단 전재 금지 조항", active: false },
];

type Tab = "faq" | "glossary" | "policy";

export default function HelpPage() {
  // 탭 상태: 시안 기본값 'faq'
  const [tab, setTab] = useState<Tab>("faq");
  // 검색어 — FAQ + 용어를 동시 필터 (시안 Help.jsx 와 동일)
  const [q, setQ] = useState("");
  // 열린 FAQ 인덱스 (아코디언 1개만 열림, -1 = 모두 닫힘)
  const [open, setOpen] = useState(0);

  const needle = q.trim().toLowerCase();
  // FAQ 필터: 질문 또는 답변 부분 일치
  const fFaq = HELP_FAQ.filter(
    (f) => !needle || f.q.toLowerCase().includes(needle) || f.a.toLowerCase().includes(needle),
  );
  // 용어 필터: term 또는 desc 부분 일치
  const fMini = GLOSSARY_MINI.filter(
    (g) => !needle || g.term.toLowerCase().includes(needle) || g.desc.toLowerCase().includes(needle),
  );

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 820 }}>
        {/* Hero + 검색 (시안 info-hero) */}
        <header className="info-hero" style={{ paddingBottom: 4 }}>
          <div className="eyebrow">도움말 · HELP</div>
          <h1 className="info-hero__title">무엇을 도와드릴까요?</h1>
          <div className="hlp-search">
            {/* Material Symbols Outlined 아이콘 — lucide-react 금지 (CLAUDE.md) */}
            <span className="ico material-symbols-outlined" aria-hidden>
              search
            </span>
            <input
              className="input"
              placeholder="용어·FAQ 검색 (예: 픽업, 레이팅)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </header>

        {/* 탭 3종 — cafe-blue 하단 라인 */}
        <div className="hlp-tabs">
          {(
            [
              ["faq", "자주 묻는 질문"],
              ["glossary", "용어집"],
              ["policy", "정책"],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              className={"hlp-tab" + (tab === k ? " is-on" : "")}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* FAQ 탭 — 아코디언 (검색 필터 적용) */}
        {tab === "faq" &&
          (fFaq.length > 0 ? (
            <div className="card hlp-faq">
              {fFaq.map((f, i) => (
                <div key={i} className={"hlp-faq__item" + (open === i ? " is-open" : "")}>
                  <button
                    className="hlp-faq__q"
                    onClick={() => setOpen(open === i ? -1 : i)}
                  >
                    <span className="hlp-faq__qnum">Q{i + 1}.</span>
                    <span className="hlp-faq__qtext">{f.q}</span>
                    <span className="hlp-faq__chev material-symbols-outlined" aria-hidden>
                      expand_more
                    </span>
                  </button>
                  {open === i && <div className="hlp-faq__a">{f.a}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="card hlp-empty">
              <span className="ico material-symbols-outlined" aria-hidden>
                search_off
              </span>
              검색 결과가 없습니다
            </div>
          ))}

        {/* 용어집 mini 탭 — 검색 필터 + "전체 용어 사전 보기" CTA */}
        {tab === "glossary" && (
          <>
            {fMini.length > 0 ? (
              <div className="card hlp-glist">
                {fMini.map((g, i) => (
                  <div key={i} className="hlp-grow">
                    <div className="hlp-grow__term">{g.term}</div>
                    <div className="hlp-grow__desc">{g.desc}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card hlp-empty">
                <span className="ico material-symbols-outlined" aria-hidden>
                  search_off
                </span>
                검색 결과가 없습니다
              </div>
            )}
            {/* 전체 용어 사전 보기 → /help/glossary (redirect 금지 룰: Link 만) */}
            <Link className="hlp-glossary-cta" href="/help/glossary">
              <div className="hlp-glossary-cta__t">
                전체 용어 사전 보기
                <small>A-Z 인덱스 · 예시 · 관련 페이지 link 포함 (18 핵심 용어)</small>
              </div>
              <span className="btn btn--primary btn--sm">
                <span className="ico material-symbols-outlined" aria-hidden>
                  menu_book
                </span>
                용어 사전 →
              </span>
            </Link>
          </>
        )}

        {/* 정책 탭 — 활성 2종(Link) + 비활성 4종("준비 중" dim) */}
        {tab === "policy" && (
          <div className="hlp-policy">
            {HELP_POLICY.map((p, i) => {
              const inner = (
                <>
                  <div className="hlp-pcard__t">
                    {p.title}
                    {!p.active && <span className="hlp-pcard__soon">준비 중</span>}
                  </div>
                  <div className="hlp-pcard__d">{p.desc}</div>
                  {p.active && (
                    <span className="hlp-pcard__arr material-symbols-outlined" aria-hidden>
                      arrow_forward
                    </span>
                  )}
                </>
              );
              // 활성: Link 이동 / 비활성: div 표시만
              return p.active && p.href ? (
                <Link key={i} className="hlp-pcard" href={p.href}>
                  {inner}
                </Link>
              ) : (
                <div key={i} className="hlp-pcard is-soon" aria-disabled>
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        {/* 1:1 문의 — Inquiry 모델 미존재 → mailto 안내 (mock 미구현) */}
        <div className="hlp-contact">
          <h3 className="hlp-contact__t">원하는 답을 찾지 못하셨나요?</h3>
          <p className="hlp-contact__d">운영팀이 평일 1~2일 내에 답변드립니다.</p>
          {/* mailto: 제목 prefill — 추후 Inquiry 모델 도입 시 교체 */}
          <a
            href="mailto:bdrbasket@gmail.com?subject=%5BMyBDR%20%EB%AC%B8%EC%9D%98%5D%20"
            className="btn btn--accent"
          >
            <span className="ico material-symbols-outlined" aria-hidden>
              mail
            </span>
            1:1 문의하기
          </a>
        </div>
      </div>
    </div>
  );
}
