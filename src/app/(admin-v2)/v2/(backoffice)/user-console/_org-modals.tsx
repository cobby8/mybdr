"use client";

// ============================================================
// _org-modals.tsx — 단체 생성·수정 모달 (admin-v2 유저 콘솔)
//   OrgCreateModal : POST /api/web/organizations (isAdmin=true → 즉시 approved)
//   OrgEditModal   : PATCH /api/web/organizations/[id] (9필드 화이트리스트)
//   - adminFetch 자동 camel→snake 변환 활용 (body는 camelCase로 전달)
//   - PATCH 권한: API가 org owner/admin만 허용. 403 시 toast 안내.
//   - 백엔드/API 0변경
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Modal, Btn, Toggle, useAdminShell } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data";
import type { AdminBoOrg } from "@/lib/admin-v2/data";

// ── 폼 값 타입 ─────────────────────────────────────────────
// contactPhone·bannerUrl은 optional: 생성 모달(POST)이 이 2필드를 미사용하기
// 때문. POST /api/web/organizations route가 contact_phone·banner_url을 read하지
// 않아 입력해도 silent drop → 생성 모달에선 아예 필드·state를 두지 않는다.
// (수정 모달 PATCH는 두 필드 정상 저장 → 그대로 유지)
interface OrgFormValues {
  name: string;
  description: string;
  region: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl: string;
  logoUrl: string;
  bannerUrl?: string;
  isPublic: boolean;
}

// 생성 모달 전용 초기값 — contactPhone·bannerUrl 참조 없음(dead state 방지)
const BLANK_VALUES: OrgFormValues = {
  name: "", description: "", region: "",
  contactEmail: "", websiteUrl: "",
  logoUrl: "", isPublic: true,
};

// ── 공용 폼 필드 렌더 ─────────────────────────────────────
// mode="edit"(기본): 9필드 전부. mode="create": 연락처·배너 URL 제외(POST 미수신).
function OrgFormBody({
  values,
  onChange,
  mode = "edit",
}: {
  values: OrgFormValues;
  onChange: (k: keyof OrgFormValues, v: string | boolean) => void;
  mode?: "create" | "edit";
}) {
  // 웹사이트·로고 URL 필드는 두 모드가 공유 → 중복 없이 변수로 정의
  const websiteField = (
    <div className="ts-field" style={{ marginBottom: 0 }}>
      <label className="ts-field__label">웹사이트 URL</label>
      <input
        className="ts-input"
        value={values.websiteUrl}
        onChange={(e) => onChange("websiteUrl", e.target.value)}
        placeholder="https://..."
      />
    </div>
  );
  const logoField = (
    <div className="ts-field" style={{ marginBottom: 0 }}>
      <label className="ts-field__label">로고 URL</label>
      <input
        className="ts-input"
        value={values.logoUrl}
        onChange={(e) => onChange("logoUrl", e.target.value)}
        placeholder="https://..."
      />
    </div>
  );

  return (
    <div>
      <div className="ts-field">
        <label className="ts-field__label">
          단체명 <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          className="ts-input"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="단체명"
        />
      </div>

      <div className="ts-field">
        <label className="ts-field__label">설명</label>
        <textarea
          className="ts-input"
          style={{ minHeight: 68, resize: "vertical" }}
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="단체 소개 (선택)"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div className="ts-field" style={{ marginBottom: 0 }}>
          <label className="ts-field__label">활동 지역</label>
          <input
            className="ts-input"
            value={values.region}
            onChange={(e) => onChange("region", e.target.value)}
            placeholder="서울, 경기 등"
          />
        </div>
        <div className="ts-field" style={{ marginBottom: 0 }}>
          <label className="ts-field__label">연락 이메일</label>
          <input
            className="ts-input"
            type="email"
            value={values.contactEmail}
            onChange={(e) => onChange("contactEmail", e.target.value)}
            placeholder="contact@example.com"
          />
        </div>
      </div>

      {mode === "edit" ? (
        // 수정 모달: 9필드 전부 유지 (연락처 | 웹사이트) · (로고 | 배너)
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="ts-field" style={{ marginBottom: 0 }}>
              <label className="ts-field__label">연락처</label>
              <input
                className="ts-input"
                value={values.contactPhone ?? ""}
                onChange={(e) => onChange("contactPhone", e.target.value)}
                placeholder="010-xxxx-xxxx"
              />
            </div>
            {websiteField}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {logoField}
            <div className="ts-field" style={{ marginBottom: 0 }}>
              <label className="ts-field__label">배너 URL</label>
              <input
                className="ts-input"
                value={values.bannerUrl ?? ""}
                onChange={(e) => onChange("bannerUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </>
      ) : (
        // 생성 모달: 연락처·배너 URL 제외 → 웹사이트 | 로고 2열로 재배치
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {websiteField}
          {logoField}
        </div>
      )}

      <div
        className="ts-field"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
      >
        <div>
          <div className="ts-field__label" style={{ marginBottom: 0 }}>공개 여부</div>
          <div className="ts-field__hint" style={{ marginTop: 4 }}>공개 시 누구나 단체 페이지를 볼 수 있습니다</div>
        </div>
        <Toggle on={values.isPublic} onChange={(v) => onChange("isPublic", v)} />
      </div>
    </div>
  );
}

// ── 단체 생성 모달 ─────────────────────────────────────────
export function OrgCreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();
  const [values, setValues] = React.useState<OrgFormValues>(BLANK_VALUES);
  const [busy, setBusy] = React.useState(false);

  const onChange = React.useCallback(
    (k: keyof OrgFormValues, v: string | boolean) =>
      setValues((prev) => ({ ...prev, [k]: v })),
    []
  );

  const handleClose = () => {
    setValues(BLANK_VALUES);
    onClose();
  };

  const submit = async () => {
    if (!values.name.trim()) {
      toast("단체명은 필수입니다");
      return;
    }
    setBusy(true);
    try {
      // adminFetch 자동 camel→snake 변환: name/description/region 등은 1:1.
      // logoUrl→logo_url, contactEmail→contact_email 등 자동 변환됨.
      // ⚠ contactPhone·bannerUrl은 POST route가 미수신 → silent drop이라 전송 안 함.
      //   (수정 모달 PATCH만 두 필드 저장. UI에서도 생성 모달엔 두 입력칸 없음)
      await adminFetch("/api/web/organizations", {
        method: "POST",
        body: {
          name: values.name.trim(),
          description: values.description.trim() || null,
          region: values.region.trim() || null,
          contactEmail: values.contactEmail.trim() || null,
          websiteUrl: values.websiteUrl.trim() || null,
          logoUrl: values.logoUrl.trim() || null,
          isPublic: values.isPublic,
        },
      });
      toast("단체가 등록됐습니다 (즉시 승인)");
      handleClose();
      router.refresh();
    } catch (e) {
      toast(e instanceof AdminApiError ? e.message : "단체 등록에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="새 단체 등록"
      sub="관리자 등록 — 즉시 승인 처리됩니다"
      maxWidth={560}
      foot={
        <>
          <Btn variant="secondary" onClick={handleClose} disabled={busy}>
            취소
          </Btn>
          <Btn icon="plus" onClick={submit} disabled={busy}>
            등록
          </Btn>
        </>
      }
    >
      <OrgFormBody values={values} onChange={onChange} mode="create" />
    </Modal>
  );
}

// ── 단체 수정 모달 ─────────────────────────────────────────
export function OrgEditModal({
  row,
  open,
  onClose,
}: {
  row: AdminBoOrg & { color: string };
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();

  // row 데이터로 초기값 세팅 (AdminBoOrg 확장 필드 사용)
  const initValues = React.useMemo<OrgFormValues>(
    () => ({
      name: row.name,
      description: row.description ?? "",
      region: row.region === "-" ? "" : row.region,
      contactEmail: row.contactEmail ?? "",
      contactPhone: row.contactPhone ?? "",
      websiteUrl: row.website ?? "",
      logoUrl: row.logoUrl ?? "",
      bannerUrl: row.bannerUrl ?? "",
      isPublic: row.isPublic,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [row.id]
  );

  const [values, setValues] = React.useState<OrgFormValues>(initValues);
  const [busy, setBusy] = React.useState(false);

  // row 변경 시 폼 초기화
  React.useEffect(() => {
    setValues(initValues);
  }, [initValues]);

  const onChange = React.useCallback(
    (k: keyof OrgFormValues, v: string | boolean) =>
      setValues((prev) => ({ ...prev, [k]: v })),
    []
  );

  const submit = async () => {
    if (!values.name.trim()) {
      toast("단체명은 필수입니다");
      return;
    }
    setBusy(true);
    try {
      // PATCH: 화이트리스트 9필드. adminFetch camel→snake 자동 변환.
      // ⚠ API 권한: org owner/admin만 허용. super_admin 전역 우회 없음.
      //   403 시 API 메시지 "수정 권한이 없습니다." 를 toast로 표시.
      await adminFetch(`/api/web/organizations/${row.id}`, {
        method: "PATCH",
        body: {
          name: values.name.trim(),
          description: values.description.trim() || null,
          region: values.region.trim() || null,
          contactEmail: values.contactEmail.trim() || null,
          // contactPhone·bannerUrl은 OrgFormValues에서 optional → ?? "" 로 안전 처리.
          // 수정 모달은 initValues에서 항상 string 세팅이라 동작 변화 없음.
          contactPhone: (values.contactPhone ?? "").trim() || null,
          websiteUrl: values.websiteUrl.trim() || null,
          logoUrl: values.logoUrl.trim() || null,
          bannerUrl: (values.bannerUrl ?? "").trim() || null,
          isPublic: values.isPublic,
        },
      });
      toast(values.name + " 단체 정보가 수정됐습니다");
      onClose();
      router.refresh();
    } catch (e) {
      toast(e instanceof AdminApiError ? e.message : "단체 수정에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="단체 정보 수정"
      sub={row.name}
      maxWidth={560}
      foot={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={busy}>
            취소
          </Btn>
          <Btn icon="save" onClick={submit} disabled={busy}>
            저장
          </Btn>
        </>
      }
    >
      <OrgFormBody values={values} onChange={onChange} />
    </Modal>
  );
}
