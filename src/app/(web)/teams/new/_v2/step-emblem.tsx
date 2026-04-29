"use client";

// Phase 3 TeamCreate v2 — Step2 엠블럼 · 컬러
// 이유:
//  - 시안의 "tag 미리보기 + 컬러 팔레트(10) + 로고 업로더" 구조 재현
//  - 2026-04-29: PM 요청 — 단일 "팀 컬러" → "홈/어웨이 유니폼" 2색으로 분리.
//    홈 컬러는 미리보기 배경으로 사용, 어웨이 컬러는 작은 띠/배지로 표시.
//  - 2026-04-29: 로고 업로드 활성화 (BDR+ 게이트 해제).
//  - 2026-04-29 (v2): 실제 Supabase Storage 업로드 연결.
//    파일 선택 즉시 /api/web/upload 호출 → public URL 받아 부모 state(logoUrl)에 저장.
//    base64 미리보기 단계 폐기 (불필요한 메모리/state 낭비). 미리보기는 storage URL 그대로 사용.
//  - 2026-04-29: PM 요청 — preset 10색 grid 제거 → HTML5 native color picker + hex text input 으로 교체.
//    이유: 사용자가 로고에 정확히 매칭되는 임의 hex (예: 브랜드 색) 자유 선택 필요.

import { useRef, useState } from "react";

interface Props {
  // Step1 에서 입력한 tag (or fallback) — 미리보기 텍스트
  tag: string;
  // 홈 유니폼 색상 (서버 제출: home_color + 하위호환 primary_color)
  homeColor: string;
  onHomeColorChange: (v: string) => void;
  // 어웨이 유니폼 색상 (서버 제출: away_color + 하위호환 secondary_color)
  awayColor: string;
  onAwayColorChange: (v: string) => void;
  // 로고 URL (Supabase Storage 업로드 완료된 public URL). 미업로드 시 null.
  logoUrl: string | null;
  onLogoUrlChange: (url: string | null) => void;
}

export function StepEmblem({
  tag,
  homeColor,
  onHomeColorChange,
  awayColor,
  onAwayColorChange,
  logoUrl,
  onLogoUrlChange,
}: Props) {
  // 파일 input ref — "클릭해서 업로드" 영역에서 트리거
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 업로드 진행 상태 — true 인 동안 dropzone 영역 dim + 스피너 텍스트 표시
  // 이유: Supabase 왕복(보통 0.5~3초) 동안 사용자가 다음 스텝으로 넘어가지 못하게 시각 피드백 + 중복 클릭 차단
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 로고 파일 선택 → 즉시 Supabase Storage 업로드
  // 이유: 폼 제출 시 일괄 업로드 vs 즉시 업로드 중 후자 채택.
  //  - 사용자는 미리보기를 곧바로 보고 싶어함
  //  - 폼 제출 시점에 업로드 실패하면 "팀은 만들어졌는데 로고만 안 됨" 같은 부분 실패가 더 까다로움
  //  - 이미 Step2 → Step3/4 진행 중에 백그라운드 업로드 완료 가능 (UX 자연스러움)
  async function handleFile(file: File | null) {
    setErrorMsg(null);
    if (!file) {
      onLogoUrlChange(null);
      return;
    }
    // 5MB 제한 (서버 /api/web/upload 와 동일)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("이미지 크기는 5MB 이하만 가능합니다.");
      return;
    }
    // 이미지 타입만 허용 (서버는 jpeg/png/webp/gif 만 받지만, 클라는 폭넓게 1차 차단만)
    if (!file.type.startsWith("image/")) {
      setErrorMsg("PNG, JPG, WEBP, GIF 이미지만 업로드 가능합니다.");
      return;
    }

    setUploading(true);
    try {
      // FormData 구성 — 서버 라우트가 file/bucket/path 3개 키 수용
      // bucket: team-logos (Supabase 대시보드에 별도 생성 필요 — 운영 셋업 안내)
      // path:   logos/{userId}/  형태가 이상적이지만 server 가 Date.now() 기반 unique name 으로 만들어주므로 prefix 만 logos/
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "team-logos");
      fd.append("path", "logos");

      // /api/web/upload — 인증 가드(getWebSession) 있음, 미로그인 시 401
      const res = await fetch("/api/web/upload", {
        method: "POST",
        body: fd,
      });
      // 응답 구조 (apiSuccess/apiError 기준, snake_case 변환 적용):
      //   - 성공 200: { url: "https://..." }
      //   - 실패 4xx/5xx: { error: "...", code?: "..." }
      const json = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok) {
        setErrorMsg(json?.error ?? "업로드에 실패했습니다.");
        return;
      }
      const url = json?.url;
      if (!url) {
        setErrorMsg("서버 응답에 URL이 없습니다.");
        return;
      }
      onLogoUrlChange(url);
    } catch (err) {
      console.error("[StepEmblem upload]", err);
      setErrorMsg("네트워크 오류로 업로드하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>로고 · 유니폼 컬러</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
        팀 로고와 홈/어웨이 유니폼 색상을 지정해주세요.
      </p>

      {/* 모바일 픽스(2026-04-29):
          기존 인라인 "200px 1fr" 2열 grid 는 366px viewport 에서 우측 컨트롤을
          압축해 컬러 picker 5열을 강제로 1열로 짜부라뜨리고
          엠블럼 라벨/업로드 텍스트가 글자 단위 세로 줄바꿈됨.
          → 모바일 1열 stack (미리보기 위, 컨트롤 아래), sm(≥640px) 부터 200px+1fr 2열 유지 */}
      <div className="grid grid-cols-1 gap-5 items-start sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-7">
        {/* 미리보기 — 큰 정사각형 카드
            로고가 업로드된 경우 이미지를, 없으면 tag 텍스트를 표시 */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 160,
              height: 160,
              margin: "0 auto",
              background: homeColor,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 48,
              letterSpacing: "-0.02em",
              borderRadius: 12,
              boxShadow: "var(--sh-lift)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {logoUrl ? (
              // 이유: Supabase public URL 이라 외부 도메인. next/image 사용하려면 next.config domains 설정 필요해
              // 현재는 <img> 유지 (eslint disable). 추후 Supabase 도메인 화이트리스트 후 next/image 마이그레이션 가능.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="팀 로고 미리보기"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              tag
            )}
            {/* 어웨이 컬러 띠 — 우측 하단에 작게 표시 (홈/어웨이 대비 시각화) */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                width: 22,
                height: 22,
                background: awayColor,
                borderRadius: 6,
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,.25)",
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, fontFamily: "var(--ff-mono)" }}>
            미리보기
          </div>
        </div>

        {/* 우측: 팔레트 + 로고 업로더
            min-w-0: grid item 의 기본 min-width:auto 때문에 내부 textarea/input
            이 부모 폭을 밀어내는 것을 방지 (모바일에서 핵심) */}
        <div className="min-w-0">
          {/* 홈/어웨이 유니폼 색상 — 모바일 세로 stack, sm(≥640px) 가로 2열
              2026-04-29: preset 10색 grid → HTML5 native color picker + hex text input.
              왜 native picker?
                - 외부 라이브러리(react-colorful 등) 추가 없이 모든 브라우저 지원
                - OS 표준 UI라 모바일에서도 친숙
              왜 hex text 동반?
                - 사용자가 로고/브랜드 hex 코드를 직접 붙여넣기 가능
                - 6자리 완성 시에만 적용, blur 시 미완성이면 직전 유효값으로 복원 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* 홈 유니폼 색상 */}
            <div>
              <label
                htmlFor="home-color-picker"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}
              >
                홈 유니폼 색상 *
              </label>
              <div className="flex items-center gap-3">
                {/* native color picker — h-12 w-16 = 48×64px wrapper. padding:0 으로 내부 swatch 가 박스 꽉 채움 */}
                <input
                  id="home-color-picker"
                  type="color"
                  value={homeColor}
                  onChange={(e) => onHomeColorChange(e.target.value)}
                  aria-label="홈 유니폼 색상 선택"
                  className="h-12 w-16 rounded-md cursor-pointer border"
                  style={{
                    padding: 0,
                    borderColor: "var(--ink-mute)",
                  }}
                />
                {/* hex text 입력 — 사용자가 임의 hex 직접 입력/붙여넣기 가능
                    onChange: # + 0~6자리 hex 정규식 통과 시에만 state 반영 (입력 중 단계 허용)
                    onBlur: 6자리 완성 안된 채 포커스 잃으면 BDR Red 기본값으로 복원 (silent rollback 방지) */}
                <input
                  type="text"
                  value={homeColor.toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                      onHomeColorChange(v.toLowerCase());
                    }
                  }}
                  onBlur={(e) => {
                    if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onHomeColorChange("#E31B23");
                    }
                  }}
                  className="flex-1 max-w-[140px] px-3 py-2 rounded border"
                  style={{
                    borderColor: "var(--ink-mute)",
                    fontSize: 16, // iOS 자동 줌 차단 (전역 룰 있어도 명시 안전)
                    fontFamily: "var(--ff-mono)",
                  }}
                  placeholder="#E31B23"
                  maxLength={7}
                  aria-label="홈 유니폼 hex 코드"
                />
              </div>
            </div>

            {/* 어웨이 유니폼 색상 — 홈과 동일 패턴, 기본값만 Navy(#1B3C87) */}
            <div>
              <label
                htmlFor="away-color-picker"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}
              >
                어웨이 유니폼 색상 *
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="away-color-picker"
                  type="color"
                  value={awayColor}
                  onChange={(e) => onAwayColorChange(e.target.value)}
                  aria-label="어웨이 유니폼 색상 선택"
                  className="h-12 w-16 rounded-md cursor-pointer border"
                  style={{
                    padding: 0,
                    borderColor: "var(--ink-mute)",
                  }}
                />
                <input
                  type="text"
                  value={awayColor.toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                      onAwayColorChange(v.toLowerCase());
                    }
                  }}
                  onBlur={(e) => {
                    if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onAwayColorChange("#1B3C87");
                    }
                  }}
                  className="flex-1 max-w-[140px] px-3 py-2 rounded border"
                  style={{
                    borderColor: "var(--ink-mute)",
                    fontSize: 16,
                    fontFamily: "var(--ff-mono)",
                  }}
                  placeholder="#1B3C87"
                  maxLength={7}
                  aria-label="어웨이 유니폼 hex 코드"
                />
              </div>
            </div>
          </div>

          {/* 팀 로고 업로더 — 2026-04-29 활성화 + Supabase Storage 실제 업로드 연결
              이유: 시안의 BDR+ 게이트 해제. 파일 선택 즉시 /api/web/upload POST → public URL 받음.
              dropzone 클릭 비활성: uploading 중에는 중복 클릭 차단 */}
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-dim)",
              display: "block",
              marginBottom: 6,
              wordBreak: "keep-all",
            }}
          >
            팀 로고 이미지 <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(선택)</span>
          </label>
          {/* 클릭 가능한 영역 — 내부에서 hidden file input 트리거.
              uploading 중에는 disabled + opacity 낮춰 시각적 피드백 */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "24px",
              border: "2px dashed var(--border)",
              borderRadius: 8,
              textAlign: "center",
              wordBreak: "keep-all",
              background: "transparent",
              cursor: uploading ? "wait" : "pointer",
              color: "var(--ink)",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.5, marginBottom: 6 }}>
              {uploading ? "⏳" : "📁"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {uploading
                ? "업로드 중…"
                : logoUrl
                ? "다른 이미지로 교체"
                : "클릭해서 이미지 업로드"}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>
              PNG · JPG · WEBP · 정방형 권장 · 최대 5MB
            </div>
            {logoUrl && !uploading && (
              <div style={{ fontSize: 11, color: "var(--color-success, #10B981)", marginTop: 6, fontWeight: 600 }}>
                ✓ 업로드 완료
              </div>
            )}
          </button>
          {/* 에러 메시지 — alert 대신 dropzone 아래 inline 표시 (모바일 친화) */}
          {errorMsg && (
            <div
              role="alert"
              style={{
                marginTop: 8,
                padding: "8px 10px",
                fontSize: 12,
                color: "var(--color-error)",
                background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
                borderRadius: 4,
              }}
            >
              {errorMsg}
            </div>
          )}
          {/* 실제 file input — hidden, 위 버튼이 click 으로 트리거.
              accept 는 서버 허용 MIME 과 동기화 (jpeg/png/webp/gif) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          {logoUrl && (
            <button
              type="button"
              onClick={() => {
                onLogoUrlChange(null);
                setErrorMsg(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="btn btn--sm"
              style={{ marginTop: 8, fontSize: 12 }}
              disabled={uploading}
            >
              로고 제거
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
