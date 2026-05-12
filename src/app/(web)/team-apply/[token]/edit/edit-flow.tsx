"use client";

/**
 * 2026-05-12 — 코치 명단 수정 흐름.
 *
 * Phase 1 (auth): 코치 이름 + 전화번호 인증 입력
 *   - POST /api/web/team-apply/[token]/players body: { manager_name, manager_phone }
 *   - 200 OK = 기존 명단 반환 → Phase 2
 *   - 401 = 인증 실패 (이름/전화 mismatch)
 *
 * Phase 2 (editing): TeamApplyForm prefill (mode='edit')
 *   - 저장 시 PUT /api/web/team-apply/[token] body: { manager_name, manager_phone, players }
 *   - 동일 인증 매칭 + 명단 DELETE + INSERT
 */

import { useState } from "react";
import { TeamApplyForm } from "../team-apply-form";
import { PhoneInput } from "@/components/inputs/phone-input";
import { normalizePhone } from "@/lib/utils/korean-grade";

type DivisionRule = {
  code: string;
  label: string;
  birthYearMin: number | null;
  birthYearMax: number | null;
  gradeMin: number | null;
  gradeMax: number | null;
} | null;

type PlayerRow = {
  player_name: string;
  birth_date: string;
  jersey_number: string;
  position: string;
  school_name: string;
  parent_name: string;
  parent_phone: string;
};

type ServerPlayer = {
  player_name: string;
  birth_date: string;
  jersey_number: number;
  position: string | null;
  school_name: string | null;
  grade: number | null;
  parent_name: string | null;
  parent_phone: string;
};

interface Props {
  token: string;
  teamName: string;
  divisionRule: DivisionRule;
}

export function EditFlow({ token, teamName, divisionRule }: Props) {
  const [phase, setPhase] = useState<"auth" | "editing">("auth");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialPlayers, setInitialPlayers] = useState<PlayerRow[]>([]);
  const [authPayload, setAuthPayload] = useState<{
    manager_name: string;
    manager_phone: string;
  } | null>(null);

  const submitAuth = async () => {
    setError(null);
    const trimmedName = name.trim();
    const normalizedPhone = normalizePhone(phone);
    if (!trimmedName) {
      setError("코치 이름을 입력하세요.");
      return;
    }
    if (!normalizedPhone) {
      setError("코치 연락처를 010-XXXX-XXXX 형식으로 입력하세요.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(`/api/web/team-apply/${token}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manager_name: trimmedName,
          manager_phone: normalizedPhone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "COACH_AUTH_FAILED") {
          setError("코치 이름 또는 연락처가 일치하지 않습니다. 최초 등록한 정보로 다시 시도하세요.");
        } else {
          setError(json.error ?? "인증에 실패했습니다.");
        }
        setVerifying(false);
        return;
      }

      // prefill — 서버 응답 (snake_case) → PlayerRow (form 입력 형식)
      const players = (json.players ?? []) as ServerPlayer[];
      const rows: PlayerRow[] = players.map((p) => ({
        player_name: p.player_name,
        birth_date: p.birth_date,
        jersey_number: String(p.jersey_number),
        position: p.position ?? "",
        school_name: p.school_name ?? "",
        parent_name: p.parent_name ?? "",
        parent_phone: p.parent_phone,
      }));
      setInitialPlayers(rows.length > 0 ? rows : []);
      setAuthPayload({
        manager_name: trimmedName,
        manager_phone: normalizedPhone,
      });
      setPhase("editing");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setVerifying(false);
    }
  };

  if (phase === "auth") {
    return (
      <div
        className="rounded-[4px] border p-4 sm:p-6"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-card)",
        }}
      >
        <h2 className="mb-3 text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          코치 인증
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          최초 명단을 등록한 코치 이름과 연락처로 본인 확인 후 수정 가능합니다.
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              코치 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 최영철"
              className="w-full rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              코치 연락처
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
        </div>

        {error && (
          <div
            className="mt-3 rounded-[4px] border p-2 text-sm"
            style={{
              borderColor: "var(--color-error)",
              background: "color-mix(in srgb, var(--color-error) 8%, transparent)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={submitAuth}
            disabled={verifying}
            className="btn btn--primary"
          >
            {verifying ? "확인 중..." : "확인 및 수정"}
          </button>
        </div>
      </div>
    );
  }

  // phase === 'editing' — TeamApplyForm prefill + PUT 호출
  return (
    <>
      <div
        className="mb-4 rounded-[4px] border p-3 text-sm"
        style={{
          borderColor: "var(--color-success)",
          background: "color-mix(in srgb, var(--color-success) 6%, transparent)",
          color: "var(--color-success)",
        }}
      >
        ✅ {teamName} 코치 인증 완료 — 기존 명단 {initialPlayers.length}명 불러옴
      </div>
      <TeamApplyForm
        token={token}
        divisionRule={divisionRule}
        mode="edit"
        initialPlayers={initialPlayers}
        editAuth={authPayload ?? undefined}
      />
    </>
  );
}
