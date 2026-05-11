"use client";

/**
 * 2026-05-11 Phase 3-A — 코치 명단 입력 폼 (client component).
 *
 * 동적 행 추가/삭제 + 서버 검증 (종별 룰) + POST /api/web/team-apply/[token].
 * 디자인 토큰 일관 (var(--color-*)) / lucide-react 0 / Material Symbols Outlined.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  birth_date: string;        // YYYY-MM-DD
  jersey_number: string;     // input은 string, 제출 시 number 변환
  position: string;
  school_name: string;
  grade: string;
  parent_name: string;
  parent_phone: string;
};

const EMPTY_ROW: PlayerRow = {
  player_name: "",
  birth_date: "",
  jersey_number: "",
  position: "",
  school_name: "",
  grade: "",
  parent_name: "",
  parent_phone: "",
};

const POSITIONS = ["", "G", "F", "C", "PG", "SG", "SF", "PF"];

interface Props {
  token: string;
  divisionRule: DivisionRule;
}

export function TeamApplyForm({ token, divisionRule }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<PlayerRow[]>([{ ...EMPTY_ROW }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number } | null>(null);

  const addRow = () => setRows((r) => [...r, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: keyof PlayerRow, value: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 클라이언트 사전 검증 (필수)
    const valid = rows.every(
      (r) => r.player_name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(r.birth_date),
    );
    if (!valid) {
      setError("이름과 생년월일은 필수 입력입니다.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        players: rows.map((r) => ({
          player_name: r.player_name.trim(),
          birth_date: r.birth_date,
          jersey_number: r.jersey_number ? Number(r.jersey_number) : null,
          position: r.position || null,
          school_name: r.school_name.trim() || null,
          grade: r.grade ? Number(r.grade) : null,
          parent_name: r.parent_name.trim() || null,
          parent_phone: r.parent_phone.trim() || null,
        })),
      };

      const res = await fetch(`/api/web/team-apply/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        // 종별 검증 실패 — 구체 메시지 표시
        if (json.code === "DIVISION_VALIDATION_FAILED" && Array.isArray(json.errors)) {
          const msgs = json.errors.map((e: { index: number; field: string; message: string }) =>
            `${e.index + 1}번 선수 ${e.field === "birth_date" ? "생년월일" : "학년"}: ${e.message}`,
          );
          setError(msgs.join("\n"));
        } else {
          setError(json.error ?? "제출에 실패했습니다.");
        }
        setSubmitting(false);
        return;
      }

      setSuccess({ count: json.inserted_count ?? rows.length });
      // 5초 후 새로고침 (제출 완료 화면으로 자연 전환)
      setTimeout(() => router.refresh(), 5000);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div
        className="rounded-[4px] border p-6 text-center"
        style={{ borderColor: "var(--color-success)", background: "color-mix(in srgb, var(--color-success) 8%, transparent)" }}
      >
        <span className="material-symbols-outlined text-4xl" style={{ color: "var(--color-success)" }}>
          check_circle
        </span>
        <h2 className="mt-2 text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          제출 완료
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {success.count}명의 선수 명단이 등록되었습니다.
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          이 페이지는 일회용이며 재진입이 불가합니다.<br />
          수정이 필요하면 운영자에게 요청하세요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">선수 명단 ({rows.length}명)</h2>
        <button
          type="button"
          onClick={addRow}
          className="btn btn--sm"
          style={{ background: "var(--color-primary)", color: "#fff", borderColor: "var(--color-primary)" }}
        >
          + 선수 추가
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className="rounded-[4px] border p-3 sm:p-4"
            style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                {i + 1}번 선수
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-xs"
                  style={{ color: "var(--color-error)" }}
                >
                  삭제
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <FieldText
                label="이름 *"
                value={row.player_name}
                onChange={(v) => updateRow(i, "player_name", v)}
                placeholder="홍길동"
                required
              />
              <FieldText
                label="생년월일 *"
                type="date"
                value={row.birth_date}
                onChange={(v) => updateRow(i, "birth_date", v)}
                required
              />
              <FieldNumber
                label="등번호"
                value={row.jersey_number}
                onChange={(v) => updateRow(i, "jersey_number", v)}
                min={0}
                max={99}
              />
              <FieldSelect
                label="포지션"
                value={row.position}
                onChange={(v) => updateRow(i, "position", v)}
                options={POSITIONS}
              />
              <FieldText
                label="학교명"
                value={row.school_name}
                onChange={(v) => updateRow(i, "school_name", v)}
                placeholder="강남초등학교"
              />
              <FieldNumber
                label={`학년${divisionRule?.gradeMin ? ` (${divisionRule.gradeMin}학년)` : ""}`}
                value={row.grade}
                onChange={(v) => updateRow(i, "grade", v)}
                min={1}
                max={12}
              />
              <FieldText
                label="부모 이름"
                value={row.parent_name}
                onChange={(v) => updateRow(i, "parent_name", v)}
                placeholder="홍판서"
              />
              <FieldText
                label="부모 연락처"
                value={row.parent_phone}
                onChange={(v) => updateRow(i, "parent_phone", v)}
                placeholder="010-1234-5678"
                type="tel"
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          className="mt-4 rounded-[4px] border p-3 text-sm whitespace-pre-line"
          style={{
            borderColor: "var(--color-error)",
            background: "color-mix(in srgb, var(--color-error) 8%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn btn--primary"
          style={{ minWidth: 120 }}
        >
          {submitting ? "제출 중..." : "명단 제출"}
        </button>
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
        제출 후 이 페이지는 일회용으로 만료됩니다. 수정이 필요하면 운영자에게 요청하세요.
      </p>
    </form>
  );
}

// ── 입력 컴포넌트 ──

function FieldText({
  label, value, onChange, placeholder, required, type,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-card)",
          color: "var(--color-text-primary)",
        }}
      />
    </label>
  );
}

function FieldNumber({
  label, value, onChange, min, max,
}: {
  label: string; value: string; onChange: (v: string) => void;
  min?: number; max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-card)",
          color: "var(--color-text-primary)",
        }}
      />
    </label>
  );
}

function FieldSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-card)",
          color: "var(--color-text-primary)",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "선택"}
          </option>
        ))}
      </select>
    </label>
  );
}
