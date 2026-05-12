"use client";

/**
 * InlineSeriesForm — wizard 안에서 즉석 시리즈 생성 인라인 폼.
 *
 * 2026-05-13 — UI-1.2 / UI-1.3 공통 컴포넌트.
 *
 * 이유 (왜):
 *   - 신규/편집 wizard 양쪽에서 시리즈 dropdown 옆에 "새 시리즈 만들기" 인라인 폼을 띄워야 함.
 *   - 운영자가 wizard 를 떠나지 않고 시리즈 생성 → 즉시 dropdown 에 반영 → 자동 선택 흐름 보장.
 *   - 단체 페이지의 인라인 폼 패턴 (organizations/[orgId]/page.tsx L416-437) 을 wizard 용으로 일반화.
 *
 * 어떻게 (방법):
 *   - 본인 owner/admin 단체 dropdown (선택) + 시리즈 이름 input (필수) + 만들기/취소 버튼.
 *   - POST /api/web/series 호출 — 성공 시 onCreated({ id, name, organization }) 콜백.
 *   - 단체 미선택 = "개인 시리즈" (organization_id = null) — 정상 동작 (API 가 nullable 허용).
 *   - 단체 dropdown 옵션 = props 로 받은 myOrgs (owner/admin 만 부모에서 필터링).
 *
 * Props:
 *   - myOrgs: 단체 옵션 (id, name)
 *   - onCreated: 생성 성공 콜백 (새 시리즈 객체 — dropdown 자동 선택용)
 *   - onCancel: 취소 콜백
 */

import { useState } from "react";

// 부모에서 전달받는 단체 옵션 타입 — minimal (id, name) 만 필요.
type OrgOption = {
  id: string;
  name: string;
};

// 생성 성공 시 부모에 돌려주는 시리즈 객체 — dropdown 옵션과 동일 형태.
export type CreatedSeries = {
  id: string;
  name: string;
  organization: { id: string; name: string; slug: string } | null;
};

interface Props {
  myOrgs: OrgOption[];
  onCreated: (s: CreatedSeries) => void;
  onCancel: () => void;
}

/**
 * buildCreatePayload — 시리즈 생성 POST 페이로드를 만든다 (테스트 가능 헬퍼).
 *
 * 이유: 분기 (a) name trim / 빈 문자열 검증, (b) organization_id 키 조건부 포함을
 *   컴포넌트 외부에서 vitest 로 검증하려고 분리. 컴포넌트는 본 함수 + fetch + state 만 책임.
 *
 * 반환:
 *   - { ok: true, body } — 정상 페이로드
 *   - { ok: false, error } — 검증 실패 (name 비어있음 등)
 */
export function buildCreateSeriesPayload(input: {
  name: string;
  orgId: string;
}): { ok: true; body: Record<string, unknown> } | { ok: false; error: string } {
  const trimmed = input.name.trim();
  if (!trimmed) {
    return { ok: false, error: "시리즈 이름을 입력하세요." };
  }
  // 단체 미선택 (orgId === "") 시 organization_id 키 자체를 안 박음 → 서버에서 null 처리.
  const body: Record<string, unknown> = { name: trimmed };
  if (input.orgId) {
    body.organization_id = input.orgId;
  }
  return { ok: true, body };
}

/**
 * resolveCreatedOrganization — 생성 응답 + myOrgs 에서 dropdown 옵션용 organization 객체를 만든다.
 *
 * 이유: POST /api/web/series 응답은 organization 객체를 안 내려줌. dropdown 라벨 박제를 위해
 *   클라이언트가 보유한 myOrgs 에서 매칭해서 보충. orgId 미선택 시 null.
 */
export function resolveCreatedOrganization(
  orgId: string,
  myOrgs: OrgOption[],
): { id: string; name: string; slug: string } | null {
  if (!orgId) return null;
  const matched = myOrgs.find((o) => o.id === orgId);
  if (!matched) return null;
  return { id: matched.id, name: matched.name, slug: "" };
}

export function InlineSeriesForm({ myOrgs, onCreated, onCancel }: Props) {
  // 시리즈 이름 (필수) / 단체 선택 (선택 — 빈 문자열 = 개인 시리즈)
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 시리즈 생성 API 호출
  // 이유: POST /api/web/series 는 organization_id 가 null 이면 개인 시리즈로 처리.
  //   본 컴포넌트는 부모가 이미 myOrgs 를 owner/admin 으로 필터링했다고 가정 (서버 이중 가드).
  async function handleCreate() {
    // 페이로드 검증 & 빌드는 별도 헬퍼 — vitest 단위 검증 가능.
    const built = buildCreateSeriesPayload({ name, orgId });
    if (!built.ok) {
      setError(built.error);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/web/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built.body),
      });

      // apiSuccess 가 한 번 감싸므로 json.data.{id, name, ...} 형식.
      // 단 series POST 응답은 organization 객체를 내려주지 않음 — 부모에서 myOrgs 조회로 보충.
      const json = (await res.json()) as {
        data?: { id?: string; name?: string };
        error?: string;
      };

      if (!res.ok) {
        setError(json.error ?? "시리즈 생성 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      const created = json.data;
      if (!created?.id || !created?.name) {
        setError("응답이 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      onCreated({
        id: created.id,
        name: created.name,
        // 단체 정보 보충 — 별도 헬퍼 (vitest 검증 가능).
        organization: resolveCreatedOrganization(orgId, myOrgs),
      });

      // 폼 초기화 — 부모가 폼을 닫지 않더라도 다음 입력을 위해.
      setName("");
      setOrgId("");
      setLoading(false);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    // wizard 카드 안에 들어가는 보조 영역 — 구분 명확하도록 background + border 적용.
    <div className="mt-2 space-y-2 rounded-md bg-[var(--color-elevated)] p-3">
      {/* 단체 선택 — 옵션 없으면 dropdown 자체를 숨김 (개인 시리즈 안내만) */}
      {myOrgs.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
            소속 단체 (선택)
          </label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-full rounded-[4px] border-none bg-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            disabled={loading}
          >
            <option value="">개인 시리즈 (단체 미연결)</option>
            {myOrgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 시리즈 이름 + 만들기/취소 버튼 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="시리즈 이름"
          className="flex-1 rounded-[4px] border-none bg-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
          disabled={loading}
          onKeyDown={(e) => {
            // 한글 IME composition 중 Enter 차단 (organizations/[orgId] 패턴 동일)
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="rounded-[4px] bg-[var(--color-info)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "생성 중..." : "만들기"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-[4px] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-40"
        >
          취소
        </button>
      </div>

      {/* 에러 메시지 — color-mix 10% 투명 토큰 (admin 빨강 본문 금지 룰) */}
      {error && (
        <div className="rounded-[4px] bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-error)]">
          {error}
        </div>
      )}
    </div>
  );
}
