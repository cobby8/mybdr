"use client";

/**
 * CommunityWizard — /community/new + /community/[id]/edit 공용 5-step 마법사
 *
 * 이유(왜):
 *   - 시안 CU3(CommunityNew) = 5-step 마법사. CU4(CommunityEdit) = BC5 룰에 따라
 *     "동일 컴포넌트 재사용 (별 컴포넌트 ❌)" — mode="edit" + prefill 만 차이.
 *   - 따라서 new/edit 두 페이지가 본 컴포넌트 1개를 mode prop 만 달리하여 공유한다.
 *
 * 방법(어떻게):
 *   - mode="new"  → createPostAction (title/content/category/images JSON) 그대로 호출
 *   - mode="edit" → updatePostAction (public_id/title/content/category) 그대로 호출
 *     + prefill 로 기존 데이터 채움 + isOwner 가드(시안 lock view)
 *   - 서버 액션 시그니처·hidden input(public_id/images)·데이터 흐름은 0 변경.
 *
 * Auto Chain lock 반영 (A1~A4 / PM 지시):
 *   - STEP1 카테고리: 운영 createPostAction 이 처리하는 6종(notice·news 제외) 만 노출.
 *     (news = 검수+대회연결 미지원 → 작성 목록 제외 = 자동 결재)
 *   - STEP2 유형: 운영 서버 액션 미처리 → 선택 UI disabled "준비 중" (시각만, 서버 미전송)
 *   - STEP3 본문: 실동작. 이미지 URL = new 실동작 / edit prefill 보존(updatePostAction 미처리)
 *   - STEP4 추가 정보: 대회연결·소속팀 cross-domain = A4 mock 0 → 입력 hide.
 *     단 5-step 구조 보존 위해 "추가 정보(준비 중)" 안내 단계로 유지 (PM 지시).
 *   - STEP5 미리보기 + 제출: 실동작 (form submit).
 *
 * 시안 출처: Dev/design/BDR-current/screens/CommunityNew.jsx (CU3) + CommunityEdit.jsx (CU4)
 * 박제 등급: A (UI 1:1 + 서버 액션/데이터 흐름 보존)
 */

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CommunityAsideNav } from "./community-aside-nav";
import { createPostAction, updatePostAction } from "@/app/actions/community";

// ── 카테고리 옵션 — 운영 createPostAction/updatePostAction 가 처리하는 6종 ──
// 시안 COMM_WRITE_CATEGORIES 중 news(검수+대회연결 미지원) 제외 = 작성 6종.
// notice 는 시안에서도 운영진 전용으로 작성 제외.
const CATEGORY_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: "general",     label: "자유게시판", icon: "forum" },
  { value: "recruit",     label: "팀원모집",   icon: "group_add" },
  { value: "review",      label: "대회후기",   icon: "rate_review" },
  { value: "qna",         label: "질문답변",   icon: "help" },
  { value: "info",        label: "정보공유",   icon: "lightbulb" },
  { value: "marketplace", label: "농구장터",   icon: "storefront" },
];

// ── 유형 정의 — 시안 COMM_TYPES (서버 미처리 → 선택 UI disabled) ──
const TYPE_OPTIONS: { value: string; label: string; icon: string; desc: string }[] = [
  { value: "text",  label: "텍스트",  icon: "subject",     desc: "글 위주 게시물" },
  { value: "image", label: "이미지",  icon: "image",       desc: "사진 갤러리 첨부" },
  { value: "video", label: "영상",    icon: "play_circle", desc: "영상 링크 임베드" },
];

// ── 5-step 정의 — 시안 CW_STEPS 그대로 ──
const STEPS = [
  { id: 1, lbl: "카테고리", ico: "category" },
  { id: 2, lbl: "유형",     ico: "tune" },
  { id: 3, lbl: "본문",     ico: "edit" },
  { id: 4, lbl: "추가 정보", ico: "sell" },
  { id: 5, lbl: "미리보기",  ico: "visibility" },
];

// 본문 글자수 제한 (시안 표시용 — 실 검증은 서버 액션)
const BODY_MAX = 20000;

function categoryLabel(value: string): string {
  return CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export interface CommunityWizardProps {
  // "new" = 신규 작성 / "edit" = 본인 글 수정
  mode: "new" | "edit";
  // edit 모드일 때 식별자 (hidden public_id 로 전송)
  publicId?: string;
  // edit 모드 prefill (없으면 기본값)
  prefill?: {
    title: string;
    content: string;
    category: string;
    images: string[];
  };
}

export function CommunityWizard({ mode, publicId, prefill }: CommunityWizardProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  // 서버 액션 — mode 에 따라 분기 (시그니처 0 변경)
  const action = isEdit ? updatePostAction : createPostAction;
  const [state, formAction, pending] = useActionState(action, null);

  // ── 마법사 단계 상태 ──
  const [step, setStep] = useState(1);

  // ── 폼 입력 상태 (prefill 보존) ──
  const [category, setCategory] = useState(prefill?.category ?? "general");
  // type 은 서버 미전송 — 시각 표현용 로컬 상태만 유지 (기본 text)
  const [type, setType] = useState("text");
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [content, setContent] = useState(prefill?.content ?? "");

  // 이미지 URL 목록 — new=실동작 / edit=prefill 보존(서버 미반영)
  const [imageUrls, setImageUrls] = useState<string[]>(prefill?.images ?? []);
  const [imageInput, setImageInput] = useState("");

  // 이미지 URL 추가 (URL 검증 — new/page 기존 로직 그대로)
  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (imageUrls.length >= 5) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return;
    setImageUrls((prev) => [...prev, url]);
    setImageInput("");
  };
  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const cur = STEPS.find((s) => s.id === step)!;

  return (
    // 시안 .page > .with-aside — 커뮤니티 전 페이지 동일 레이아웃
    <div className="page">
      <div className="with-aside">
        {/* 좌측 사이드바: 작성/수정 페이지엔 활성 카테고리 개념 없음 → null */}
        <CommunityAsideNav activeCategory={null} />

        <main>
          {/* ── 헤더: eyebrow + H1 + 안내 ── (시안 ou3-head) */}
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              {isEdit ? "EDIT · COMMUNITY" : "NEW · COMMUNITY"}
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              {isEdit ? "게시글 수정" : "글쓰기"}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-mute)" }}>
              {isEdit
                ? "기존 내용이 채워져 있습니다. 단계별로 확인하고 수정하세요."
                : "5단계로 카테고리 · 유형 · 본문 · 추가 정보를 입력하고 게시합니다."}
            </p>
          </div>

          {/* ── step indicator ── (시안 ou3-steps) */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 16,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 4,
            }}
          >
            {STEPS.map((s) => {
              const active = s.id === step;
              const done = s.id < step;
              return (
                <div
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: "0 0 auto",
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: active ? "var(--bdr-red)" : done ? "var(--bg-alt)" : "transparent",
                    color: active ? "#fff" : done ? "var(--ink)" : "var(--ink-dim)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      background: active ? "rgba(255,255,255,0.25)" : "var(--border)",
                      color: active ? "#fff" : "var(--ink-mute)",
                    }}
                  >
                    {done ? "✓" : s.id}
                  </span>
                  {s.lbl}
                </div>
              );
            })}
          </div>

          {/* ── 본문 카드 ── (시안 ou3-card) */}
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--bdr-red)" }}>{cur.ico}</span>
              STEP {step} · {cur.lbl}
            </h2>

            {/* 서버 액션 에러 (기존 동작 그대로) */}
            {state?.error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-chip, 6px)",
                  background: "rgba(227,27,35,0.08)",
                  color: "var(--bdr-red)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {state.error}
              </div>
            )}

            {/*
              form: STEP1~5 모든 입력을 감싼다. submit 은 STEP5 에서만.
              hidden input 으로 실제 서버 전송 값 동기화 (멀티스텝이라도 한 번에 전송).
              - public_id (edit) : updatePostAction 식별
              - category / title / content : 실 전송
              - images JSON : new 실동작 / edit 도 전송하지만 updatePostAction 이 미처리(무해)
            */}
            <form action={formAction}>
              {/* hidden — 어느 단계에서 제출하든 현재 입력값을 서버로 (변경 0 보존) */}
              {isEdit && <input type="hidden" name="public_id" value={publicId ?? ""} />}
              <input type="hidden" name="category" value={category} />
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="content" value={content} />
              <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />

              {/* ── STEP 1 — 카테고리 ── */}
              {step === 1 && (
                <>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-mute)" }}>
                    어떤 게시판에 글을 올릴지 선택합니다. 공지사항은 운영진 전용입니다.
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {CATEGORY_OPTIONS.map((c) => {
                      const on = category === c.value;
                      return (
                        <div
                          key={c.value}
                          onClick={() => setCategory(c.value)}
                          style={{
                            padding: "16px 12px",
                            borderRadius: 6,
                            border: `1px solid ${on ? "var(--bdr-red)" : "var(--border)"}`,
                            background: on ? "rgba(227,27,35,0.06)" : "var(--bg-alt)",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 26, color: on ? "var(--bdr-red)" : "var(--ink-dim)" }}
                          >
                            {c.icon}
                          </span>
                          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: on ? "var(--ink)" : "var(--ink-mute)" }}>
                            {c.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── STEP 2 — 유형 (서버 미처리 → disabled "준비 중") ── */}
              {step === 2 && (
                <>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-mute)" }}>
                    글의 형식을 선택합니다. 유형별 첨부 방식은 준비 중입니다.
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                      gap: 10,
                    }}
                    title="유형 선택 준비 중"
                  >
                    {TYPE_OPTIONS.map((t) => {
                      const on = type === t.value;
                      return (
                        <div
                          key={t.value}
                          // 서버 미전송 — 시각 표현만. 클릭 가능하나 disabled 톤 유지
                          onClick={() => setType(t.value)}
                          style={{
                            padding: "16px 14px",
                            borderRadius: 6,
                            border: `1px solid ${on ? "var(--bdr-red)" : "var(--border)"}`,
                            background: "var(--bg-alt)",
                            cursor: "pointer",
                            opacity: 0.7,
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 24, color: on ? "var(--bdr-red)" : "var(--ink-dim)" }}
                          >
                            {t.icon}
                          </span>
                          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                          <div style={{ marginTop: 2, fontSize: 11, color: "var(--ink-dim)" }}>{t.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* 준비 중 안내 — 서버 미반영임을 명시 */}
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 12px",
                      background: "var(--bg-alt)",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "var(--ink-mute)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--ink-dim)" }}>info</span>
                    <span>유형별 본문 첨부 방식은 준비 중입니다. 현재는 텍스트 + 이미지 URL 첨부로 작성됩니다.</span>
                  </div>
                </>
              )}

              {/* ── STEP 3 — 본문 (제목 + 내용 + 이미지 URL) ── */}
              {step === 3 && (
                <>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-mute)" }}>
                    제목과 내용을 입력합니다. 이미지는 URL 로 첨부합니다.
                  </p>

                  {/* 제목 */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="label" htmlFor="cw-title">제목</label>
                    <input
                      id="cw-title"
                      type="text"
                      className="input"
                      placeholder="제목"
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* 내용 */}
                  <div style={{ marginBottom: 6 }}>
                    <label className="label" htmlFor="cw-content">내용</label>
                    <textarea
                      id="cw-content"
                      className="textarea"
                      placeholder="내용을 입력하세요"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      style={{ minHeight: 240, fontFamily: "var(--ff-body)", lineHeight: 1.7 }}
                    />
                    <div style={{ textAlign: "right", marginTop: 4, fontSize: 12, color: "var(--ink-dim)" }}>
                      {content.length.toLocaleString()} / {BODY_MAX.toLocaleString()}자
                    </div>
                  </div>

                  {/* 이미지 URL 첨부 — new 실동작 / edit prefill 보존 */}
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      이미지 첨부
                      <span style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 500 }}>URL · 최대 5장</span>
                    </label>

                    {imageUrls.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 8 }}>
                        {imageUrls.map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            style={{
                              position: "relative",
                              width: 80,
                              height: 80,
                              overflow: "hidden",
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                            }}
                          >
                            <Image src={url} alt={`첨부 ${i + 1}`} fill sizes="80px" unoptimized style={{ objectFit: "cover" }} />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              style={{
                                position: "absolute",
                                right: 2,
                                top: 2,
                                width: 20,
                                height: 20,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "50%",
                                border: 0,
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                              title="삭제"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {imageUrls.length < 5 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input
                          type="url"
                          value={imageInput}
                          onChange={(e) => setImageInput(e.target.value)}
                          onKeyDown={(e) => {
                            // 한글 IME composition 중 Enter 차단 (new/page 기존 동작 보존)
                            if (e.nativeEvent.isComposing) return;
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addImage();
                            }
                          }}
                          className="input"
                          placeholder="https://example.com/image.jpg"
                          style={{ flex: 1, minWidth: 0 }}
                        />
                        <button
                          type="button"
                          onClick={addImage}
                          className="btn btn--primary"
                          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_photo_alternate</span>
                          추가
                        </button>
                      </div>
                    )}
                    <p style={{ marginTop: 6, fontSize: 12, color: "var(--ink-dim)" }}>
                      {imageUrls.length}/5장 — 이미지 호스팅 URL을 입력하세요
                      {isEdit && " (수정 저장에는 미반영 — 준비 중)"}
                    </p>
                  </div>
                </>
              )}

              {/* ── STEP 4 — 추가 정보 (cross-domain hide → 준비 중 안내 / 5-step 구조 보존) ── */}
              {step === 4 && (
                <>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-mute)" }}>
                    대회 연결 · 소속 팀 등 추가 정보입니다.
                  </p>
                  {/* A4 lock: cross-domain mock 0 — 대회/팀 선택 입력 hide.
                      5-step 구조 보존 위해 안내 카드로 단계 유지 (PM 지시) */}
                  <div
                    style={{
                      padding: "28px 20px",
                      borderRadius: 6,
                      border: "1px dashed var(--border)",
                      background: "var(--bg-alt)",
                      textAlign: "center",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--ink-dim)" }}>sell</span>
                    <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>추가 정보 — 준비 중</div>
                    <p style={{ margin: "8px auto 0", maxWidth: 380, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.6 }}>
                      대회 연결 · 소속 팀 지정 기능은 준비 중입니다.
                      <br />
                      지금은 본문만으로 바로 게시할 수 있어요.
                    </p>
                  </div>
                </>
              )}

              {/* ── STEP 5 — 미리보기 + 제출 ── */}
              {step === 5 && (
                <>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-mute)" }}>
                    게시 전 최종 확인합니다. {isEdit ? "수정 후에도 다시 수정할 수 있습니다." : "게시 후에도 수정할 수 있습니다."}
                  </p>

                  {/* 미리보기 카드 */}
                  <div style={{ padding: 16, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-alt)" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "var(--bdr-red)",
                        color: "#fff",
                      }}
                    >
                      {categoryLabel(category)}
                    </span>
                    <h3 style={{ margin: "10px 0 0", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
                      {title || "(제목 미입력)"}
                    </h3>
                    {imageUrls.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mute)", display: "flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>image</span>
                        {imageUrls.length}장 첨부
                      </div>
                    )}
                    <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink)", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {content || "(내용 미입력)"}
                    </p>
                  </div>

                  {/* 요약 리뷰 */}
                  <div style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--ink-mute)" }}>카테고리</span>
                      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{categoryLabel(category)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: 13 }}>
                      <span style={{ color: "var(--ink-mute)" }}>첨부 이미지</span>
                      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{imageUrls.length}장</span>
                    </div>
                  </div>
                </>
              )}

              {/* ── footer nav: 이전 / 단계표시 / 다음·제출 ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  flexWrap: "wrap",
                }}
              >
                {/* 이전: STEP1 에서 비활성, 나머지는 step-1 */}
                <button
                  type="button"
                  className="btn"
                  onClick={() => (step === 1 ? router.back() : setStep((s) => Math.max(1, s - 1)))}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "-3px" }}>arrow_back</span>
                  {step === 1 ? "취소" : "이전"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--ff-mono, monospace)", fontSize: 11, color: "var(--ink-mute)", fontWeight: 700 }}>
                    {step}/5 단계
                  </span>
                  {step < 5 && (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => setStep((s) => Math.min(5, s + 1))}
                    >
                      다음
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "-3px" }}>arrow_forward</span>
                    </button>
                  )}
                  {/* STEP5 에서만 실제 submit — createPostAction / updatePostAction 호출 */}
                  {step === 5 && (
                    <button type="submit" className="btn btn--primary" disabled={pending}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "-3px" }}>
                        {isEdit ? "check" : "send"}
                      </span>
                      {pending ? (isEdit ? "수정 중..." : "게시 중...") : isEdit ? "수정 완료" : "게시하기"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
