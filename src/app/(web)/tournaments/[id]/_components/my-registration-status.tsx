"use client";

/**
 * 내 대회 참가 상태 트래킹 컴포넌트 (UC2 시안 박제 — 2026-05-28)
 *
 * variant 분기:
 *  - 'sidebar' (default) — UA2 대회 상세 페이지 사이드바용 풀카드
 *      eyebrow + status pill + 종별/팀명 + 5 STEPS + next action + 마이페이지 CTA
 *  - 'compact'           — UC1 마이페이지 / 활동 리스트 셀용 한 줄 카드 (PR-1C-5 에서 사용)
 *
 * 시안: Dev/design/BDR-current/screens/MyRegistrationStatus.jsx (121 LOC)
 * CSS:  ./my-registration-status.css (5 STEPS + pill 톤 6종)
 *
 * 5 STEPS: 신청 → 승인 대기 → 승인 → 결제 완료 → 진행 중
 *
 * 데이터 소스 — 기존 prop 시그니처 (`tournamentId`) 유지:
 *  - tournamentId 만 props 로 받아 내부에서 /api/web/tournaments/[id]/my-status SWR 호출
 *  - 호출처 영향 0 (tournament-sidebar.tsx + page.tsx 모두 동일 시그니처 유지)
 *
 * API 미구현 시 silent fail (onError) — 시안 데이터 없어도 sidebar variant 는 안전하게 미노출
 */

import useSWR from "swr";
import "./my-registration-status.css";

// 5 STEPS — 시안 MyRegistrationStatus.jsx L14~20
const STEPS = [
  { idx: 0, label: "신청", short: "신청" },
  { idx: 1, label: "승인 대기", short: "대기" },
  { idx: 2, label: "승인", short: "승인" },
  { idx: 3, label: "결제 완료", short: "결제" },
  { idx: 4, label: "진행 중", short: "진행" },
] as const;

// status 별 메타 — 시안 STATUS_META L22~30 박제
const STATUS_META = {
  pending: { label: "승인 대기", tone: "warn", ico: "schedule" },
  approved: { label: "결제 대기", tone: "accent", ico: "payments" },
  paid: { label: "결제 완료", tone: "ok", ico: "verified" },
  in_progress: { label: "진행 중", tone: "navy", ico: "sports_basketball" },
  completed: { label: "종료", tone: "mute", ico: "flag" },
  rejected: { label: "거절됨", tone: "err", ico: "cancel" },
  waitlist: { label: "대기자", tone: "mute", ico: "queue" },
} as const;

type StatusKey = keyof typeof STATUS_META;

// API 응답 타입 (운영 /api/web/tournaments/[id]/my-status — 구현 전이면 silent)
interface MyStatusResponse {
  registered: boolean;
  status: string | null;
  payment_status: string | null;
  team_name: string | null;
  // 시안 확장 필드 (운영 API 확장 시 자연 흡수, 미구현 시 폴백)
  division?: string | null;
  next_action?: string | null;
  submitted_at?: string | null;
  tn_name?: string | null;
}

// 정규화된 reg 데이터 — sidebar / compact 양쪽이 동일 형식 사용
// export: UC1 (PR-1C-5 마이페이지) 의 변환 헬퍼가 reg prop 타입을 맞추기 위해 사용
export interface NormalizedReg {
  tn_name: string;
  division: string;
  team_name: string;
  status: StatusKey;
  step_idx: number;
  next_action: string;
  submitted_at?: string;
}

interface Props {
  /**
   * UA2 사용 시: tournamentId 만 넘기면 내부 API 호출
   * (tournament-sidebar.tsx / page.tsx 양쪽 동일 호출 시그니처 유지)
   */
  tournamentId?: string;

  /**
   * UC1 (PR-1C-5) 사용 시: 외부에서 reg 데이터 주입 + compact variant
   * — 마이페이지 등 리스트 컨텍스트에서 API 직접 부르지 않고 부모가 정규화 전달
   */
  reg?: NormalizedReg;

  /** 'sidebar' (default) | 'compact' */
  variant?: "sidebar" | "compact";

  /** 마이페이지 → 내 대회 진입 핸들러 (sidebar CTA) */
  onOpenMy?: () => void;

  /** 대회 상세 진입 핸들러 (compact 이름/CTA 클릭) */
  onOpenTn?: () => void;
}

// status/payment_status → step_idx 매핑 (운영 API 폴백 — 기존 로직 유지)
function getStepIndex(
  status: string | null,
  paymentStatus: string | null,
): number {
  // 시안 5 STEPS 기준으로 매핑
  // 진행 중: status === "in_progress" 또는 paid + 대회 시작 후 (운영 API 확장 전 미구분)
  if (status === "in_progress") return 4;
  if (status === "approved" && paymentStatus === "paid") return 3; // 결제 완료
  if (status === "approved") return 2; // 승인 (결제 대기)
  if (status === "pending") return 1; // 승인 대기
  return 0; // 신청
}

// 운영 status/payment_status → 시안 StatusKey 매핑
function getStatusKey(
  status: string | null,
  paymentStatus: string | null,
): StatusKey {
  // 시안 enum 7 종 매핑 — 운영 status 와 동의어 처리
  if (status === "rejected") return "rejected";
  if (status === "cancelled" || status === "completed") return "completed";
  if (status === "waiting" || status === "waitlist") return "waitlist";
  if (status === "in_progress") return "in_progress";
  if (status === "approved" && paymentStatus === "paid") return "paid";
  if (status === "approved") return "approved";
  return "pending";
}

// 5 STEPS 시각화 (시안 Steps 컴포넌트 박제)
function Steps({
  stepIdx,
  status,
}: {
  stepIdx: number;
  status: StatusKey;
}) {
  // 거절(rejected) 시 첫 step만 err 상태, 나머지는 mute
  const isRejected = status === "rejected";
  return (
    <ol className="mrs-steps" aria-label="신청 진행 단계">
      {STEPS.map((s, i) => {
        const done = !isRejected && i < stepIdx;
        const cur = !isRejected && i === stepIdx;
        const state = isRejected
          ? i === 0
            ? "err"
            : "mute"
          : done
            ? "done"
            : cur
              ? "cur"
              : "mute";
        return (
          <li key={s.idx} className={"mrs-step is-" + state}>
            <span className="mrs-step__dot">
              {state === "done" && (
                <span className="ico material-symbols-outlined">check</span>
              )}
              {state === "cur" && <span className="mrs-step__cur" />}
              {state === "err" && (
                <span className="ico material-symbols-outlined">close</span>
              )}
              {state === "mute" && (
                <span className="mrs-step__idx">{i + 1}</span>
              )}
            </span>
            <span className="mrs-step__lbl">{s.short}</span>
            {i < STEPS.length - 1 && <span className="mrs-step__line" />}
          </li>
        );
      })}
    </ol>
  );
}

export function MyRegistrationStatus({
  tournamentId,
  reg: regProp,
  variant = "sidebar",
  onOpenMy = () => {},
  onOpenTn = () => {},
}: Props) {
  // 변형 1: 부모가 reg 주입 (UC1 마이페이지 리스트) — API 호출 없이 즉시 렌더
  // 변형 2: tournamentId 만 받음 (UA2 sidebar) — 내부 SWR 호출
  // 어느 케이스든 useSWR 훅 호출은 항상 — React Hooks 규칙 (조건부 호출 금지)
  const { data, isLoading } = useSWR<MyStatusResponse>(
    !regProp && tournamentId
      ? `/api/web/tournaments/${tournamentId}/my-status`
      : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onError: () => {}, // API 미구현 silent
    },
  );

  // reg 데이터 정규화 — 외부 주입 우선, 없으면 SWR 결과 변환
  let reg: NormalizedReg | null = null;

  if (regProp) {
    reg = regProp;
  } else if (data && data.registered) {
    reg = {
      tn_name: data.tn_name ?? "",
      division: data.division ?? "참가",
      team_name: data.team_name ?? "",
      status: getStatusKey(data.status, data.payment_status),
      step_idx: getStepIndex(data.status, data.payment_status),
      next_action: data.next_action ?? "",
      submitted_at: data.submitted_at ?? undefined,
    };
  }

  // 비참가 / 로딩 / 비로그인 — 노출 안 함
  if (!regProp && isLoading) return null;
  if (!reg) return null;

  const meta = STATUS_META[reg.status] ?? STATUS_META.pending;

  // ---------- compact variant (UC1) ----------
  if (variant === "compact") {
    return (
      <article className="mrs mrs--compact" data-status={reg.status}>
        <header className="mrs__head">
          <div className="mrs__title-row">
            <h3 className="mrs__name" onClick={onOpenTn}>
              {reg.tn_name}
            </h3>
            <span className={"mrs__pill is-" + meta.tone}>
              <span className="ico material-symbols-outlined">{meta.ico}</span>
              {meta.label}
            </span>
          </div>
          <div className="mrs__meta">
            <span className="mrs__div">{reg.division}</span>
            <span className="mrs__sep">·</span>
            <span>{reg.team_name}</span>
            {reg.submitted_at && (
              <>
                <span className="mrs__sep">·</span>
                <span className="mrs__sub">신청 {reg.submitted_at}</span>
              </>
            )}
          </div>
        </header>
        <Steps stepIdx={reg.step_idx} status={reg.status} />
        <footer className="mrs__foot">
          <span className="mrs__next">{reg.next_action}</span>
          <button
            type="button"
            className="btn btn--sm"
            onClick={onOpenTn}
          >
            대회 상세
          </button>
        </footer>
      </article>
    );
  }

  // ---------- sidebar variant (UA2 default) ----------
  return (
    <aside className="mrs mrs--sidebar" data-status={reg.status}>
      <div className="mrs__sb-head">
        <span className="mrs__eyebrow">내 참가 현황</span>
        <span className={"mrs__pill is-" + meta.tone}>
          <span className="ico material-symbols-outlined">{meta.ico}</span>
          {meta.label}
        </span>
      </div>
      <div className="mrs__sb-team">
        <div className="mrs__div mrs__div--lg">{reg.division}</div>
        <div className="mrs__sb-team-name">{reg.team_name}</div>
      </div>
      <Steps stepIdx={reg.step_idx} status={reg.status} />
      {reg.next_action && (
        <div className="mrs__sb-next">
          <span className="ico material-symbols-outlined">arrow_forward</span>
          <span>{reg.next_action}</span>
        </div>
      )}
      <button
        type="button"
        className="btn btn--primary btn--touch mrs__sb-cta"
        onClick={onOpenMy}
      >
        마이페이지 → 내 대회
      </button>
    </aside>
  );
}
