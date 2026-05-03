// 2026-05-03: 알기자 기사 본문 linkify — 선수/팀 이름 → 링크 자동 변환
// 입력: content (plain text) + 출전 선수 list + 양 팀 정보
// 출력: React JSX (이름 = <Link>, 나머지 = string)
//
// 동작:
//   - 이름 길이 우선 정렬 (긴 이름부터 매칭 — "이형민_Bossmin" 가 "이형민" 보다 먼저)
//   - 같은 이름 여러 번 등장 → 모두 링크 (가장 가까운 매치 출전 user 1명만 가정)
//   - 이름 없는 부분은 plain string (조사 등은 링크 외)

import Link from "next/link";
import { Fragment } from "react";

export type LinkifyEntry = {
  name: string;
  href: string;
  type: "player" | "team";
};

interface Props {
  content: string;
  entries: LinkifyEntry[];
  className?: string;
}

export function LinkifyNewsBody({ content, entries, className }: Props) {
  // 이름 길이 desc 정렬 — 긴 이름이 먼저 매칭되어야 prefix 충돌 방지
  const sorted = [...entries]
    .filter((e) => e.name && e.name.trim().length >= 1)
    .sort((a, b) => b.name.length - a.name.length);

  if (sorted.length === 0) {
    return (
      <div className={className} style={{ whiteSpace: "pre-line" }}>
        {content}
      </div>
    );
  }

  // 정규식 escape (특수문자 안전화)
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 한 정규식으로 모두 매칭 (alternation)
  const pattern = new RegExp(
    `(${sorted.map((e) => escapeRegex(e.name)).join("|")})`,
    "g",
  );

  // split 결과: [string, name, string, name, ...]
  const parts = content.split(pattern);

  return (
    <div className={className} style={{ whiteSpace: "pre-line" }}>
      {parts.map((part, i) => {
        // 매칭된 이름인지 확인 — 같은 이름 여러 entry 가능 (player vs team 우선순위 = 첫 매칭)
        const entry = sorted.find((e) => e.name === part);
        if (entry) {
          return (
            <Link
              key={i}
              href={entry.href}
              className="text-[var(--color-accent)] hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </div>
  );
}
