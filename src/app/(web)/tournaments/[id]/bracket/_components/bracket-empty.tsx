import Link from "next/link";

export function BracketEmpty({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] py-16 px-6 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="mb-4 text-4xl">🏆</div>
      <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
        아직 대진표가 없습니다
      </h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 주최자가 대진표를 생성하면 여기에 표시됩니다.
      </p>
      {/* 2026-05-12 — pill 9999px ❌ (CLAUDE.md §디자인 §10) → btn--accent 표준 클래스 (4px 라운딩) */}
      <Link
        href={`/tournaments/${tournamentId}/teams`}
        className="btn btn--accent"
      >
        참가팀 보러가기
      </Link>
    </div>
  );
}
