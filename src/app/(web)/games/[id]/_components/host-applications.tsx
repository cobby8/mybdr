"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Applicant {
  id: string;
  status: number;
  nickname: string | null;
  name: string | null;
  phone: string | null;
  position: string | null;
  city: string | null;
  district: string | null;
  // Phase 10-3 B-7: 게스트 신청 라벨링 필드
  is_guest?: boolean;
  experience_years?: number | null;
  message?: string | null;
}

interface HostApplicationsProps {
  gameId: string;
  applicants: Applicant[];
}

const STATUS_LABEL: Record<number, string> = { 0: "대기", 1: "승인", 2: "거절" };

// Phase 10-3 B-7: 농구 경력(년) → 라벨 매핑
//   기획설계의 5단계 정의(0=입문 ~ 4=선출). switch 대신 객체 lookup 으로 단순화.
const EXPERIENCE_LABELS: Record<number, string> = {
  0: "입문",
  1: "초보",
  2: "중급",
  3: "상급",
  4: "선출",
};

export function HostApplications({ gameId, applicants }: HostApplicationsProps) {
  const [list, setList] = useState(applicants);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(appId: string, action: "approve" | "reject") {
    setLoading(appId + action);
    try {
      const res = await fetch(`/api/web/games/${gameId}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setList((prev) =>
          prev.map((a) =>
            a.id === appId ? { ...a, status: action === "approve" ? 1 : 2 } : a
          )
        );
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  const pending = list.filter((a) => a.status === 0);
  const processed = list.filter((a) => a.status !== 0);

  return (
    <div className="space-y-4">
      {/* 대기 중 */}
      {pending.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-primary)]">
            승인 대기 {pending.length}명
          </p>
          <div className="space-y-2">
            {pending.map((a) => {
              // Phase 10-3 B-7: 게스트 신청 여부에 따른 부가 정보 계산
              const isGuest = a.is_guest === true;
              // experience_years 가 0 도 유효값(=입문)이라 nullish 비교 사용
              const expLabel =
                a.experience_years != null && a.experience_years in EXPERIENCE_LABELS
                  ? EXPERIENCE_LABELS[a.experience_years]
                  : null;
              return (
                <div
                  key={a.id}
                  className="rounded-[12px] border border-[var(--color-primary)]/30 bg-[var(--color-warning)]/5 px-4 py-3"
                >
                  {/* 게스트 신청은 카드 상단에 GUEST 뱃지 + 농구 경력 라벨 노출 */}
                  {isGuest && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-[4px] bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                        GUEST
                      </span>
                      {expLabel && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          농구 경력: {expLabel}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {a.nickname ?? a.name ?? "익명"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {[a.position, a.city, a.district].filter(Boolean).join(" · ") || "정보 없음"}
                      </p>
                      {a.phone && (
                        <a
                          href={`tel:${a.phone}`}
                          className="text-xs text-[var(--color-accent)] hover:underline"
                        >
                          {a.phone}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="px-4 py-1.5 text-sm"
                        onClick={() => handleAction(a.id, "approve")}
                        disabled={!!loading}
                      >
                        {loading === a.id + "approve" ? "..." : "승인"}
                      </Button>
                      <Button
                        className="px-4 py-1.5 text-sm"
                        variant="secondary"
                        onClick={() => handleAction(a.id, "reject")}
                        disabled={!!loading}
                      >
                        {loading === a.id + "reject" ? "..." : "거절"}
                      </Button>
                    </div>
                  </div>
                  {/* 게스트가 남긴 메시지 — 인용 박스로 시각적 구분 */}
                  {isGuest && a.message && (
                    <blockquote className="mt-2 rounded-[6px] border-l-2 border-[var(--color-accent)] bg-[var(--color-surface-bright)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                      {a.message}
                    </blockquote>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 처리 완료 */}
      {processed.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">처리 완료</p>
          <div className="space-y-2">
            {processed.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-[12px] bg-[var(--color-surface-bright)] px-4 py-2.5"
              >
                <p className="text-sm">{a.nickname ?? a.name ?? "익명"}</p>
                <Badge variant={a.status === 1 ? "success" : "error"}>
                  {STATUS_LABEL[a.status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">아직 신청자가 없습니다.</p>
      )}
    </div>
  );
}
