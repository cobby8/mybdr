"use client";

// Phase 3 TeamCreate v2 — Step2 엠블럼 · 컬러
// 이유:
//  - 시안의 "tag 미리보기 + 컬러 팔레트(10) + 로고 업로더" 구조 재현
//  - 2026-04-29: PM 요청 — 단일 "팀 컬러" → "홈/어웨이 유니폼" 2색으로 분리.
//    홈 컬러는 미리보기 배경으로 사용, 어웨이 컬러는 작은 띠/배지로 표시.
//  - 2026-04-29: 로고 업로드 활성화 (BDR+ 게이트 해제). 단, 실제 storage 업로드는 별도 Phase —
//    이번엔 클라이언트 base64 미리보기 + File state 만 잡아둔다 (서버 저장 X).

import { useRef } from "react";
import { TEAM_COLORS } from "./team-form";

interface Props {
  // Step1 에서 입력한 tag (or fallback) — 미리보기 텍스트
  tag: string;
  // 홈 유니폼 색상 (서버 제출: home_color + 하위호환 primary_color)
  homeColor: string;
  onHomeColorChange: (v: string) => void;
  // 어웨이 유니폼 색상 (서버 제출: away_color + 하위호환 secondary_color)
  awayColor: string;
  onAwayColorChange: (v: string) => void;
  // 로고 파일 (선택) — base64 미리보기는 부모에서 관리
  logoPreview: string | null;
  onLogoFileChange: (file: File | null, preview: string | null) => void;
}

export function StepEmblem({
  tag,
  homeColor,
  onHomeColorChange,
  awayColor,
  onAwayColorChange,
  logoPreview,
  onLogoFileChange,
}: Props) {
  // 파일 input ref — "클릭해서 업로드" 영역에서 트리거
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로고 파일 선택 핸들러
  // 이유: 실제 storage 업로드 로직은 별도 Phase. 지금은 선택 즉시 base64 미리보기만 갱신.
  function handleFile(file: File | null) {
    if (!file) {
      onLogoFileChange(null, null);
      return;
    }
    // 2MB 제한 (시안 기준)
    if (file.size > 2 * 1024 * 1024) {
      alert("이미지 크기는 2MB 이하만 가능합니다.");
      return;
    }
    // 이미지 타입만 허용
    if (!file.type.startsWith("image/")) {
      alert("PNG 또는 JPG 이미지만 업로드 가능합니다.");
      return;
    }
    // base64 미리보기 생성 — 실제 업로드는 차후 storage 연동 시
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      onLogoFileChange(file, result);
    };
    reader.readAsDataURL(file);
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
            {logoPreview ? (
              // 이유: 다음 Phase에서 storage 업로드 시 next/image 로 교체. 지금은 base64 임시 미리보기.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
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
          {/* 홈/어웨이 유니폼 색상 — 모바일 세로 stack, sm(≥640px) 가로 2열 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* 홈 유니폼 색상 */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}>
                홈 유니폼 색상 *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {TEAM_COLORS.map((c) => {
                  const selected = homeColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={`home-${c}`}
                      type="button"
                      onClick={() => onHomeColorChange(c)}
                      aria-label={`홈 유니폼 색상 ${c}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        background: c,
                        borderRadius: 6,
                        border: selected ? "3px solid var(--ink)" : "2px solid var(--border)",
                        cursor: "pointer",
                        boxShadow: selected ? "0 0 0 2px var(--bg), 0 0 0 4px var(--ink)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 어웨이 유니폼 색상 */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}>
                어웨이 유니폼 색상 *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {TEAM_COLORS.map((c) => {
                  const selected = awayColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={`away-${c}`}
                      type="button"
                      onClick={() => onAwayColorChange(c)}
                      aria-label={`어웨이 유니폼 색상 ${c}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        background: c,
                        borderRadius: 6,
                        border: selected ? "3px solid var(--ink)" : "2px solid var(--border)",
                        cursor: "pointer",
                        boxShadow: selected ? "0 0 0 2px var(--bg), 0 0 0 4px var(--ink)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 팀 로고 업로더 — 2026-04-29 활성화 (모든 사용자 가능)
              이유: 시안의 BDR+ 게이트 해제. file input 활성화 + base64 미리보기.
              실제 storage 업로드는 별도 Phase — 지금은 클라 미리보기만 (DB 저장 X) */}
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
          {/* 클릭 가능한 영역 — 내부에서 hidden file input 트리거 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "24px",
              border: "2px dashed var(--border)",
              borderRadius: 8,
              textAlign: "center",
              wordBreak: "keep-all",
              background: "transparent",
              cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.5, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {logoPreview ? "다른 이미지로 교체" : "클릭해서 이미지 업로드"}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>PNG · JPG · 정방형 권장 · 최대 2MB</div>
            {logoPreview && (
              <div style={{ fontSize: 11, color: "var(--color-success, #10B981)", marginTop: 6, fontWeight: 600 }}>
                ✓ 이미지 선택됨 (등록 시 저장은 곧 출시 예정)
              </div>
            )}
          </button>
          {/* 실제 file input — hidden, 위 버튼이 click 으로 트리거 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          {logoPreview && (
            <button
              type="button"
              onClick={() => {
                onLogoFileChange(null, null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="btn btn--sm"
              style={{ marginTop: 8, fontSize: 12 }}
            >
              로고 제거
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
