"use client";

/**
 * 2026-05-11 Phase 1 — 팀 신청서 관리 클라이언트 컴포넌트.
 *
 * 디자인 룰 (E등급 admin / 디자인 토큰만 일치):
 *   - 색상: var(--bg-card / --border / --ink / --ink-mute / --accent) 등 신규 토큰만
 *   - 아이콘: Material Symbols Outlined (lucide-react 금지)
 *   - 버튼 border-radius 4px / pill 9999px 금지 / 정사각형 50% OK
 *   - placeholder 5단어 이내 / "예:" 금지
 *
 * 인터랙션:
 *   - 팀 추가 버튼 → 모달 (팀명·코치명·코치번호 입력)
 *   - 토큰 URL 복사 버튼 → navigator.clipboard + 토스트
 *   - 상태/만료 표시
 */

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

// 서버 컴포넌트가 전달하는 팀 row 타입 (직렬화된 plain object)
interface TeamRow {
  id: string;
  teamName: string;
  managerName: string | null;
  managerPhone: string | null;
  status: string;
  appliedVia: string | null;
  applyToken: string | null;          // 만료된 토큰은 null
  applyTokenExpiresAt: string | null; // ISO string
  playerCount: number;
}

interface Props {
  tournamentId: string;
  tournamentName: string;
  initialTeams: TeamRow[];
}

// 상태 라벨 매핑 — admin 운영자가 한눈에 보기 위함
const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
  waitlist: "대기열",
};

export function TeamApplicationsClient({
  tournamentId,
  tournamentName: _tournamentName,
  initialTeams,
}: Props) {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamRow[]>(initialTeams);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 토스트 자동 사라짐 (3초)
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 토큰 URL 복사 — window.location.origin 기반 (배포 환경 무관)
  const copyTokenUrl = useCallback(
    async (token: string | null) => {
      if (!token) {
        showToast("토큰이 만료되었습니다. 재발급이 필요합니다.");
        return;
      }
      const url = `${window.location.origin}/team-apply/${token}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast("토큰 URL이 복사되었습니다");
      } catch {
        showToast("복사에 실패했습니다");
      }
    },
    [showToast],
  );

  // 만료 표시 — ISO → 한국 날짜 (운영자가 한눈에)
  const formatExpiry = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div>
      {/* 상단 액션 바 — 팀 추가 버튼 */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
          코치에게 토큰 URL을 공유하면 비로그인으로 명단 입력 가능합니다.
        </p>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => setShowAddModal(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 4 }}>
            add
          </span>
          팀 추가
        </button>
      </div>

      {/* 팀 표 */}
      <div
        className="rounded overflow-hidden border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          borderRadius: 4,
        }}
      >
        <table className="w-full text-sm">
          <thead style={{ background: "var(--bg-head)" }}>
            <tr>
              <Th>팀명</Th>
              <Th>코치</Th>
              <Th>연락처</Th>
              <Th align="center">인원</Th>
              <Th align="center">상태</Th>
              <Th align="center">만료일</Th>
              <Th align="center">토큰 URL</Th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8"
                  style={{ color: "var(--ink-mute)" }}
                >
                  등록된 팀이 없습니다. 팀 추가 버튼으로 신청서를 발급하세요.
                </td>
              </tr>
            ) : (
              teams.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <Td><strong>{t.teamName}</strong></Td>
                  <Td>{t.managerName ?? "—"}</Td>
                  <Td style={{ color: "var(--ink-soft)" }}>{t.managerPhone ?? "—"}</Td>
                  <Td align="center">{t.playerCount}</Td>
                  <Td align="center">
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td align="center" style={{ color: "var(--ink-mute)", fontSize: 12 }}>
                    {formatExpiry(t.applyTokenExpiresAt)}
                  </Td>
                  <Td align="center">
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => copyTokenUrl(t.applyToken)}
                      disabled={!t.applyToken}
                      title={t.applyToken ? "URL 복사" : "만료됨"}
                      style={{
                        opacity: t.applyToken ? 1 : 0.45,
                        cursor: t.applyToken ? "pointer" : "not-allowed",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>
                        content_copy
                      </span>
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 팀 추가 모달 */}
      {showAddModal && (
        <AddTeamModal
          tournamentId={tournamentId}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newTeam) => {
            setTeams((prev) => [newTeam, ...prev]);
            setShowAddModal(false);
            showToast(`${newTeam.teamName} 토큰이 발급되었습니다`);
            // 서버 데이터 fresh — 만료/인원 등 사후 갱신 대비
            router.refresh();
          }}
        />
      )}

      {/* 토스트 — 화면 우상단 고정 */}
      {toast && (
        <div
          role="status"
          className="fixed top-20 right-4 px-4 py-3 text-sm shadow-md z-50"
          style={{
            background: "var(--bg-elev)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            minWidth: 200,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ===== 보조 컴포넌트 =====

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" }) {
  return (
    <th
      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
      style={{
        textAlign: align,
        color: "var(--ink-mute)",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  style,
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  style?: React.CSSProperties;
}) {
  return (
    <td
      className="px-3 py-2"
      style={{ textAlign: align, color: "var(--ink)", ...style }}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  // 상태별 토큰 매핑 — accent/ok/warn/danger 만 사용 (브랜드 룰)
  const label = STATUS_LABEL[status] ?? status;
  const colorVar =
    status === "approved"
      ? "var(--ok)"
      : status === "rejected"
        ? "var(--danger)"
        : "var(--warn)";
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs font-semibold"
      style={{
        background: "var(--bg-alt)",
        color: colorVar,
        border: `1px solid ${colorVar}`,
        borderRadius: 4,
      }}
    >
      {label}
    </span>
  );
}

// ===== 팀 추가 모달 =====

interface AddTeamModalProps {
  tournamentId: string;
  onClose: () => void;
  onSuccess: (team: TeamRow) => void;
}

function AddTeamModal({ tournamentId, onClose, onSuccess }: AddTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/admin/tournaments/${tournamentId}/team-applications`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamName, managerName, managerPhone }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          // API 응답이 snake_case 자동 변환되므로 에러 필드도 동일 룰
          // (apiError 는 변환 우회 — { error: "..." } 형태 그대로)
          setError(json.error ?? "신청 토큰 발급에 실패했습니다");
          return;
        }
        // 응답 구조: { team: { id, team_name, manager_name, manager_phone, apply_token_url, apply_token_expires_at } }
        const team = json.team;
        // URL 에서 token 만 추출 (UI 표 row 형식 정합)
        const url: string = team.apply_token_url;
        const token = url ? url.split("/team-apply/")[1] ?? null : null;
        onSuccess({
          id: team.id,
          teamName: team.team_name,
          managerName: team.manager_name,
          managerPhone: team.manager_phone,
          status: "pending",
          appliedVia: "coach_token",
          applyToken: token,
          applyTokenExpiresAt: team.apply_token_expires_at,
          playerCount: 0,
        });
      } catch {
        setError("네트워크 오류가 발생했습니다");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-6"
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: 4,
        }}
      >
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--ink)" }}
        >
          팀 추가 — 신청 토큰 발급
        </h2>

        <div className="space-y-3">
          <Field label="팀명">
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="강남동 슈터스"
              maxLength={50}
              className="input w-full"
              autoFocus
            />
          </Field>
          <Field label="코치 이름">
            <input
              type="text"
              required
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="홍길동"
              maxLength={30}
              className="input w-full"
            />
          </Field>
          <Field label="코치 연락처">
            <input
              type="tel"
              required
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              placeholder="010-1234-5678"
              className="input w-full"
            />
          </Field>
        </div>

        {error && (
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            className="btn btn--sm"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={isPending}
          >
            {isPending ? "발급 중..." : "토큰 발급"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="block text-xs font-semibold mb-1"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
