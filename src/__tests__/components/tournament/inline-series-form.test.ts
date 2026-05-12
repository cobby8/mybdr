/**
 * 2026-05-13 — InlineSeriesForm 헬퍼 회귀 방지.
 *
 * 본 테스트는 React DOM 마운트 대신 **순수 함수** 만 검증한다.
 * 이유:
 *   - 프로젝트에 React Testing Library 미설치 (admin-me-phase2.test.ts 와 동일 패턴).
 *   - 컴포넌트의 페이로드 변환 / dropdown 옵션 보충 로직만 헬퍼로 분리 검증.
 *
 * 검증 범위:
 *   - buildCreateSeriesPayload: name trim / 빈 문자열 거부 / organization_id 키 조건부 포함
 *   - resolveCreatedOrganization: orgId 매칭 / 미선택 시 null / 미일치 시 null
 */

import { describe, it, expect } from "vitest";
import {
  buildCreateSeriesPayload,
  resolveCreatedOrganization,
} from "@/components/tournament/inline-series-form";

describe("buildCreateSeriesPayload — 시리즈 생성 페이로드 빌더", () => {
  it("이름이 비어있으면 ok:false + 에러 메시지", () => {
    const r = buildCreateSeriesPayload({ name: "", orgId: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("시리즈 이름을 입력하세요.");
  });

  it("이름이 공백만 있으면 trim 후 빈 문자열 → ok:false", () => {
    const r = buildCreateSeriesPayload({ name: "   ", orgId: "" });
    expect(r.ok).toBe(false);
  });

  it("이름만 있고 단체 미선택이면 organization_id 키 미포함", () => {
    const r = buildCreateSeriesPayload({ name: "BDR 시리즈", orgId: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body).toEqual({ name: "BDR 시리즈" });
      expect("organization_id" in r.body).toBe(false);
    }
  });

  it("단체 선택 시 organization_id 키 포함", () => {
    const r = buildCreateSeriesPayload({ name: "강남협회 시리즈", orgId: "3" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body).toEqual({ name: "강남협회 시리즈", organization_id: "3" });
    }
  });

  it("이름 앞뒤 공백 trim 적용", () => {
    const r = buildCreateSeriesPayload({ name: "  내 시리즈  ", orgId: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body.name).toBe("내 시리즈");
    }
  });
});

describe("resolveCreatedOrganization — 생성 응답 단체 객체 보충", () => {
  const myOrgs = [
    { id: "3", name: "강남구농구협회" },
    { id: "8", name: "BDR 클럽" },
  ];

  it("orgId 미선택 (빈 문자열) → null", () => {
    expect(resolveCreatedOrganization("", myOrgs)).toBeNull();
  });

  it("orgId 매칭 시 { id, name, slug:'' } 반환", () => {
    expect(resolveCreatedOrganization("3", myOrgs)).toEqual({
      id: "3",
      name: "강남구농구협회",
      slug: "",
    });
  });

  it("orgId 가 myOrgs 에 없으면 null (방어적)", () => {
    expect(resolveCreatedOrganization("99", myOrgs)).toBeNull();
  });
});
