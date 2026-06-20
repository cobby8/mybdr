"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// 4단계 A — 신청자 닉네임 → 공개프로필 PlayerLink
import { PlayerLink } from "@/components/links/player-link";

interface Applicant {
  id: string;
  status: number;
  /** 4단계 A: 신청자 User.id — 닉네임 클릭 시 공개프로필 이동용. null = 게스트/placeholder → span fallback */
  user_id?: string | null;
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
  // [M6 E-1] 대기열(status=3) 3구획용 — 순번 / 승격 마감(ISO)
  waitlist_position?: number | null;
  promotion_deadline?: string | null;
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

// [M6 E-1] 승격 마감까지 남은 초 — 음수는 0 클램프(표시용. 만료여도 서버가 최종 판정).
function secondsLeft(deadlineIso: string): number {
  const diff = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

/* ============================================================
 * HostApplications — [M6 E-1] 호스트 신청·대기열 관리 (3구획)
 *
 * 시안 GameDetail.jsx HostApplicationsPanel 박제 — 3구획 구조:
 *   ① 대기 승인 (status=0): 승인/거절 = 기존 PATCH 재사용
 *   ② 확정 참가자 (status=1): 목록 표시
 *   ③ 대기열 (status=3): waitlist_position 순번 + 승격 확정
 *
 * 🟢 PM 승인 결정 (M6):
 *   - 대기열 승격은 confirm POST 만 매핑. 시안 "승격 알림" 버튼은 미박제
 *     (운영은 빈자리 발생 시 자동으로 대기 1번에게 알림 → promotion_deadline 활성화).
 *   - confirm 은 promotion_deadline 이 살아있는(자동 알림 받은) 대기자만 성공(없으면 410).
 *     따라서 UI 는 promotion_deadline 활성 대기자에게만 "승격 확정" 버튼을 활성화하고,
 *     그 외 대기자는 "대기 중 · 빈자리 시 자동 알림" 안내 상태로 구분 표시.
 *   - 410(만료·다음 순번)/409(정원 재마감) 응답 처리.
 *
 * 데이터 패칭: 승인/거절 = 기존 PATCH /applications/[appId], 승격 = 기존
 *   POST /applications/[appId]/confirm. 신규 route 0.
 * ============================================================ */

export function HostApplications({ gameId, applicants }: HostApplicationsProps) {
  const router = useRouter();
  const [list, setList] = useState(applicants);
  const [loading, setLoading] = useState<string | null>(null);
  // 승격 confirm 결과 메시지 (appId 단위)
  const [promoteMsg, setPromoteMsg] = useState<{ appId: string; text: string } | null>(null);

  // 부모(page.tsx)가 router.refresh 등으로 새 applicants 를 내려주면 동기화.
  useEffect(() => {
    setList(applicants);
  }, [applicants]);

  // 승인/거절 — 기존 PATCH 그대로 (status 0 → 1/2)
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
        // 거절 시 빈자리 발생 → 대기열 자동 승격(서버)이 일어날 수 있어 서버 상태 재반영.
        if (action === "reject") router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  // [M6 E-1] 승격 확정 — 기존 confirm POST 재사용.
  //   promotion_deadline 활성 대기자만 호출(버튼 자체가 그 경우에만 노출).
  //   200=확정 / 410=만료(다음 순번) / 409=정원 재마감. 모두 router.refresh 로 갱신.
  async function handlePromote(appId: string) {
    setLoading(appId + "promote");
    setPromoteMsg(null);
    try {
      const res = await fetch(
        `/api/web/games/${gameId}/applications/${appId}/confirm`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        setPromoteMsg({ appId, text: data.message ?? "참가가 확정되었습니다." });
        router.refresh();
      } else if (res.status === 410) {
        setPromoteMsg({
          appId,
          text: data.error ?? "승격 확정 시간이 만료되어 다음 순번으로 넘어갑니다.",
        });
        router.refresh();
      } else if (res.status === 409) {
        setPromoteMsg({
          appId,
          text: data.error ?? "정원이 다시 마감되어 확정할 수 없습니다.",
        });
        router.refresh();
      } else {
        setPromoteMsg({ appId, text: data.error ?? "확정 처리 중 오류가 발생했습니다." });
      }
    } catch {
      setPromoteMsg({ appId, text: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(null);
    }
  }

  // 3구획 분류
  const pending = list.filter((a) => a.status === 0); // ① 대기 승인
  const confirmed = list.filter((a) => a.status === 1); // ② 확정 참가자
  // ③ 대기열 — waitlist_position 오름차순(없으면 뒤로)
  const waitlist = list
    .filter((a) => a.status === 3)
    .sort((x, y) => (x.waitlist_position ?? 9999) - (y.waitlist_position ?? 9999));

  // 표시명 헬퍼
  const displayName = (a: Applicant) => a.nickname ?? a.name ?? "익명";

  return (
    <div className="space-y-6">
      {/* ① 대기 승인 (status=0) */}
      <section>
        <p className="mb-2 text-sm font-medium text-[var(--color-warning)]">
          대기 승인 {pending.length}명
        </p>
        {pending.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">새 신청이 없어요.</p>
        ) : (
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
                      <span className="inline-flex items-center rounded-[4px] bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-on-accent)]">
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
                      {/* 4단계 A: 신청자 닉네임 → 공개프로필 PlayerLink. user_id 없으면 자동 span fallback. */}
                      <p className="text-sm font-medium">
                        <PlayerLink userId={a.user_id} name={displayName(a)} />
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
                        className="min-h-[44px] px-4 py-1.5 text-sm"
                        onClick={() => handleAction(a.id, "approve")}
                        disabled={!!loading}
                      >
                        {loading === a.id + "approve" ? "..." : "승인"}
                      </Button>
                      <Button
                        className="min-h-[44px] px-4 py-1.5 text-sm"
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
        )}
      </section>

      {/* ② 확정 참가자 (status=1) */}
      <section>
        <p className="mb-2 text-sm font-medium text-[var(--color-success)]">
          확정 참가자 {confirmed.length}명
        </p>
        {confirmed.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">아직 확정된 참가자가 없어요.</p>
        ) : (
          <div className="space-y-2">
            {confirmed.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-[12px] bg-[var(--color-surface-bright)] px-4 py-2.5"
              >
                {/* 4단계 A: 확정 참가자도 PlayerLink 적용 (일관성) */}
                <p className="text-sm">
                  <PlayerLink userId={a.user_id} name={displayName(a)} />
                </p>
                <Badge variant="success">{STATUS_LABEL[1]}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ③ 대기열 (status=3) — waitlist_position 순번 + 승격 확정 */}
      <section>
        <p className="mb-2 text-sm font-medium text-[var(--color-accent)]">
          대기열 {waitlist.length}명
        </p>
        {waitlist.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">대기 중인 신청자가 없어요.</p>
        ) : (
          <div className="space-y-2">
            {waitlist.map((a, i) => {
              // 승격 가능 여부 = promotion_deadline 이 살아있는(미래) 대기자만.
              //   서버 confirm 이 deadline null/만료 시 410 을 반환하므로, UI 도 동일 기준으로
              //   활성 대기자에게만 "승격 확정" 버튼을 노출한다.
              const deadline = a.promotion_deadline ?? null;
              const isPromotable = deadline !== null && new Date(deadline).getTime() > Date.now();
              const left = deadline ? secondsLeft(deadline) : 0;
              const mm = String(Math.floor(left / 60)).padStart(2, "0");
              const ss = String(left % 60).padStart(2, "0");
              // 표시 순번 — DB waitlist_position 우선, 없으면 정렬 인덱스 기반.
              const orderNo = a.waitlist_position ?? i + 1;
              return (
                <div
                  key={a.id}
                  className="rounded-[12px] border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* 순번 원형 배지 — 정사각(W=H) 50% (pill 9999px 금지 규칙 준수) */}
                      <span
                        aria-hidden
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[50%] bg-[var(--color-accent)]/15 font-mono text-base font-extrabold text-[var(--color-accent)]"
                      >
                        {orderNo}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          <PlayerLink userId={a.user_id} name={displayName(a)} />
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {[a.position, a.city, a.district].filter(Boolean).join(" · ") || "정보 없음"}
                        </p>
                      </div>
                    </div>

                    {/* 승격 액션 — deadline 활성 대기자만 "승격 확정", 그 외는 안내 */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {isPromotable ? (
                        <>
                          <span className="font-mono text-xs font-bold text-[var(--color-accent)]">
                            알림 전송됨 · {mm}:{ss}
                          </span>
                          <Button
                            className="min-h-[44px] px-4 py-1.5 text-sm"
                            onClick={() => handlePromote(a.id)}
                            disabled={!!loading}
                          >
                            {loading === a.id + "promote" ? "..." : "승격 확정"}
                          </Button>
                        </>
                      ) : (
                        <span className="text-right text-xs text-[var(--color-text-muted)]">
                          대기 중
                          <br />
                          <span className="text-[var(--color-text-secondary)]">
                            빈자리 시 자동 알림
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 승격 confirm 결과 메시지 (해당 행만) */}
                  {promoteMsg && promoteMsg.appId === a.id && (
                    <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                      {promoteMsg.text}
                    </p>
                  )}
                </div>
              );
            })}
            {/* 대기열 정책 안내 — 시안 박제(운영 자동 승격 정책 설명) */}
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              빈자리가 생기면 대기 1번에게 자동으로 알림이 가고, 30분 안에 응답하지 않으면
              다음 순번으로 넘어갑니다.
            </p>
          </div>
        )}
      </section>

      {list.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)]">아직 신청자가 없습니다.</p>
      )}
    </div>
  );
}
