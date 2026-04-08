"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTeamAction } from "@/app/actions/teams";

export function NewTeamForm() {
  const [state, formAction, pending] = useActionState(createTeamAction, null);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>팀 만들기</h1>

      <Card>
        {state?.error && (
          <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {state.error}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">팀 이름 *</label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="팀 이름"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-muted)]">팀 소개</label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              placeholder="팀 소개"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">대표 색상 <span className="text-xs text-[var(--color-text-secondary)]">(유니폼 메인 컬러)</span></label>
              <input
                name="primary_color"
                type="color"
                defaultValue="#E31B23"
                className="h-12 w-full cursor-pointer rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-1"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">보조 색상 <span className="text-xs text-[var(--color-text-secondary)]">(유니폼 서브 컬러)</span></label>
              <input
                name="secondary_color"
                type="color"
                defaultValue="#E76F51"
                className="h-12 w-full cursor-pointer rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-1"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "생성 중..." : "팀 만들기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
