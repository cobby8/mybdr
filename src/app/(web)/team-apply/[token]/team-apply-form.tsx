"use client";

/**
 * 2026-05-11 Phase 3-A — 코치 명단 입력 폼 (client component).
 *
 * 기능:
 *   - 동적 행 추가/삭제 + 종별 룰 가이드 + 서버 검증 (zod + 종별)
 *   - 학년 자동 계산 (생년월일 → 한국 학년 — 초/중/고)
 *   - 카카오톡 복사 붙여넣기 (한 줄 = 한 명, 슬래시 구분)
 *
 * 필수 입력: 이름 / 생년월일 / 등번호 / 부모 연락처
 * 선택 입력: 포지션 / 학교명 / 부모 이름 (학년은 자동 계산 readonly)
 *
 * 디자인 토큰 일관 (var(--color-*)) / lucide-react 0 / Material Symbols Outlined.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BirthDateInput } from "@/components/inputs/birth-date-input";
import { PhoneInput } from "@/components/inputs/phone-input";
import {
  birthDateToGrade,
  gradeToKorean,
  normalizeBirthDate,
  normalizePhone,
} from "@/lib/utils/korean-grade";

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
  parent_name: string;
  parent_phone: string;
};

const EMPTY_ROW: PlayerRow = {
  player_name: "",
  birth_date: "",
  jersey_number: "",
  position: "",
  school_name: "",
  parent_name: "",
  parent_phone: "",
};

const POSITIONS = ["", "G", "F", "C", "PG", "SG", "SF", "PF"];

interface Props {
  token: string;
  divisionRule: DivisionRule;
  // 2026-05-12 — 수정 모드 (사용자 요청). 'edit' 시 PUT + manager_name/phone 인증 body 추가.
  mode?: "create" | "edit";
  initialPlayers?: PlayerRow[];
  editAuth?: { manager_name: string; manager_phone: string };
}

export function TeamApplyForm({
  token,
  divisionRule,
  mode = "create",
  initialPlayers,
  editAuth,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<PlayerRow[]>(
    initialPlayers && initialPlayers.length > 0 ? initialPlayers : [{ ...EMPTY_ROW }],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number } | null>(null);

  // 카카오톡 복사 붙여넣기
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const addRow = () => setRows((r) => [...r, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const updateRow = (i: number, field: keyof PlayerRow, value: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  // 카카오톡 텍스트 parsing — 한 줄 = 한 명 / 슬래시 구분
  // 형식: 이름/생년월일/등번호/포지션/학교명/부모님성함/부모님연락처
  const handlePasteApply = () => {
    setPasteError(null);
    const lines = pasteText.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) {
      setPasteError("붙여넣을 명단이 없습니다.");
      return;
    }
    const parsed: PlayerRow[] = [];
    const errors: string[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split("/").map((s) => s.trim());
      if (parts.length < 2) {
        errors.push(`${idx + 1}줄: 형식 오류 (최소 이름/생년월일 필요)`);
        return;
      }
      const [name, birth, jersey, position, school, parentName, parentPhone] = parts;
      const normalizedBirth = normalizeBirthDate(birth ?? "");
      if (!normalizedBirth) {
        errors.push(`${idx + 1}줄 (${name}): 생년월일 형식 오류 "${birth}"`);
        return;
      }
      const normalizedPhone = parentPhone ? normalizePhone(parentPhone) : null;
      parsed.push({
        player_name: name,
        birth_date: normalizedBirth,
        jersey_number: jersey ?? "",
        position: position ?? "",
        school_name: school ?? "",
        parent_name: parentName ?? "",
        parent_phone: normalizedPhone ?? parentPhone ?? "",
      });
    });
    if (errors.length > 0) {
      setPasteError(errors.join("\n"));
    }
    if (parsed.length > 0) {
      // 기존 빈 행 1개만 있으면 교체 / 그 외에는 추가
      setRows((cur) => {
        const isInitialSingle = cur.length === 1 && !cur[0].player_name && !cur[0].birth_date;
        return isInitialSingle ? parsed : [...cur, ...parsed];
      });
      setPasteText("");
      setPasteOpen(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 클라이언트 사전 검증 — 필수 4개 (이름/생년월일/등번호/부모연락처)
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.player_name.trim()) {
        setError(`${i + 1}번 선수: 이름은 필수입니다.`);
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r.birth_date)) {
        setError(`${i + 1}번 선수: 생년월일은 필수입니다 (YYYY-MM-DD).`);
        return;
      }
      if (!r.jersey_number.trim() || isNaN(Number(r.jersey_number))) {
        setError(`${i + 1}번 선수: 등번호는 필수입니다.`);
        return;
      }
      const phoneNorm = normalizePhone(r.parent_phone);
      if (!phoneNorm) {
        setError(`${i + 1}번 선수: 부모 연락처는 필수입니다 (010-XXXX-XXXX).`);
        return;
      }
    }

    // 2026-05-15 — 등번호 중복 사전 차단 (DB unique 위반 시 500 응답 회귀 영구 차단).
    //   schema TournamentTeamPlayer @@unique([tournamentTeamId, jerseyNumber]) — 같은 팀 내
    //   등번호 중복 불가. 이전엔 클라이언트/서버 가드 0건 → DB createMany P2002 → throw → 500.
    //   첫 번째 충돌 row 만 표시 (사용자가 한 번에 1건씩 fix 하도록 UX 단순화).
    const seenJersey = new Map<number, number>(); // 등번호 → 첫 등장 row index
    for (let i = 0; i < rows.length; i++) {
      const num = Number(rows[i].jersey_number);
      if (seenJersey.has(num)) {
        const firstIdx = seenJersey.get(num)!;
        setError(`${i + 1}번 선수: 등번호 ${num}이(가) ${firstIdx + 1}번 선수와 중복됩니다. 한 팀 안에서 등번호는 unique 해야 합니다.`);
        return;
      }
      seenJersey.set(num, i);
    }

    setSubmitting(true);
    try {
      const players = rows.map((r) => {
        const grade = birthDateToGrade(r.birth_date);
        return {
          player_name: r.player_name.trim(),
          birth_date: r.birth_date,
          jersey_number: Number(r.jersey_number),
          position: r.position || null,
          school_name: r.school_name.trim() || null,
          grade: grade != null && grade > 0 && grade <= 12 ? grade : null,
          parent_name: r.parent_name.trim() || null,
          parent_phone: normalizePhone(r.parent_phone),
        };
      });
      // 2026-05-12 — 수정 모드 = PUT + manager_name/phone 인증 body 포함
      const payload =
        mode === "edit" && editAuth
          ? { ...editAuth, players }
          : { players };

      const res = await fetch(`/api/web/team-apply/${token}`, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // [정밀화] 응답 본문을 먼저 text 로 받고 안전하게 JSON parse
      // 이유: 5xx HTML 페이지(Vercel timeout 등) 또는 빈 응답 시 res.json() 직접 호출하면
      //       SyntaxError 발생 → catch 블록이 "네트워크 오류"로 뭉뚱그려 진단 불가
      const text = await res.text();
      // any: 서버 응답 스키마는 case-by-case (성공 페이로드 vs apiError 구조) 통합 타입 없음
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // HTML(5xx 페이지) 또는 빈 응답 — json 은 null 유지
      }

      if (!res.ok) {
        // 응답 키는 snake_case 우선 + camelCase fallback (apiError 자동 변환 함정 회피)
        if (json?.code === "DIVISION_VALIDATION_FAILED" && Array.isArray(json.errors)) {
          const msgs = json.errors.map((e: { index: number; field: string; message: string }) =>
            `${e.index + 1}번 선수 ${e.field === "birth_date" ? "생년월일" : "학년"}: ${e.message}`,
          );
          setError(msgs.join("\n"));
        } else {
          // 4xx/5xx 진짜 에러 메시지 추출 — error / message / error_message / code 순서
          const code = json?.code ?? json?.error_code;
          const msg =
            json?.error ??
            json?.message ??
            json?.error_message ??
            (code ? `요청 실패 (${code})` : `서버 오류 (${res.status})`);
          setError(msg);
        }
        setSubmitting(false);
        return;
      }

      setSuccess({ count: json?.inserted_count ?? json?.updated_count ?? rows.length });
      setTimeout(() => router.refresh(), 5000);
    } catch (e) {
      // [정밀화] 여기에는 진짜 network 예외만 도달 (DNS 실패 / offline / abort)
      // JSON parse 실패는 위에서 처리되므로 catch 블록 도달 0
      const reason = e instanceof Error ? e.message : "알 수 없는 오류";
      setError(`네트워크 오류: ${reason}`);
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
      {/* 카카오톡 복사 붙여넣기 영역 */}
      <div
        className="mb-4 rounded-[4px] border p-3"
        style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
      >
        <button
          type="button"
          onClick={() => setPasteOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            <span className="material-symbols-outlined text-base align-middle mr-1">content_paste</span>
            카카오톡 명단 한 번에 붙여넣기
          </span>
          <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-muted)" }}>
            {pasteOpen ? "expand_less" : "expand_more"}
          </span>
        </button>

        {pasteOpen && (
          <div className="mt-3 space-y-2">
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              한 줄에 한 명. 형식: <code className="rounded bg-black/10 px-1">이름/생년월일/등번호/포지션/학교명/부모님성함/부모님연락처</code>
              <br />
              예: <code className="rounded bg-black/10 px-1">홍길동/2017-05-16/7/G/강남초등학교/홍판서/010-1234-5678</code>
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder={"홍길동/2017-05-16/7/G/강남초등학교/홍판서/010-1234-5678\n김철수/2017-08-22/12/F/잠실초등학교/김아빠/010-9876-5432"}
              className="w-full rounded-[4px] border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-text-primary)",
              }}
            />
            {pasteError && (
              <p className="text-xs whitespace-pre-line" style={{ color: "var(--color-error)" }}>
                {pasteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setPasteText(""); setPasteError(null); }} className="btn btn--sm">
                지우기
              </button>
              <button type="button" onClick={handlePasteApply} className="btn btn--primary btn--sm">
                명단 자동 입력
              </button>
            </div>
          </div>
        )}
      </div>

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
          <PlayerRowEditor
            key={i}
            index={i}
            row={row}
            divisionRule={divisionRule}
            onChange={(field, value) => updateRow(i, field, value)}
            onRemove={rows.length > 1 ? () => removeRow(i) : undefined}
          />
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

// ── 선수 1명 입력 카드 ──
function PlayerRowEditor({
  index,
  row,
  divisionRule,
  onChange,
  onRemove,
}: {
  index: number;
  row: PlayerRow;
  divisionRule: DivisionRule;
  onChange: (field: keyof PlayerRow, value: string) => void;
  onRemove?: () => void;
}) {
  // 생년월일 → 학년 자동 계산 (한국 표기 — 초/중/고만, "8학년" 등 절대학년 노출 0)
  const computedGrade = useMemo(() => {
    if (!row.birth_date) return null;
    const g = birthDateToGrade(row.birth_date);
    return g != null ? { label: gradeToKorean(g) } : null;
  }, [row.birth_date]);

  return (
    <div
      className="rounded-[4px] border p-3 sm:p-4"
      style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
          {index + 1}번 선수
        </span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs" style={{ color: "var(--color-error)" }}>
            삭제
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <FieldText
          label="이름 *"
          value={row.player_name}
          onChange={(v) => onChange("player_name", v)}
          placeholder="홍길동"
          required
        />
        {/* 사이트 전역 표준 BirthDateInput — 숫자만 입력 → 자동 YYYY-MM-DD 포맷 */}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            생년월일 *
          </span>
          <BirthDateInput
            value={row.birth_date}
            onChange={(v) => onChange("birth_date", v)}
            required
            className="w-full rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-card)",
              color: "var(--color-text-primary)",
            }}
          />
        </label>
        <FieldNumber
          label="등번호 *"
          value={row.jersey_number}
          onChange={(v) => onChange("jersey_number", v)}
          min={0}
          max={99}
          required
        />
        <FieldSelect
          label="포지션"
          value={row.position}
          onChange={(v) => onChange("position", v)}
          options={POSITIONS}
        />
        <FieldText
          label="학교명"
          value={row.school_name}
          onChange={(v) => onChange("school_name", v)}
          placeholder="강남초등학교"
        />

        {/* 학년 자동 표시 (readonly) — 생년월일 입력 시 자동 계산. 한국 학년 표기만 (초/중/고). */}
        <div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              학년 (자동)
              {/* 2026-05-12 룰 변경: 어린 학년 자유 참가 / gradeMax 만 안내 ("N학년 이하") */}
              {divisionRule?.gradeMax && (
                <span className="ml-1" style={{ color: "var(--color-text-muted)" }}>
                  · 종별 {gradeToKorean(divisionRule.gradeMax)} 이하
                </span>
              )}
            </span>
            <div
              className="rounded-[4px] border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-card)",
                color: computedGrade ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {computedGrade ? computedGrade.label : "생년월일 입력 시 자동"}
            </div>
          </label>
        </div>

        <FieldText
          label="부모 이름"
          value={row.parent_name}
          onChange={(v) => onChange("parent_name", v)}
          placeholder="홍판서"
        />
        {/* 사이트 전역 표준 PhoneInput — 숫자만 입력 → 자동 010-XXXX-XXXX 포맷 */}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            부모 연락처 *
          </span>
          <PhoneInput
            value={row.parent_phone}
            onChange={(v) => onChange("parent_phone", v)}
            required
            className="w-full rounded-[4px] border px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-card)",
              color: "var(--color-text-primary)",
            }}
          />
        </label>
      </div>
    </div>
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
  label, value, onChange, min, max, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  min?: number; max?: number; required?: boolean;
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

