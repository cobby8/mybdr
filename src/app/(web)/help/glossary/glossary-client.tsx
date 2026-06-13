"use client";

/* ============================================================
 * 용어 사전 (Help > Glossary) — IU3-B · Phase 10 박제 (BDR v2.30) · 클라이언트
 *
 * 이유: A-Z chip 인덱스 + 검색은 클라이언트 상태가 필요. SEO metadata 는
 *      부모 server component(page.tsx)가 보존하고, 인터랙션만 여기서 처리.
 *      시안 Dev/design/BDR-current/screens/Glossary.jsx 그대로 박제.
 *
 * 박제 원칙:
 *  - 데이터는 시안 info-shared.jsx GLOSSARY 18건 그대로 박제 (DB 없음).
 *  - redirect 금지(무한루프 — 사용자 결정 보존). A-Z chip/검색은 순수 UI.
 *  - A-Z 인덱스: english 초성 기준 / 빈 글자 disabled / sticky.
 *  - cross-domain link: 용어 → 해당 Phase 진입(대회/경기/랭킹/매너).
 *    href 는 시안 GLOSSARY 의 실제 운영 라우트(/tournaments 등) 사용.
 *  - var(--*) 토큰만 / Material Symbols Outlined만 / lucide-react 금지.
 *  - .glo-* / .hlp-* 클래스는 globals.css 의 IU3 블록 사용.
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// 용어 1건 타입 — 시안 GLOSSARY 구조 그대로
type GlossaryEntry = {
  term: string; // 한글 용어
  english?: string; // 영문 (A-Z 인덱스 초성 기준)
  icon: string; // Material Symbols 이름
  desc: string; // 1~2문장 설명
  ex?: string; // 예시 (선택)
  links?: { href: string; label: string }[]; // cross-domain link
};

// 용어 18건 — 시안 info-shared.jsx window.GLOSSARY 그대로 박제
const GLOSSARY: GlossaryEntry[] = [
  {
    term: "대회",
    english: "Tournament",
    icon: "emoji_events",
    desc: "정해진 기간 동안 여러 팀이 우승을 다투는 경기 묶음입니다. 토너먼트, 풀리그, 혼합(리그+토너먼트) 방식이 있습니다.",
    ex: "예: BDR 서울 오픈 2026 (16팀 · 2일간 · 풀리그+결선 토너먼트)",
    links: [{ href: "/tournaments", label: "진행 중인 대회" }],
  },
  {
    term: "경기",
    english: "Game",
    icon: "sports_basketball",
    desc: "단일 경기 단위입니다. 픽업·게스트·연습경기 3가지 유형으로 구분되며, 누구나 만들고 참가 신청할 수 있습니다.",
    ex: "예: 강남구 토요일 저녁 픽업, A팀 게스트 모집",
    links: [{ href: "/games", label: "모집 중인 경기" }],
  },
  {
    term: "픽업",
    english: "Pickup",
    icon: "group_add",
    desc: "개인이 서로 모여 즉석에서 팀을 짜는 공개 경기입니다. 개인 단위 참가 신청으로 팀이 구성됩니다.",
    ex: "예: 10명 모집 → 추첨/순서대로 5:5 팀 배정",
    links: [{ href: "/games?type=pickup", label: "픽업 경기" }],
  },
  {
    term: "게스트",
    english: "Guest",
    icon: "person_add",
    desc: "기존 팀이 부족한 인원을 채우기 위해 외부 선수를 초청하는 경기입니다. 주축은 팀원이고, 게스트 몇 명이 합류합니다.",
    ex: "예: A팀 주축 7명 + 게스트 3명 모집",
    links: [{ href: "/games?type=guest", label: "게스트 경기" }],
  },
  {
    term: "연습경기",
    english: "Practice Match",
    icon: "fitness_center",
    desc: "두 팀이 비공식적으로 만나 치르는 경기입니다. 승패나 개인 기록이 공식 랭킹·커리어에 반영되지 않습니다.",
    ex: "예: B팀 vs C팀 주말 연습경기",
    links: [{ href: "/games?type=practice", label: "연습경기" }],
  },
  {
    term: "디비전",
    english: "Division",
    icon: "category",
    desc: "대회 내에서 실력·나이 등 기준으로 나눈 참가 그룹입니다. 한 대회 안에서 여러 디비전이 동시에 진행될 수 있습니다.",
    ex: "예: 오픈 · 챌린저 · 비기너 3개 디비전",
  },
  {
    term: "시드",
    english: "Seed",
    icon: "star",
    desc: "대진 추첨 시 상위 팀에게 부여하는 우선 배정입니다. 강팀끼리 초반에 만나지 않도록 분산 배치하는 역할을 합니다.",
    ex: "예: 직전 대회 4강 이상 팀에게 1~4번 시드",
  },
  {
    term: "엘리미네이션",
    english: "Elimination",
    icon: "account_tree",
    desc: "승자만 다음 라운드로 올라가는 토너먼트 방식입니다. 한 번 지면(싱글) 또는 두 번 지면(더블) 탈락합니다.",
    ex: "예: 8강 → 4강 → 결승 (싱글 엘리미네이션)",
  },
  {
    term: "풀리그",
    english: "Round Robin",
    icon: "swap_horiz",
    desc: "모든 팀이 서로 한 번씩 경기를 치르는 방식입니다. 순위는 누적 승수와 득실점 차로 결정합니다.",
    ex: "예: 4팀 풀리그 → 총 6경기 → 1~4위 확정",
  },
  {
    term: "레이팅",
    english: "Rating",
    icon: "speed",
    desc: "경기 결과를 기반으로 계산되는 팀·선수 실력 지표입니다. 기본값 1500에서 시작해 매 경기 ±5~40 변동됩니다.",
    ex: "예: 강팀 상대 승리 시 큰 폭 상승",
    links: [{ href: "/rankings", label: "랭킹 보기" }],
  },
  {
    term: "승률",
    english: "Win Rate",
    icon: "percent",
    desc: "승 / (승 + 패) × 100 으로 계산하는 비율입니다. 시즌 단위로 집계됩니다.",
    links: [{ href: "/rankings", label: "랭킹 보기" }],
  },
  {
    term: "기록",
    english: "PPG · APG · RPG",
    icon: "query_stats",
    desc: "경기당 평균 득점(PPG) / 어시스트(APG) / 리바운드(RPG). 선수별 기록은 개인 프로필과 선수 랭킹에 반영됩니다.",
    links: [{ href: "/rankings", label: "선수 랭킹" }],
  },
  {
    term: "풀코트",
    english: "Full-court",
    icon: "crop_landscape",
    desc: "농구장 전체를 사용하는 5v5 경기입니다. 국내 아마추어 표준 형식입니다.",
  },
  {
    term: "하프코트",
    english: "Half-court",
    icon: "crop_square",
    desc: "골대 한 쪽만 사용하는 형식입니다. 3v3·픽업의 기본 형식입니다.",
  },
  {
    term: "오픈",
    english: "OPEN",
    icon: "lock_open",
    desc: "레벨 제한 없이 모든 팀이 참가할 수 있는 대회 등급입니다.",
    links: [{ href: "/tournaments", label: "대회 보기" }],
  },
  {
    term: "프로",
    english: "PRO",
    icon: "military_tech",
    desc: "선수 등록·경력 제한이 있는 상위 레벨 대회 등급입니다.",
  },
  {
    term: "매너 점수",
    english: "Manner",
    icon: "handshake",
    desc: "경기 후 상대가 남기는 매너 평가입니다. 평균과 항목 종류만 공개되며 개별 건수는 비공개입니다(BG2).",
    links: [{ href: "/profile", label: "내 매너 보기" }],
  },
  {
    term: "운영진",
    english: "Staff",
    icon: "shield_person",
    desc: "대회·경기·커뮤니티를 관리하는 BDR 공식 스태프입니다.",
  },
];

export default function GlossaryClient() {
  // A-Z 인덱스 선택 글자 ('all' = 전체)
  const [letter, setLetter] = useState<string>("all");
  // 검색어
  const [q, setQ] = useState("");

  const az = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  // english 첫 글자(대문자)를 초성으로 사용
  const initial = (e: GlossaryEntry) => (e.english || "").trim().charAt(0).toUpperCase();
  // 실제 용어가 존재하는 글자만 활성 (빈 글자는 disabled)
  const activeLetters = new Set(GLOSSARY.map(initial));

  const needle = q.trim().toLowerCase();
  let rows = GLOSSARY;
  if (letter !== "all") rows = rows.filter((e) => initial(e) === letter);
  if (needle)
    rows = rows.filter(
      (e) =>
        e.term.toLowerCase().includes(needle) ||
        (e.english || "").toLowerCase().includes(needle) ||
        e.desc.toLowerCase().includes(needle),
    );

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 820 }}>
        {/* 도움말로 돌아가기 — /help 허브 복귀 (redirect 아님, Link) */}
        <Link className="glo-back" href="/help">
          <span className="ico material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          도움말로 돌아가기
        </Link>

        {/* 헤더 */}
        <header style={{ marginBottom: 18 }}>
          <div className="eyebrow">용어 사전 · GLOSSARY</div>
          <h1
            className="info-hero__title"
            style={{ fontSize: 28, textAlign: "left", margin: "10px 0 8px" }}
          >
            농구 용어 한눈에 보기
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6, margin: 0 }}>
            MyBDR에서 자주 쓰는 핵심 용어를 예시·관련 페이지와 함께 정리했습니다. 용어를 누르면 해당
            화면으로 이동합니다.
          </p>
        </header>

        {/* 검색 */}
        <div className="hlp-search" style={{ margin: "0 0 4px", maxWidth: "100%" }}>
          <span className="ico material-symbols-outlined" aria-hidden>
            search
          </span>
          <input
            className="input"
            placeholder="용어 검색 (예: 레이팅, 디비전, seed)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLetter("all");
            }}
          />
        </div>

        {/* A-Z 인덱스 chip — sticky / 빈 글자 disabled */}
        <div className="glo-az">
          <button
            className={"glo-az__chip glo-az__chip--all" + (letter === "all" ? " is-on" : "")}
            onClick={() => setLetter("all")}
          >
            전체
          </button>
          {az.map((L) => (
            <button
              key={L}
              className={"glo-az__chip" + (letter === L ? " is-on" : "")}
              disabled={!activeLetters.has(L)}
              onClick={() => {
                setLetter(L);
                setQ("");
              }}
            >
              {L}
            </button>
          ))}
        </div>

        {/* 용어 카드 grid */}
        {rows.length > 0 ? (
          <div className="glo-grid">
            {rows.map((e, i) => (
              <article key={i} className="glo-card">
                <div className="glo-card__head">
                  <span className="glo-card__icon material-symbols-outlined" aria-hidden>
                    {e.icon}
                  </span>
                  <span className="glo-card__term">{e.term}</span>
                  {e.english && <span className="glo-card__en">{e.english}</span>}
                </div>
                <div className="glo-card__desc">{e.desc}</div>
                {e.ex && <div className="glo-card__ex">{e.ex}</div>}
                {e.links && (
                  <div className="glo-card__links">
                    {/* cross-domain link — 시안 GLOSSARY 의 실제 운영 라우트로 이동 */}
                    {e.links.map((l, j) => (
                      <Link key={j} className="glo-card__link" href={l.href}>
                        <span className="ico material-symbols-outlined" aria-hidden>
                          north_east
                        </span>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="card hlp-empty">
            <span className="ico material-symbols-outlined" aria-hidden>
              search_off
            </span>
            해당 용어가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
