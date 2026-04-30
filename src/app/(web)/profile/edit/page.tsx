"use client";

/* ============================================================
 * /profile/edit — 시안 v2(1) EditProfile.jsx 박제 (5탭 구조)
 *
 * 왜 (Phase 9 P1-5):
 *  - 시안 v2(1) EditProfile은 좌측 사이드 네비 + 5탭 (기본/플레이/연락/사진/공개)
 *  - 우리 기존 페이지는 한 페이지에 모든 섹션 일렬 → 길이가 길어 사용성 떨어짐
 *  - 5탭 구조 박제 + 기존 환불 계좌·소셜 연동·회원 탈퇴는 "추가 탭"으로 보존
 *
 * 어떻게:
 *  - 좌측 220px 사이드 + 우측 카드 본문
 *  - 탭은 React state로 관리 (URL 쿼리 미사용 — 시안 동일)
 *  - 모든 form state / fetch / save / withdraw API 100% 보존
 *  - photo / privacy 탭은 시안 박제하되 백엔드 미구현 → "준비 중" 안내
 *
 * 보존:
 *  - GET /api/web/profile (초기 로드)
 *  - PATCH /api/web/profile (저장)
 *  - POST /api/web/profile/generate-bio (AI bio)
 *  - DELETE /api/web/auth/withdraw (회원 탈퇴)
 *  - 모든 form/bankForm/regions state
 * ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BANKS } from "@/lib/constants/banks";
import { RegionPicker, type Region } from "@/components/shared/region-picker";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

interface ProfileEditData {
  name: string | null;
  nickname: string | null;
  birth_date: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  bio: string | null;
  bank_name: string | null;
  bank_code: string | null;
  account_number_masked: string | null;
  account_holder: string | null;
  has_account: boolean;
  // 소셜 로그인 제공자 (kakao, google, apple 등)
  provider: string | null;
  // 프로필 사진 URL (Vercel Blob) — 업로드 후 헤더 UserDropdown 갱신용
  profile_image_url: string | null;
}

// 소셜 제공자별 표시 정보 매핑
const SOCIAL_PROVIDERS: Record<string, { label: string; icon: string; color: string }> = {
  kakao: { label: "카카오", icon: "chat_bubble", color: "#FEE500" },
  google: { label: "Google", icon: "mail", color: "#4285F4" },
  apple: { label: "Apple", icon: "phone_iphone", color: "#A2AAAD" },
  naver: { label: "네이버", icon: "language", color: "#03C75A" },
};

// 시안 v2(1) 5탭 + 우리 추가 2탭(환불계좌/소셜+탈퇴) = 6탭
type TabKey = "basic" | "skill" | "contact" | "refund" | "photo" | "privacy";

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: "basic", label: "기본 정보", icon: "person" },
  { id: "skill", label: "플레이 정보", icon: "sports_basketball" },
  { id: "contact", label: "연락 정보", icon: "mail" },
  { id: "refund", label: "환불 계좌", icon: "account_balance" },
  { id: "photo", label: "사진", icon: "image" },
  { id: "privacy", label: "공개·계정", icon: "lock" },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saved, setSaved] = useState(false); // 시안 ✓ 저장됨 표시

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    birth_date: "",
    phone: "",
    position: "",
    height: "",
    weight: "",
    bio: "",
  });
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);

  // 닉네임 중복확인 state — 저장 전 사용자가 직접 검증할 수 있도록
  // status: idle(미체크) | checking(요청 중) | available(사용 가능) | taken(사용 중) | error(네트워크/검증 실패)
  // checkedNickname: 검증한 시점의 닉네임 — form.nickname 과 다르면 결과 무효 (입력값 변경 시 idle 리셋)
  const [nicknameCheck, setNicknameCheck] = useState<{
    status: "idle" | "checking" | "available" | "taken" | "error";
    message: string;
    checkedNickname: string;
  }>({ status: "idle", message: "", checkedNickname: "" });

  const [bankForm, setBankForm] = useState({
    bank_name: "",
    bank_code: "",
    account_number: "",
    account_holder: "",
    account_consent: false,
  });
  const [maskedAccount, setMaskedAccount] = useState<string | null>(null);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  // 소셜 계정 연동 상태 (읽기 전용 표시)
  const [provider, setProvider] = useState<string | null>(null);
  // 회원 탈퇴 모달 상태
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  // 프로필 사진 업로드 state — Vercel Blob 연동
  // profileImageUrl: 현재 등록된 이미지 URL (null = 이니셜 fallback 표시)
  // imageUploading: POST 진행 중 (버튼 disabled + 스피너)
  // imageError: 검증/업로드 실패 메시지 (인라인 표시 — alert 신규 0건 룰)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  // 숨겨진 file input 을 button onClick 으로 트리거하기 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/web/profile")
      .then((r) => r.json())
      .then((data: { user?: ProfileEditData; error?: string }) => {
        if (data.error || !data.user) {
          router.push("/login");
          return;
        }
        const u = data.user;
        setForm({
          name: u.name ?? "",
          nickname: u.nickname ?? "",
          birth_date: u.birth_date ?? "",
          phone: u.phone ?? "",
          position: u.position ?? "",
          height: u.height?.toString() ?? "",
          weight: u.weight?.toString() ?? "",
          bio: u.bio ?? "",
        });
        // city/district 콤마 구분 → Region[]으로 변환
        const cities = (u.city ?? "").split(",").filter(Boolean);
        const districts = (u.district ?? "").split(",").filter(Boolean);
        if (cities.length > 0) {
          setRegions(cities.map((c, i) => ({ city: c, district: districts[i] ?? "" })));
        }
        setBankForm((prev) => ({
          ...prev,
          bank_name: u.bank_name ?? "",
          bank_code: u.bank_code ?? "",
          account_holder: u.account_holder ?? "",
        }));
        setMaskedAccount(u.account_number_masked);
        setHasExistingAccount(u.has_account);
        setProvider(u.provider ?? null);
        // 프로필 사진 URL 초기화 — 사진 탭에서 96px 아바타 분기에 사용
        setProfileImageUrl(u.profile_image_url ?? null);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const togglePosition = (pos: string) => {
    setForm((p) => {
      const selected = p.position ? p.position.split(",") : [];
      const idx = selected.indexOf(pos);
      if (idx >= 0) {
        selected.splice(idx, 1);
      } else {
        selected.push(pos);
      }
      return { ...p, position: selected.join(",") };
    });
  };

  const selectedPositions = form.position ? form.position.split(",") : [];

  // 프로필 사진 업로드 핸들러
  // 왜: file input onChange 시 클라 사이드 검증(빠른 실패) → multipart POST → 응답으로 URL 갱신
  // 어떻게:
  //  1) 파일 검증 (size 2MB, mime image/jpeg|png|webp) — 서버 도달 전 차단 (네트워크 절약)
  //  2) FormData 에 file 필드로 첨부 → POST /api/web/profile/upload-image
  //  3) 성공 시 profileImageUrl 갱신 + 1.5초 뒤 reload (헤더 UserDropdown 새 이미지 반영)
  //  4) 실패 시 imageError 인라인 메시지 (alert 신규 0건 룰)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    const file = e.target.files?.[0];
    // 파일 input 은 같은 파일 재선택 가능하게 즉시 리셋 (취소 후 동일 파일 재선택 동작 보장)
    e.target.value = "";
    if (!file) return;

    // 클라 검증 1: MIME 타입 (서버와 동일 룰)
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setImageError("JPG, PNG, WEBP 형식만 업로드할 수 있습니다.");
      return;
    }
    // 클라 검증 2: 크기 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setImageError("이미지 크기는 2MB 이하여야 합니다.");
      return;
    }

    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/web/profile/upload-image", {
        method: "POST",
        body: fd,
        // multipart 는 Content-Type 헤더 자동 설정 (boundary 포함) — 직접 지정 금지
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        // 서버 친화 메시지 우선 (apiError 의 error 필드)
        throw new Error(data?.error ?? "업로드에 실패했습니다.");
      }
      // 응답은 snake_case 자동 변환됨 (apiSuccess 룰)
      const url = data?.profile_image_url as string | undefined;
      if (url) {
        setProfileImageUrl(url);
      }
      // 헤더 UserDropdown 갱신 — handleSave 와 동일 패턴 (1.5초 reload)
      // 이유: 헤더의 me 호출은 mount 1회만 발생 → reload 로 재호출 트리거
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setImageUploading(false);
    }
  };

  // 프로필 사진 제거 핸들러
  // 왜: profileImageUrl 있을 때만 활성화. DELETE 호출 → DB null + Blob 정리
  // 어떻게: 즉시 DELETE (별도 confirm 모달 없이 — UI 가 단순한 토글 성격)
  const handleImageDelete = async () => {
    setImageError("");
    setImageUploading(true);
    try {
      const res = await fetch("/api/web/profile/delete-image", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "제거에 실패했습니다.");
      }
      setProfileImageUrl(null);
      // 헤더 갱신 — 1.5초 reload
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "제거 중 오류가 발생했습니다.");
    } finally {
      setImageUploading(false);
    }
  };

  // 닉네임 중복확인 핸들러
  // 왜: PATCH 시점 P2002 회귀를 사전 차단 + 사용자가 저장 전에 충돌 여부 확인 가능
  // 어떻게: trim 후 GET /api/web/profile/check-nickname?nickname=... 호출, 결과로 status 갱신
  const handleCheckNickname = async () => {
    const trimmed = form.nickname.trim();
    // 빈/길이 위반은 클라에서 즉시 차단 (서버도 검증하지만 왕복 절감)
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNicknameCheck({
        status: "error",
        message: "닉네임은 2자 이상 20자 이하여야 합니다.",
        checkedNickname: trimmed,
      });
      return;
    }
    setNicknameCheck({ status: "checking", message: "확인 중...", checkedNickname: trimmed });
    try {
      const res = await fetch(
        `/api/web/profile/check-nickname?nickname=${encodeURIComponent(trimmed)}`,
        { credentials: "include" },
      );
      const data = await res.json();
      // 응답이 OK 가 아니면 에러로 분류 (400/500 등)
      if (!res.ok) {
        setNicknameCheck({
          status: "error",
          message: data?.error ?? "확인에 실패했습니다.",
          checkedNickname: trimmed,
        });
        return;
      }
      // available: true / false 분기
      if (data?.available === true) {
        setNicknameCheck({
          status: "available",
          message: "사용 가능한 닉네임입니다.",
          checkedNickname: trimmed,
        });
      } else {
        setNicknameCheck({
          status: "taken",
          message: data?.message ?? "이미 사용 중인 닉네임입니다.",
          checkedNickname: trimmed,
        });
      }
    } catch {
      setNicknameCheck({
        status: "error",
        message: "네트워크 오류로 확인에 실패했습니다.",
        checkedNickname: trimmed,
      });
    }
  };

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/web/profile/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      const bio = data.bio ?? data.data?.bio;
      if (bio) setForm((p) => ({ ...p, bio }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 자기소개 생성에 실패했습니다.");
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const filledRegions = regions.filter((r) => r.city);
      const payload: Record<string, unknown> = {
        name: form.name || null,
        nickname: form.nickname || null,
        birth_date: form.birth_date || null,
        phone: form.phone || null,
        city: filledRegions.map((r) => r.city).join(",") || null,
        district: filledRegions.map((r) => r.district).join(",") || null,
        position: form.position || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bio: form.bio || null,
      };

      if (bankForm.account_consent) {
        payload.account_consent = true;
        payload.bank_name = bankForm.bank_name || null;
        payload.bank_code = bankForm.bank_code || null;
        payload.account_holder = bankForm.account_holder || null;
        if (bankForm.account_number) {
          payload.account_number = bankForm.account_number;
        }
      }

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSuccessMsg("저장되었습니다.");
      // 시안: ✓ 저장됨 2초 표시
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // 저장 성공 후 1.5초 뒤 페이지 reload — 헤더의 닉네임/이미지 등 user state 갱신
      // 이유 (errors.md 04-30): JWT payload.name=nickname 발급 시점 박힘 + 헤더 me mount 1회만 호출.
      //                       닉네임/실명/지역 등 변경해도 헤더는 옛 값 유지 → reload 로 me 재호출 트리거.
      // 1.5초 = 사용자가 "저장되었습니다" 메시지 읽을 시간.
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 회원 탈퇴 처리 함수
  const handleWithdraw = async () => {
    setWithdrawError("");
    if (!withdrawPassword) {
      setWithdrawError("비밀번호를 입력해주세요.");
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await fetch("/api/web/auth/withdraw", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: withdrawPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "탈퇴 처리에 실패했습니다.");
      // 탈퇴 완료 후 홈으로 이동
      router.push("/");
    } catch (e) {
      setWithdrawError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div
          className="flex min-h-[60vh] items-center justify-center"
          style={{ color: "var(--ink-mute)" }}
        >
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    // 시안 v2(1) EditProfile.jsx 박제: page + 빵부스러기 + eyebrow/h1 + 사이드(220) + 카드 본문
    <div className="page">
      {/* 시안 빵부스러기: 홈 › 마이페이지 › 프로필 편집 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <Link href="/" style={{ color: "var(--ink-mute)" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/profile" style={{ color: "var(--ink-mute)" }}>
          마이페이지
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>프로필 편집</span>
      </div>

      {/* 시안 헤더: eyebrow + h1 좌측, 저장 액션 우측 */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">EDIT PROFILE · 프로필 편집</div>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            프로필 편집
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && (
            <span
              style={{
                color: "var(--ok)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ✓ 저장됨
            </span>
          )}
          <Link href="/profile" className="btn" style={{ textDecoration: "none" }}>
            취소
          </Link>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "저장중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 에러/성공 메시지 */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
            color: "var(--danger)",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {successMsg && !saved && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "color-mix(in srgb, var(--ok) 10%, transparent)",
            color: "var(--ok)",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {successMsg}
        </div>
      )}

      {/* 시안 v2(1): 좌측 220px 사이드 + 우측 본문 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr)",
          gap: 18,
          alignItems: "flex-start",
        }}
        className="profile-edit-grid"
      >
        {/* 사이드 탭 네비 */}
        <aside
          style={{
            position: "sticky",
            top: 120,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                data-active={active}
                style={{
                  textAlign: "left",
                  padding: "11px 14px",
                  background: active ? "var(--bg-alt)" : "transparent",
                  border: 0,
                  borderLeft: active
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  color: active ? "var(--ink)" : "var(--ink-soft)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    width: 20,
                    textAlign: "center",
                    color: active ? "var(--accent)" : "var(--ink-mute)",
                  }}
                >
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </aside>

        {/* 우측 카드 본문 (탭별 패널) */}
        <div
          className="card"
          style={{
            padding: "28px 32px",
            background: "var(--color-card)",
            border: "1px solid var(--border)",
            borderRadius: 4,
          }}
        >
          {/* 탭 1: 기본 정보 */}
          {tab === "basic" && (
            <div>
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                기본 정보
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* B-1: 닉네임 — sub 제거(자명) + placeholder 형식 힌트(2~20자)로 단순화 */}
                <Field label="닉네임 *">
                  {/* input + 중복확인 버튼 가로 배치 — 모바일도 wrap 안 함 */}
                  <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      value={form.nickname}
                      onChange={(e) => {
                        const next = e.target.value;
                        setForm((p) => ({ ...p, nickname: next }));
                        // 입력값이 검증한 값과 달라지면 결과 무효화 (사용자 혼동 방지)
                        if (next.trim() !== nicknameCheck.checkedNickname) {
                          setNicknameCheck({ status: "idle", message: "", checkedNickname: "" });
                        }
                      }}
                      placeholder="2~20자"
                    />
                    {/* 왜 type="button": form 안 submit 트리거 방지 (이 페이지는 form 미사용이지만 방어적) */}
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={handleCheckNickname}
                      disabled={
                        form.nickname.trim().length === 0 ||
                        saving ||
                        nicknameCheck.status === "checking"
                      }
                    >
                      {nicknameCheck.status === "checking" ? "확인 중..." : "중복확인"}
                    </button>
                  </div>
                  {/* 결과 메시지 — 입력값과 검증값이 일치할 때만 노출.
                      available: var(--ok), taken: var(--danger), error: var(--ink-mute) */}
                  {nicknameCheck.status !== "idle" &&
                    nicknameCheck.status !== "checking" &&
                    nicknameCheck.checkedNickname === form.nickname.trim() && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: 12,
                          color:
                            nicknameCheck.status === "available"
                              ? "var(--ok)"
                              : nicknameCheck.status === "taken"
                              ? "var(--danger)"
                              : "var(--ink-mute)",
                        }}
                        role={nicknameCheck.status === "taken" || nicknameCheck.status === "error" ? "alert" : "status"}
                      >
                        {/* 텍스트 마커만 — Material Symbols 없이 가벼운 표시 */}
                        {nicknameCheck.status === "available" && "✓ "}
                        {nicknameCheck.status === "taken" && "✕ "}
                        {nicknameCheck.message}
                      </p>
                    )}
                </Field>
                {/* B-2: 이름(실명) — 라벨 통일 + sub 제거(섹션 헤더에 일괄) */}
                <Field label="이름 *">
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="홍길동"
                  />
                </Field>
                <Field label="활동 지역" sub="주 활동 시·구 (최대 3개)" full>
                  <RegionPicker value={regions} onChange={setRegions} max={3} />
                </Field>
                <Field
                  label="생년월일"
                  sub="비공개 · 나이별 대회용"
                >
                  <input
                    type="date"
                    className="input"
                    value={form.birth_date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, birth_date: e.target.value }))
                    }
                  />
                </Field>
                {/* B-3: 휴대폰 — sub 제거(섹션 헤더에 일괄) */}
                <Field label="휴대폰">
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="input"
                    value={form.phone}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);
                      let formatted = digits;
                      if (digits.length > 7)
                        formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                      else if (digits.length > 3)
                        formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                      setForm((p) => ({ ...p, phone: formatted }));
                    }}
                    placeholder="01012345678"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* 탭 2: 플레이 정보 (포지션/신장/체중/자기소개) */}
          {tab === "skill" && (
            <div>
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                플레이 정보
              </h2>
              <Field
                label="주 포지션 *"
                sub="복수 선택 가능 · 게스트·매칭 필터링에 사용"
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {POSITIONS.map((pos) => {
                    const selected = selectedPositions.includes(pos);
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => togglePosition(pos)}
                        className={`btn btn--sm ${selected ? "btn--primary" : ""}`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <Field label="신장 (cm)">
                  <input
                    className="input"
                    type="number"
                    value={form.height}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, height: e.target.value }))
                    }
                    placeholder="180"
                    min={100}
                    max={250}
                  />
                </Field>
                {/* B-5: 체중 — 라벨 단순화 + sub 제거 + placeholder 형식만 */}
                <Field label="체중">
                  <input
                    className="input"
                    type="number"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, weight: e.target.value }))
                    }
                    placeholder="75"
                    min={30}
                    max={200}
                  />
                </Field>
              </div>
              <Field
                label="자기소개"
                sub={`${form.bio.length}/255 · AI 자동 작성 가능`}
                full
                style={{ marginTop: 16 }}
              >
                <div style={{ position: "relative" }}>
                  <textarea
                    className="input"
                    rows={4}
                    value={form.bio}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="간단한 자기소개 (최대 255자)"
                    maxLength={255}
                    style={{ resize: "vertical", paddingRight: 110 }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBio}
                    disabled={generatingBio}
                    className="btn btn--sm"
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      gap: 4,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className={`material-symbols-outlined ${generatingBio ? "animate-spin" : ""}`}
                      style={{ fontSize: 14 }}
                    >
                      auto_awesome
                    </span>
                    {generatingBio ? "생성 중..." : "AI 작성"}
                  </button>
                </div>
              </Field>
            </div>
          )}

          {/* 탭 3: 연락 정보 */}
          {tab === "contact" && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                연락 정보
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  fontSize: 13,
                  color: "var(--ink-mute)",
                }}
              >
                공개 여부는 [공개·계정] 탭에서 개별 조정할 수 있습니다.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Field label="휴대폰" sub="대회·환불 연락용">
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="input"
                    value={form.phone}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);
                      let formatted = digits;
                      if (digits.length > 7)
                        formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                      else if (digits.length > 3)
                        formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                      setForm((p) => ({ ...p, phone: formatted }));
                    }}
                    placeholder="01012345678"
                  />
                </Field>
                <Field label="이름 (실명)" sub="대회 등록 시 확인용">
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="홍길동"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* 탭 4: 환불 계좌 (시안에는 없는 우리 추가 탭 — 기존 기능 보존) */}
          {tab === "refund" && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                환불 계좌
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  fontSize: 13,
                  color: "var(--ink-mute)",
                }}
              >
                참가비·게스트비·픽업비 환불 시 사용됩니다
              </p>

              {hasExistingAccount && !bankForm.account_consent && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "12px 14px",
                    borderRadius: 4,
                    background: "var(--bg-alt)",
                    fontSize: 13,
                    color: "var(--ink-mute)",
                  }}
                >
                  현재 등록된 계좌:{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                    {maskedAccount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBankForm((p) => ({ ...p, account_consent: true }))
                    }
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: "var(--cafe-blue)",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    변경하기
                  </button>
                </div>
              )}

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 16,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              >
                <input
                  type="checkbox"
                  checked={bankForm.account_consent}
                  onChange={(e) =>
                    setBankForm((p) => ({
                      ...p,
                      account_consent: e.target.checked,
                    }))
                  }
                  style={{
                    marginTop: 2,
                    width: 16,
                    height: 16,
                    accentColor: "var(--accent)",
                  }}
                />
                <span>
                  개인정보(계좌번호) 수집·이용에 동의합니다{" "}
                  <span style={{ color: "var(--danger)" }}>(필수)</span>
                </span>
              </label>

              {bankForm.account_consent && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 16,
                  }}
                >
                  <Field label="은행">
                    <select
                      className="input"
                      value={bankForm.bank_code}
                      onChange={(e) => {
                        const selected = BANKS.find(
                          (b) => b.value === e.target.value
                        );
                        setBankForm((p) => ({
                          ...p,
                          bank_code: e.target.value,
                          bank_name: selected?.label ?? "",
                        }));
                      }}
                    >
                      <option value="">은행 선택</option>
                      {BANKS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="계좌번호"
                    sub="암호화되어 저장됩니다"
                  >
                    <input
                      className="input"
                      value={bankForm.account_number}
                      onChange={(e) =>
                        setBankForm((p) => ({
                          ...p,
                          account_number: e.target.value,
                        }))
                      }
                      placeholder={maskedAccount ?? "계좌번호 입력 (숫자만)"}
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="예금주명">
                    <input
                      className="input"
                      value={bankForm.account_holder}
                      onChange={(e) =>
                        setBankForm((p) => ({
                          ...p,
                          account_holder: e.target.value,
                        }))
                      }
                      placeholder="예금주 이름"
                      maxLength={20}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* 탭 5: 사진 (Vercel Blob 업로드 활성화) */}
          {tab === "photo" && (
            <div>
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                사진
              </h2>
              <Field
                label="프로필 사진"
                sub="정방형 권장 · 최대 2MB"
              >
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  {/* 96x96 원형 아바타 — 이미지 있으면 <Image>, 없으면 이니셜 fallback */}
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      background: "var(--cafe-blue)",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                      fontSize: 32,
                      fontFamily: "var(--ff-display)",
                      overflow: "hidden",
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    {profileImageUrl ? (
                      <Image
                        src={profileImageUrl}
                        alt="프로필 사진"
                        width={96}
                        height={96}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        unoptimized
                      />
                    ) : (
                      (form.nickname?.[0] || form.name?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    {/* 숨김 file input — 업로드 버튼 클릭 시 ref 로 트리거 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                    >
                      {imageUploading ? "업로드 중..." : "새 사진 업로드"}
                    </button>
                    {/* 제거 버튼: 이미지 있을 때만 활성화 */}
                    <button
                      type="button"
                      className="btn btn--sm"
                      style={{ marginLeft: 6, color: "var(--danger)" }}
                      onClick={handleImageDelete}
                      disabled={imageUploading || !profileImageUrl}
                    >
                      제거
                    </button>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-dim)",
                        marginTop: 8,
                      }}
                    >
                      PNG·JPG·WEBP · 정방형 권장 · 최대 2MB
                    </div>
                    {/* 인라인 에러 메시지 — alert 신규 0건 룰 */}
                    {imageError && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--danger)",
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        {imageError}
                      </div>
                    )}
                  </div>
                </div>
              </Field>
              <Field
                label="배너 이미지"
                sub="프로필 상단 · 1600×400 권장"
                full
                style={{ marginTop: 18 }}
              >
                <div
                  style={{
                    padding: 24,
                    border: "2px dashed var(--border)",
                    borderRadius: 8,
                    textAlign: "center",
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--cafe-blue) 15%, transparent), color-mix(in srgb, var(--accent) 15%, transparent))",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, opacity: 0.3 }}
                  >
                    photo_library
                  </span>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      marginTop: 6,
                    }}
                  >
                    드래그 또는 클릭해서 업로드
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      marginTop: 4,
                    }}
                  >
                    💎 BDR+ 멤버 전용 · 곧 제공됩니다
                  </div>
                </div>
              </Field>
            </div>
          )}

          {/* 탭 6: 공개·계정 (시안 privacy + 우리 소셜연동/회원탈퇴 통합) */}
          {tab === "privacy" && (
            <div>
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                공개 설정
              </h2>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  marginBottom: 16,
                }}
              >
                ⓘ 세부 공개 범위 설정은 곧 제공됩니다.
              </div>

              {/* 소셜 계정 연동 (provider 있을 때만) */}
              {provider && SOCIAL_PROVIDERS[provider] && (
                <>
                  <h2
                    style={{
                      margin: "24px 0 12px",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    연동된 계정
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--bg-alt)",
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        backgroundColor: SOCIAL_PROVIDERS[provider].color,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: "#fff", fontSize: 20 }}
                      >
                        {SOCIAL_PROVIDERS[provider].icon}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {SOCIAL_PROVIDERS[provider].label} 계정 연동됨
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ink-mute)",
                          marginTop: 2,
                        }}
                      >
                        소셜 로그인으로 가입한 계정입니다
                      </div>
                    </div>
                    <span className="badge badge--ok">연동됨</span>
                  </div>
                </>
              )}

              {/* 회원 탈퇴 (Danger Zone) — 시안 privacy 탭 하단으로 이동 */}
              <h2
                id="danger"
                style={{
                  margin: "32px 0 4px",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--danger)",
                }}
              >
                회원 탈퇴
              </h2>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 12,
                  color: "var(--ink-mute)",
                }}
              >
                탈퇴 시 개인정보가 삭제되며, 동일 이메일로 재가입할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                className="btn btn--sm"
                style={{
                  borderColor: "var(--danger)",
                  color: "var(--danger)",
                }}
              >
                회원 탈퇴
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 모바일에서 사이드 → 상단 가로 스크롤 탭으로 전환 */}
      <style jsx>{`
        @media (max-width: 768px) {
          .profile-edit-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-edit-grid > aside {
            position: static !important;
            flex-direction: row !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-bottom: 1px solid var(--border);
            padding-bottom: 4px;
          }
          /* 5탭 라벨 세로 글자 끊김 방지 — 가로 스크롤 + 충분한 폭 + 한 줄 강제 */
          .profile-edit-grid > aside > button {
            min-width: 100px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            border-left: 0 !important;
            border-bottom: 3px solid transparent !important;
            justify-content: center !important;
          }
          /* 활성 탭 표시를 좌측 → 하단으로 (가로 배치에 맞춤) */
          .profile-edit-grid > aside > button[data-active="true"] {
            border-bottom-color: var(--accent) !important;
          }
          /* 본문 영역 도움말/부제 한국어 어절 단위 줄바꿈 — "이/름" 글자 단위 끊김 방지 */
          .profile-edit-grid > div p,
          .profile-edit-grid > div label,
          .profile-edit-grid > div span {
            word-break: keep-all;
          }
        }
      `}</style>

      {/* 회원 탈퇴 확인 모달 — 기존 그대로 보존 */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWithdrawModal(false);
              setWithdrawError("");
              setWithdrawPassword("");
            }
          }}
        >
          <div
            className="mx-3 w-full max-w-sm p-6"
            style={{
              backgroundColor: "var(--color-card)",
              borderRadius: 4,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: "var(--danger)" }}
              >
                warning
              </span>
              <h3
                className="text-base sm:text-lg font-bold"
                style={{ color: "var(--ink)" }}
              >
                정말 탈퇴하시겠습니까?
              </h3>
            </div>
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--ink-mute)" }}
            >
              탈퇴하면 모든 활동 기록이 익명화되며 복구할 수 없습니다. 계속하려면
              비밀번호를 입력해주세요.
            </p>

            {withdrawError && (
              <div
                className="mb-3 px-3 py-2 text-sm"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--danger) 10%, transparent)",
                  color: "var(--danger)",
                  borderRadius: 4,
                }}
              >
                {withdrawError}
              </div>
            )}

            <input
              type="password"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              placeholder="현재 비밀번호"
              className="input"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleWithdraw();
              }}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawError("");
                  setWithdrawPassword("");
                }}
                className="btn"
                style={{ flex: 1 }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="btn"
                style={{
                  flex: 1,
                  background: "var(--danger)",
                  color: "#fff",
                  borderColor: "var(--danger)",
                }}
              >
                {withdrawLoading ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Field — 시안 v2(1) 라벨 컴포넌트
 *  - label과 sub(보조 설명)이 한 줄에 baseline 정렬
 *  - full=true 시 grid 전체 너비
 * ============================================================ */
function Field({
  label,
  sub,
  children,
  full,
  style,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
  full?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        gridColumn: full ? "1 / -1" : "auto",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink-dim)",
          }}
        >
          {label}
        </label>
        {sub && (
          <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>{sub}</span>
        )}
      </div>
      {children}
    </div>
  );
}
