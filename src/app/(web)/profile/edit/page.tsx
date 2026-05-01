"use client";

/* ============================================================
 * /profile/edit — BDR-current v2.3 박제 (단일 스크롤 + Hero + 5섹션 Hybrid)
 *
 * 왜 (D-6 v3-rebake — 2026-05-01):
 *  - 시안 v2.3 = 5탭 사이드 + 6 sub-tab 제거 → 단일 스크롤 + Hero + 4섹션 (앵커 네비)
 *  - 운영 진짜 기능 4종 (환불계좌·AI bio·닉네임 중복확인·회원탈퇴) 손실 방지
 *    → "5번째 섹션 추가 설정" 신설 (Hybrid 패턴) — 정보 손실 0
 *  - API/데이터 패칭 절대 변경 금지 (CLAUDE.md 디자인 작업 13 룰)
 *
 * 어떻게:
 *  - Hero: 큰 RDM 아바타 (좌) + 카메라 클릭 = upload-image API 흡수 (옛 photo 탭 흡수)
 *  - §1 기본 정보: 닉네임 + 중복확인 + 실명 + 지역 + 등번호 + 시작연도 + 생년월일 + 자기소개+AI
 *  - §2 플레이 정보: 포지션 5칩 (시안은 단일, 운영은 multi — 운영 multi 보존) + 신장체중 + 사용손 + 실력수준 + 강점
 *  - §3 연락 정보: 이메일 + 휴대폰 + 인스타 + 유튜브 + 소셜 연동 표시
 *  - §4 공개 설정: 7항목 × 3옵션 chip (시안 placeholder — 백엔드 미구현 안내)
 *  - §5 추가 설정 (NEW): 환불 계좌 (BANKS) + Danger Zone 회원 탈퇴
 *  - Sticky save bar 하단 (시안 박제)
 *
 * 보존 (변경 금지):
 *  - GET /api/web/profile (초기 로드)
 *  - PATCH /api/web/profile (저장)
 *  - POST /api/web/profile/upload-image
 *  - DELETE /api/web/profile/delete-image
 *  - GET /api/web/profile/check-nickname
 *  - POST /api/web/profile/generate-bio
 *  - DELETE /api/web/auth/withdraw
 *  - 모든 form/bankForm/regions state + 6 핸들러
 * ============================================================ */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BANKS } from "@/lib/constants/banks";
import { RegionPicker, type Region } from "@/components/shared/region-picker";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";
import "./edit-profile.css";

// 시안 포지션 5종 (PG/SG/SF/PF/C) — 운영은 multi 선택 보존 (DB 호환)
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
  // 2026-05-01: 본인 선호 등번호 + 선출 여부 (대회 출전 시 필수 차단 검증 대상)
  default_jersey_number: number | null;
  is_elite: boolean | null;
  bank_name: string | null;
  bank_code: string | null;
  account_number_masked: string | null;
  account_holder: string | null;
  has_account: boolean;
  // 소셜 로그인 제공자 (kakao, google, apple 등)
  provider: string | null;
  // 프로필 사진 URL (Vercel Blob)
  profile_image_url: string | null;
}

// 소셜 제공자별 표시 정보 매핑 (운영 보존 — 연락 정보 섹션에서 사용)
const SOCIAL_PROVIDERS: Record<string, { label: string; icon: string; color: string }> = {
  kakao: { label: "카카오", icon: "chat_bubble", color: "#FEE500" },
  google: { label: "Google", icon: "mail", color: "#4285F4" },
  apple: { label: "Apple", icon: "phone_iphone", color: "#A2AAAD" },
  naver: { label: "네이버", icon: "language", color: "#03C75A" },
};

// 시안 §4 공개 설정 7항목 × 3옵션 (UI placeholder — 백엔드 미구현)
const PRIVACY_ROWS = [
  { id: "profile", l: "프로필 전체", d: "나의 프로필 페이지 자체" },
  { id: "realName", l: "실명", d: "본명 노출 여부" },
  { id: "contact", l: "연락처", d: "휴대폰 · 이메일" },
  { id: "record", l: "경기 기록", d: "스탯 · 이력" },
  { id: "review", l: "매너 평가", d: "받은 리뷰" },
  { id: "area", l: "활동 지역", d: "프로필 정보" },
  { id: "body", l: "신장 · 체중", d: "프로필 정보" },
] as const;

const PRIVACY_OPTIONS = [
  { v: "all", l: "전체" },
  { v: "friends", l: "친구" },
  { v: "none", l: "비공개" },
] as const;

type PrivacyKey = (typeof PRIVACY_ROWS)[number]["id"];

export default function ProfileEditPage() {
  const router = useRouter();
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
    // 2026-05-01: 본인 선호 등번호 + 선출 여부
    default_jersey_number: "",
    is_elite: false,
  });
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);

  // 닉네임 중복확인 state — PATCH 시점 P2002 회귀 방어 (운영 보존)
  const [nicknameCheck, setNicknameCheck] = useState<{
    status: "idle" | "checking" | "available" | "taken" | "error";
    message: string;
    checkedNickname: string;
  }>({ status: "idle", message: "", checkedNickname: "" });

  // 환불 계좌 state — 운영 보존, §5 추가 설정 섹션에 흡수
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
  // 소셜 계정 연동 표시 (§3 연락 정보 섹션)
  const [provider, setProvider] = useState<string | null>(null);
  // 회원 탈퇴 모달 state (§5 추가 설정 Danger Zone)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  // 프로필 사진 업로드 state — Hero 카메라 버튼으로 흡수
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 시안 §4 공개 설정 state (UI placeholder — 백엔드 미구현, 시안 박제용)
  const [privacy, setPrivacy] = useState<Record<PrivacyKey, string>>({
    profile: "all",
    realName: "none",
    contact: "friends",
    record: "all",
    review: "all",
    area: "all",
    body: "friends",
  });

  // 시안 §2 플레이 정보 — 사용 손, 실력 수준, 강점 (UI placeholder, DB 미저장)
  const [hand, setHand] = useState<"L" | "R" | "B">("R");
  const [level, setLevel] = useState<string>("중급");
  const [strengths, setStrengths] = useState<Set<string>>(new Set());

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
          // 2026-05-01: 본인 선호 등번호 + 선출 여부
          default_jersey_number: u.default_jersey_number?.toString() ?? "",
          is_elite: u.is_elite ?? false,
        });
        // city/district 콤마 구분 → Region[]으로 변환 (운영 보존)
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
        setProfileImageUrl(u.profile_image_url ?? null);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // 포지션 multi 토글 (운영 multi 보존 — DB 컬럼이 콤마 구분)
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

  const toggleStrength = (s: string) => {
    setStrengths((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  // 프로필 사진 업로드 핸들러 (운영 그대로 보존 — Hero 카메라 클릭으로 호출)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    const file = e.target.files?.[0];
    e.target.value = ""; // 동일 파일 재선택 가능하도록 즉시 리셋
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
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "업로드에 실패했습니다.");
      }
      const url = data?.profile_image_url as string | undefined;
      if (url) {
        setProfileImageUrl(url);
      }
      // 헤더 UserDropdown 갱신 — 1.5초 reload (운영 보존)
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setImageUploading(false);
    }
  };

  // 프로필 사진 제거 (운영 보존 — Hero 우클릭/롱프레스 미지원, "사진 제거" 보조 동작)
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
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "제거 중 오류가 발생했습니다.");
    } finally {
      setImageUploading(false);
    }
  };

  // 닉네임 중복확인 (운영 보존 — §1 기본 정보 섹션 안)
  const handleCheckNickname = async () => {
    const trimmed = form.nickname.trim();
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
      if (!res.ok) {
        setNicknameCheck({
          status: "error",
          message: data?.error ?? "확인에 실패했습니다.",
          checkedNickname: trimmed,
        });
        return;
      }
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

  // AI 자기소개 생성 (운영 보존 — §1 기본 정보 자기소개 textarea 옆)
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

  // 저장 (운영 보존 — payload 구성 + PATCH /api/web/profile)
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const filledRegions = regions.filter((r) => r.city);
      const payload: Record<string, unknown> = {
        name: form.name || null,
        nickname: form.nickname || null,
        // 2026-05-01: 잘못된 birth_date 형식이면 null 로 보내 백엔드 400 회피 (errors.md 박제).
        // 백엔드(route.ts) 도 isNaN 가드 있음 — 이중 방어선.
        birth_date:
          form.birth_date && !isNaN(new Date(form.birth_date).getTime())
            ? form.birth_date
            : null,
        phone: form.phone || null,
        city: filledRegions.map((r) => r.city).join(",") || null,
        district: filledRegions.map((r) => r.district).join(",") || null,
        position: form.position || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bio: form.bio || null,
        // 2026-05-01: 본인 선호 등번호 + 선출 여부
        default_jersey_number: form.default_jersey_number
          ? Number(form.default_jersey_number)
          : null,
        is_elite: form.is_elite,
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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // 1.5초 뒤 reload (운영 보존 — 헤더 me 재호출 트리거, errors.md 04-30)
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 회원 탈퇴 (운영 보존 — §5 Danger Zone)
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

  // 휴대폰 자동 포맷 헬퍼 (운영 보존 — 011-, 010-)
  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length > 7) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    if (digits.length > 3) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return digits;
  };

  // Hero 표시용 닉네임 첫 글자 (이미지 없을 때 fallback)
  const heroInitial = (form.nickname?.[0] || form.name?.[0] || "?").toUpperCase();
  // Hero meta 줄 — 포지션 첫 번째만 + 시즌은 없으니 "프로필"
  const heroPosition = selectedPositions[0] || "포지션 미설정";

  return (
    // 시안 v2.3 박제: 단일 스크롤 + Hero + 5섹션 + sticky save bar
    <div className="page edit-profile">
      {/* Phase 12 §G — 모바일 백버튼 */}
      <PageBackButton fallbackHref="/profile" />

      {/* 시안 빵부스러기 */}
      <div className="edit-profile__crumb">
        <Link href="/">홈</Link>
        <span>›</span>
        <Link href="/profile">마이페이지</Link>
        <span>›</span>
        <span className="edit-profile__crumb-current">프로필 편집</span>
      </div>

      {/* 시안 상단: eyebrow + h1 좌측, 저장 액션 우측 */}
      <div className="edit-profile__topbar">
        <div>
          <div className="eyebrow">EDIT PROFILE · 프로필 편집</div>
          <h1 className="edit-profile__title">프로필 편집</h1>
        </div>
        <div className="edit-profile__actions">
          {saved && <span className="edit-profile__saved">✓ 저장됨</span>}
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

      {/* 알림 배너 (운영 보존) */}
      {error && <div className="edit-profile__notice edit-profile__notice--err">{error}</div>}
      {successMsg && !saved && (
        <div className="edit-profile__notice edit-profile__notice--ok">{successMsg}</div>
      )}

      {/* ============================================================
          HERO — 큰 아바타(좌, 카메라 클릭 = upload-image API 흡수) + 우측 정보
          시안 v2.3 핵심 신규 — 옛 photo 탭 흡수
          ============================================================ */}
      <section className="edit-profile__hero">
        <div className="edit-profile__avatar-wrap">
          <div className="edit-profile__avatar" role="img" aria-label="프로필 사진">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="프로필"
                width={180}
                height={180}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                unoptimized
              />
            ) : (
              <span className="edit-profile__avatar-mono">{heroInitial}</span>
            )}
          </div>
          {/* 카메라 버튼 — 시안 박제 (옛 photo 탭의 "새 사진 업로드" 흡수) */}
          <button
            type="button"
            className="edit-profile__camera"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUploading}
            aria-label="프로필 사진 교체"
            title={imageUploading ? "업로드 중..." : "사진 교체"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {imageUploading ? "hourglass_top" : "photo_camera"}
            </span>
          </button>
          {/* 숨김 file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>

        <div className="edit-profile__hero-info">
          <div className="edit-profile__hero-eyebrow">
            <span className="eyebrow-mark" />
            MY PAGE · 마이페이지
          </div>
          <h2 className="edit-profile__hero-title">
            <span className="edit-profile__hero-nick">{form.nickname || "닉네임"}</span>
            <span className="edit-profile__hero-particle">의 농구</span>
          </h2>
          <div className="edit-profile__hero-meta">
            <span>{form.name || "이름 미설정"}</span>
            <span className="dot">·</span>
            <span>{heroPosition}</span>
            {form.height && (
              <>
                <span className="dot">·</span>
                <span className="t-mono">{form.height}cm</span>
              </>
            )}
          </div>
          <div className="edit-profile__hero-badges">
            {/* 시안: Lv / PRO / ✓본인인증 — DB 미지원이라 정적 placeholder (UI 박제).
                2026-05-01 (Phase A-2): ✓본인인증 뱃지 삭제 — PortOne 본인인증 페이지 신설 후
                별도 흐름으로 분리 예정. 본인인증 진입점은 settings/account 섹션에 통합됨. */}
            <span className="badge badge--red">L.1</span>
            {provider && <span className="badge badge--blue">소셜 로그인</span>}
          </div>
          {/* 사진 업로드 인라인 에러 (운영 보존 — alert 신규 0건 룰) */}
          {imageError && <div className="edit-profile__hero-error">{imageError}</div>}
          {/* 사진 제거 (운영 보존 — 이미지 있을 때만) */}
          {profileImageUrl && !imageUploading && (
            <button
              type="button"
              className="btn btn--sm"
              onClick={handleImageDelete}
              style={{ marginTop: 4, alignSelf: "flex-start", color: "var(--danger)" }}
            >
              사진 제거
            </button>
          )}
        </div>
      </section>

      {/* 앵커 네비 (시안 박제 — 5섹션) */}
      <nav className="edit-profile__anchors" aria-label="페이지 내 섹션">
        <a href="#sec-basic">기본 정보</a>
        <a href="#sec-play">플레이 정보</a>
        <a href="#sec-contact">연락 정보</a>
        <a href="#sec-privacy">공개 설정</a>
        <a href="#sec-extra">추가 설정</a>
      </nav>

      {/* ============================================================
          §1 기본 정보 — 닉네임+중복확인 + 실명 + 지역 + 등번호 + 시작연도 + 생년월일 + 자기소개+AI
          ============================================================ */}
      <section id="sec-basic" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>① 기본 정보</h3>
          <p>커뮤니티에 표시되는 핵심 정보. 닉네임은 매칭·랭킹·게시판에 노출됩니다.</p>
        </header>
        <div className="edit-profile__grid edit-profile__grid--2">
          {/* 닉네임 + 중복확인 (운영 보존) */}
          <Field label="닉네임 *" sub="2~20자">
            <div className="edit-profile__inline">
              <input
                className="input"
                value={form.nickname}
                onChange={(e) => {
                  const next = e.target.value;
                  setForm((p) => ({ ...p, nickname: next }));
                  // 입력값이 검증값과 달라지면 결과 무효화
                  if (next.trim() !== nicknameCheck.checkedNickname) {
                    setNicknameCheck({ status: "idle", message: "", checkedNickname: "" });
                  }
                }}
                placeholder="닉네임"
              />
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
            {/* 결과 메시지 — 입력값과 검증값이 일치할 때만 노출 */}
            {nicknameCheck.status !== "idle" &&
              nicknameCheck.status !== "checking" &&
              nicknameCheck.checkedNickname === form.nickname.trim() && (
                <p
                  className={`edit-profile__check-msg ${
                    nicknameCheck.status === "available"
                      ? "edit-profile__check-msg--ok"
                      : nicknameCheck.status === "taken"
                      ? "edit-profile__check-msg--err"
                      : "edit-profile__check-msg--mute"
                  }`}
                  role={
                    nicknameCheck.status === "taken" || nicknameCheck.status === "error"
                      ? "alert"
                      : "status"
                  }
                >
                  {nicknameCheck.status === "available" && "✓ "}
                  {nicknameCheck.status === "taken" && "✕ "}
                  {nicknameCheck.message}
                </p>
              )}
          </Field>

          {/* 실명 — 운영은 입력 허용 (시안은 readonly 박제지만, DB 호환 위해 입력 유지) */}
          <Field label="이름 *" sub="대회 등록 시 확인용">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="홍길동"
            />
          </Field>

          {/* 활동 지역 (운영 보존 — RegionPicker 사이트 컨벤션) */}
          <Field label="활동 지역" sub="주 활동 시·구 (최대 3개)" full>
            <RegionPicker value={regions} onChange={setRegions} max={3} />
          </Field>

          {/* 생년월일 */}
          <Field label="생년월일" sub="비공개 · 나이별 대회 자격용">
            <input
              type="date"
              className="input"
              value={form.birth_date}
              onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
            />
          </Field>

          {/* 휴대폰 (포맷팅 운영 보존) */}
          <Field label="휴대폰" sub="대회·환불 연락용">
            <input
              type="tel"
              inputMode="numeric"
              className="input"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
              placeholder="01012345678"
            />
          </Field>

          {/* 자기소개 + AI (운영 보존) */}
          <Field label="자기소개" sub={`${form.bio.length}/255 · AI 자동 작성 가능`} full>
            <div className="edit-profile__bio-wrap">
              <textarea
                className="input"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="간단한 자기소개 (최대 255자)"
                maxLength={255}
                style={{ resize: "vertical", paddingRight: 110 }}
              />
              <button
                type="button"
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="btn btn--sm edit-profile__bio-ai"
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
      </section>

      {/* ============================================================
          §2 플레이 정보 — 포지션 5칩 + 신장체중 + 사용손/실력/강점 (시안 박제)
          ============================================================ */}
      <section id="sec-play" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>② 플레이 정보</h3>
          <p>매칭·게스트 모집에 노출됩니다. 자체 평가 — 레이팅에 영향 없음.</p>
        </header>

        {/* 2026-05-02: 등번호 / 선출 여부 — 대회 출전 시 필수 (차단 검증). §2 가장 위 + 모바일도 2열 유지 + sub 1번만 */}
        <div className="edit-profile__grid edit-profile__grid--2-row" style={{ marginBottom: 16 }}>
          <Field label="등번호" sub="대회 출전 시 필수">
            <input
              className="input t-mono"
              type="number"
              value={form.default_jersey_number}
              onChange={(e) =>
                setForm((p) => ({ ...p, default_jersey_number: e.target.value }))
              }
              placeholder="23"
              min={0}
              max={999}
            />
          </Field>
          <Field label="선출 여부">
            <div className="edit-profile__chips">
              <button
                type="button"
                className={`chip ${form.is_elite === false ? "chip--active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, is_elite: false }))}
              >
                일반
              </button>
              <button
                type="button"
                className={`chip ${form.is_elite === true ? "chip--active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, is_elite: true }))}
              >
                선출
              </button>
            </div>
          </Field>
        </div>

        {/* 주 포지션 — 시안은 단일이지만 운영 multi 보존 (DB 호환) */}
        <div className="edit-profile__field" style={{ marginBottom: 16 }}>
          <div className="edit-profile__field-head">
            <label>주 포지션 *</label>
            <span className="edit-profile__field-sub">복수 선택 가능 · 매칭 필터링에 사용</span>
          </div>
          <div className="edit-profile__chips">
            {POSITIONS.map((p) => {
              const active = selectedPositions.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  className={`chip ${active ? "chip--active" : ""}`}
                  onClick={() => togglePosition(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* 신장 / 체중 — 2026-05-02: 모바일도 2열 유지 (사용자 결정) */}
        <div className="edit-profile__grid edit-profile__grid--2-row">
          <Field label="신장 (cm)">
            <input
              className="input t-mono"
              type="number"
              value={form.height}
              onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
              placeholder="180"
              min={100}
              max={250}
            />
          </Field>
          <Field label="체중 (kg)" sub="비공개">
            <input
              className="input t-mono"
              type="number"
              value={form.weight}
              onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
              placeholder="75"
              min={30}
              max={200}
            />
          </Field>
        </div>


        {/* 시안 박제 — 사용 손 (UI placeholder, DB 미저장) */}
        <div className="edit-profile__field" style={{ marginTop: 16 }}>
          <div className="edit-profile__field-head">
            <label>주 사용 손</label>
            <span className="edit-profile__field-sub">자체 표시 · 저장 미연동</span>
          </div>
          <div className="edit-profile__chips">
            {[
              { v: "L" as const, l: "왼손" },
              { v: "R" as const, l: "오른손" },
              { v: "B" as const, l: "양손" },
            ].map((h) => (
              <button
                key={h.v}
                type="button"
                className={`chip ${hand === h.v ? "chip--active" : ""}`}
                onClick={() => setHand(h.v)}
              >
                {h.l}
              </button>
            ))}
          </div>
        </div>

        {/* 시안 박제 — 실력 수준 (UI placeholder) */}
        <div className="edit-profile__field" style={{ marginTop: 16 }}>
          <div className="edit-profile__field-head">
            <label>실력 수준 *</label>
            <span className="edit-profile__field-sub">자체 평가 · 레이팅 반영 안 됨</span>
          </div>
          <div className="edit-profile__chips">
            {["초보", "초-중급", "중급", "중-상급", "상급", "선출급"].map((l) => (
              <button
                key={l}
                type="button"
                className={`chip ${level === l ? "chip--active" : ""}`}
                onClick={() => setLevel(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 시안 박제 — 강점 multi (UI placeholder) */}
        <div className="edit-profile__field" style={{ marginTop: 16 }}>
          <div className="edit-profile__field-head">
            <label>강점 (복수 선택)</label>
            <span className="edit-profile__field-sub">게스트 지원 시 호스트에게 보임</span>
          </div>
          <div className="edit-profile__chips">
            {[
              "3점슛",
              "돌파",
              "미드레인지",
              "스크린",
              "리바운드",
              "스틸",
              "패싱",
              "체력",
              "수비",
              "스팟업",
            ].map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${strengths.has(s) ? "chip--active" : ""}`}
                onClick={() => toggleStrength(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          §3 연락 정보 — 이메일/휴대폰 + 인스타/유튜브 (시안 박제) + 소셜 연동 (운영 보존)
          ============================================================ */}
      <section id="sec-contact" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>③ 연락 정보</h3>
          <p>
            공개 여부는 [공개 설정] 섹션에서 조정합니다.
            {" "}계정 보안·알림 ON/OFF는 <Link href="/settings">환경 설정</Link>에서 관리합니다.
          </p>
        </header>
        <div className="edit-profile__grid edit-profile__grid--2">
          {/* 휴대폰 (운영 보존) */}
          <Field label="휴대폰 *" sub="대회·환불 연락용">
            <input
              type="tel"
              inputMode="numeric"
              className="input"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
              placeholder="01012345678"
            />
          </Field>

          {/* 시안 박제 — 인스타그램 (UI placeholder, DB 미저장) */}
          <Field label="인스타그램" sub="@아이디만 (선택)">
            <input className="input" placeholder="@rdm_hoops" disabled readOnly value="" />
          </Field>

          {/* 시안 박제 — 유튜브 (UI placeholder) */}
          <Field label="유튜브" sub="개인 채널 (선택)" full>
            <input className="input" placeholder="https://…" disabled readOnly value="" />
          </Field>
        </div>

        {/* 소셜 연동 표시 (운영 보존 — provider 있을 때만) */}
        {provider && SOCIAL_PROVIDERS[provider] && (
          <div style={{ marginTop: 16 }}>
            <div className="edit-profile__field-head" style={{ marginBottom: 8 }}>
              <label>연동된 소셜 계정</label>
            </div>
            <div className="edit-profile__social">
              <div
                className="edit-profile__social-icon"
                style={{ backgroundColor: SOCIAL_PROVIDERS[provider].color }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#fff", fontSize: 20 }}
                >
                  {SOCIAL_PROVIDERS[provider].icon}
                </span>
              </div>
              <div className="edit-profile__social-info">
                <div className="edit-profile__social-label">
                  {SOCIAL_PROVIDERS[provider].label} 계정 연동됨
                </div>
                <div className="edit-profile__social-desc">
                  소셜 로그인으로 가입한 계정입니다
                </div>
              </div>
              <span className="badge badge--ok">연동됨</span>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================
          §4 공개 설정 — 7항목 × 3옵션 (시안 박제 — UI placeholder, 백엔드 미구현)
          ============================================================ */}
      <section id="sec-privacy" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>④ 공개 설정</h3>
          <p>
            항목별 노출 범위. <strong>전체 공개 / 친구 공개 / 비공개</strong> 3단계.
          </p>
        </header>
        <div className="edit-profile__priv">
          {PRIVACY_ROWS.map((r) => (
            <div key={r.id} className="edit-profile__priv-row">
              <div className="edit-profile__priv-info">
                <div className="edit-profile__priv-label">{r.l}</div>
                <div className="edit-profile__priv-desc">{r.d}</div>
              </div>
              <div className="edit-profile__priv-options">
                {PRIVACY_OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className={`chip ${privacy[r.id] === o.v ? "chip--active" : ""}`}
                    onClick={() => setPrivacy((p) => ({ ...p, [r.id]: o.v }))}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="edit-profile__priv-note">
          ⓘ 세부 공개 범위 저장은 곧 제공됩니다. (현재는 시각 박제)
        </div>
      </section>

      {/* ============================================================
          §5 추가 설정 (Hybrid 신설) — 환불 계좌 + Danger Zone 회원 탈퇴
          ============================================================ */}
      <section id="sec-extra" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>⑤ 추가 설정</h3>
          <p>환불 계좌 등록과 회원 탈퇴를 관리합니다.</p>
        </header>

        {/* 환불 계좌 (운영 보존 — refund 탭 흡수) */}
        <h4
          style={{
            margin: "0 0 4px",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
          }}
        >
          환불 계좌
        </h4>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--ink-mute)" }}>
          참가비·게스트비·픽업비 환불 시 사용됩니다.
        </p>

        {hasExistingAccount && !bankForm.account_consent && (
          <div className="edit-profile__refund-current">
            현재 등록된 계좌: <strong>{maskedAccount}</strong>
            <button
              type="button"
              className="edit-profile__refund-change"
              onClick={() => setBankForm((p) => ({ ...p, account_consent: true }))}
            >
              변경하기
            </button>
          </div>
        )}

        <label className="edit-profile__consent">
          <input
            type="checkbox"
            checked={bankForm.account_consent}
            onChange={(e) =>
              setBankForm((p) => ({ ...p, account_consent: e.target.checked }))
            }
          />
          <span>
            개인정보(계좌번호) 수집·이용에 동의합니다{" "}
            <span className="edit-profile__consent-required">(필수)</span>
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
                  const selected = BANKS.find((b) => b.value === e.target.value);
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
            <Field label="계좌번호" sub="암호화되어 저장됩니다">
              <input
                className="input"
                value={bankForm.account_number}
                onChange={(e) =>
                  setBankForm((p) => ({ ...p, account_number: e.target.value }))
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
                  setBankForm((p) => ({ ...p, account_holder: e.target.value }))
                }
                placeholder="예금주 이름"
                maxLength={20}
              />
            </Field>
          </div>
        )}

        {/* Danger Zone — 회원 탈퇴 (운영 보존) */}
        <div className="edit-profile__danger">
          <h4 className="edit-profile__danger-title">회원 탈퇴</h4>
          <p className="edit-profile__danger-desc">
            탈퇴 시 모든 활동 기록이 익명화되며 복구할 수 없습니다.
          </p>
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="btn btn--sm btn--danger"
          >
            회원 탈퇴
          </button>
        </div>
      </section>

      {/* Sticky save bar (시안 박제) */}
      <div className="edit-profile__sticky">
        <div>변경사항이 있으면 저장을 눌러주세요.</div>
        <div className="edit-profile__actions">
          {saved && <span className="edit-profile__saved">✓ 저장됨</span>}
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

      {/* 회원 탈퇴 확인 모달 (운영 그대로 보존) */}
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
            <p className="mb-4 text-sm" style={{ color: "var(--ink-mute)" }}>
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
 * Field — 시안 v2.3 라벨 컴포넌트 (label + sub baseline 정렬)
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
      className={`edit-profile__field ${full ? "edit-profile__field--full" : ""}`}
      style={style}
    >
      <div className="edit-profile__field-head">
        <label>{label}</label>
        {sub && <span className="edit-profile__field-sub">{sub}</span>}
      </div>
      {children}
    </div>
  );
}
