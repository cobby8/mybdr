"use client";

/**
 * PostEdit — /community/[id]/edit (BDR v2.2 D등급 P0-1 박제)
 *
 * Why: 본인 게시글 수정 (제목 / 본문 / 카테고리 / 첨부 사진 prefill)
 * Pattern: PostWrite.jsx 와 동일 + 기존 데이터 prefill + "취소"·"수정 완료"
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/PostEdit.jsx
 * 박제 등급: A (시안 1:1 + 데이터 fetching/서버액션 보존)
 *
 * 진입: /community/[id] 본인 글 점-3개 dropdown "수정" (post-actions.tsx)
 * 복귀: 저장 → /community/[id] (updatePostAction 의 redirect)
 *       취소 → router.back()
 * 에러: 권한 없음 (작성자 != 본인) → noPermission view + 상세/목록 복귀 버튼
 *
 * ── 회귀 검수 매트릭스 (P0-1 §검수) ─────────────────────────────────────
 *   기능              | v1 옛 페이지 | v2.2 시안           | 진입점     | 모바일
 *   본문 수정         | ✅          | ✅ textarea prefill  | dropdown | 1열
 *   사진 추가/삭제    | ❌          | ✅ 첨부 리스트 UI    | dropdown | 가로 hscroll
 *   비밀글 토글       | ❌          | ✅ checkbox          | dropdown | OK
 *   권한 체크         | (서버액션)  | ✅ noPermission view | -         | OK
 * ──────────────────────────────────────────────────────────────────
 *
 * 보존 사항 (사이트 측 — 0 변경):
 *   - useActionState(updatePostAction, null) — 시그니처 그대로
 *   - useEffect 로 /api/web/community/${id} fetch → post 초기값 채우기
 *   - hidden input name="public_id" — updatePostAction 가 formData.get("public_id") 로 사용
 *   - updatePostAction redirect → /community/[id] (저장 복귀 자동)
 *   - 사이트 사이드바 컴포넌트(CommunityAsideNav) 그대로 유지 (시안의 dummy Sidebar 대체)
 *
 * 시안 신규 추가 (UI만 — 서버 미연동):
 *   - breadcrumb: 홈 › 게시판 › 글 › 수정
 *   - eyebrow "EDIT · COMMUNITY" + H1 "게시글 수정"
 *   - 첨부 사진 prefill (post-detail 의 images 가 있으면 표시 + 삭제/+ 추가 버튼은 disabled)
 *   - 댓글 허용 / 비밀글 체크박스 (disabled — 백엔드 미구현, 시안도 dummy)
 *   - 수정 이력 안내(history 아이콘 + "수정됨" 표시 안내)
 *   - 권한 없음 view (lock 아이콘 + 상세/목록 복귀)
 */

import { useActionState, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CommunityAsideNav } from "../../_components/community-aside-nav";
import { updatePostAction } from "@/app/actions/community";

// 카테고리 옵션 — /community/new (PostWrite 박제) 와 동일한 6개 (notice 제외)
// 시안 BOARDS.filter(b => b.id !== 'notice') 와 동일 의도
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "general",     label: "자유게시판" },
  { value: "recruit",     label: "팀원모집" },
  { value: "review",      label: "대회후기" },
  { value: "marketplace", label: "농구장터" },
  { value: "qna",         label: "질문답변" },
  { value: "info",        label: "정보공유" },
];

// 카테고리 value → 라벨 (breadcrumb 에서 사용)
function categoryLabel(value: string): string {
  return CATEGORY_OPTIONS.find((opt) => opt.value === value)?.label ?? "게시판";
}

// 본문 글자수 제한 (시안 표시용 — PostWrite 와 동일)
const BODY_MAX = 20000;

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // 서버 액션 상태 (변경 0 — 기존 시그니처 그대로)
  const [state, formAction, pending] = useActionState(updatePostAction, null);

  // 기존 게시글 데이터를 로딩하여 폼에 채워넣기 (기존 로직 그대로 보존)
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<{
    title: string;
    content: string;
    category: string;
    user_id: string;
    images: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 본문 글자수 카운터 — 시안 표시용 (post 로드 시 초기화)
  const [bodyLen, setBodyLen] = useState(0);

  // 권한 체크용: 현재 로그인 유저 ID (없으면 null = 비로그인)
  const [meId, setMeId] = useState<string | null>(null);

  // 첨부 사진 prefill 로컬 상태 (UI만 — submit 시 서버에 전달 X)
  const [attachments, setAttachments] = useState<string[]>([]);

  // 자동저장 라벨 (시안 dummy — 본문 변경 시 "수정 중" 표시만)
  const [savedAt, setSavedAt] = useState<string>("방금");

  useEffect(() => {
    // 서버에서 게시글 데이터를 가져옴 (public_id 기반) — 기존 로직 0 변경
    // /api/web/me 도 병렬 호출하여 권한 체크에 사용
    async function fetchAll() {
      try {
        const [postRes, meRes] = await Promise.all([
          fetch(`/api/web/community/${params.id}`),
          fetch(`/api/web/me`),
        ]);

        if (!postRes.ok) {
          setError("게시글을 불러올 수 없습니다.");
          return;
        }
        const postJson = await postRes.json();
        const data = postJson.data ?? postJson;

        // /api/web/community/[id] 가 user_id 를 반환함 (route.ts:43)
        // images 필드는 현재 라우트가 select 하지 않으므로 빈 배열 (UI prefill 미동작이지만 시안 구조는 유지)
        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          category: data.category ?? "general",
          user_id: String(data.user_id ?? ""),
          images: Array.isArray(data.images) ? data.images : [],
        });
        setAttachments(Array.isArray(data.images) ? data.images : []);
        // 글자수 카운터 초기값을 기존 본문 길이로 세팅
        setBodyLen((data.content ?? "").length);

        // 로그인 유저 ID 저장 (비로그인이면 401 → null 유지)
        if (meRes.ok) {
          const meJson = await meRes.json();
          const meData = meJson.data ?? meJson;
          setMeId(meData?.id ? String(meData.id) : null);
        }
      } catch {
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [params.id]);

  // 로딩 중: with-aside 레이아웃 안에 메시지 (시안 톤 유지)
  if (loading) {
    return (
      <div className="page">
        <div className="with-aside">
          <CommunityAsideNav activeCategory={null} />
          <main>
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink-dim)" }}>
                불러오는 중...
              </span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 에러 또는 데이터 없음: with-aside 레이아웃 안에 메시지
  if (error || !post) {
    return (
      <div className="page">
        <div className="with-aside">
          <CommunityAsideNav activeCategory={null} />
          <main>
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--bdr-red)",
                  fontWeight: 600,
                }}
              >
                {error ?? "게시글을 찾을 수 없습니다."}
              </span>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn"
              >
                뒤로 가기
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 권한 체크: 본인이 작성자가 아니면 noPermission view (시안 §7-5 표준)
  // meId 가 null 이면 비로그인 — 같은 view로 안내 (서버 액션 단계에서도 한 번 더 막힘)
  const isOwner = meId !== null && meId === post.user_id;
  if (!isOwner) {
    return (
      <div className="page">
        <div className="with-aside">
          <CommunityAsideNav activeCategory={null} />
          <main>
            <div
              className="card"
              style={{
                padding: "48px 28px",
                textAlign: "center",
                maxWidth: 520,
                margin: "40px auto",
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  marginBottom: 14,
                  color: "var(--ink-dim)",
                }}
              >
                {/* lock 아이콘 — 시안 fontSize:56 */}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 56 }}
                >
                  lock
                </span>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>
                수정 권한이 없습니다
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--ink-mute)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                본인이 작성한 글만 수정할 수 있어요.
                <br />
                다른 사용자가 작성한 글은 신고/차단 기능을 이용해 주세요.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn"
                  type="button"
                  onClick={() => router.push(`/community/${params.id}`)}
                >
                  상세로 돌아가기
                </button>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => router.push("/community")}
                >
                  목록으로
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 정상: 본인 게시글 수정 폼 (시안 1:1 박제)
  return (
    <div className="page">
      <div className="with-aside">
        {/* 좌측: 동일한 사이드바 재사용. 글 수정 페이지엔 활성 카테고리 개념 없음 → null */}
        <CommunityAsideNav activeCategory={null} />

        <main>
          {/* breadcrumb — 시안 L67~76 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--ink-mute)",
              marginBottom: 10,
              whiteSpace: "nowrap",
              flexWrap: "wrap",
            }}
          >
            <a
              onClick={() => router.push("/")}
              style={{ cursor: "pointer" }}
            >
              홈
            </a>
            <span>›</span>
            <a
              onClick={() =>
                router.push(`/community?category=${post.category}`)
              }
              style={{ cursor: "pointer" }}
            >
              {categoryLabel(post.category)}
            </a>
            <span>›</span>
            <a
              onClick={() => router.push(`/community/${params.id}`)}
              style={{ cursor: "pointer" }}
            >
              {post.title || "글"}
            </a>
            <span>›</span>
            <span style={{ color: "var(--ink)" }}>수정</span>
          </div>

          {/* 페이지 헤더 — 시안 L78~84: eyebrow + H1 + 자동저장 라벨 */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                EDIT · COMMUNITY
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                게시글 수정
              </h1>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-dim)",
                whiteSpace: "nowrap",
              }}
            >
              자동저장 · {savedAt}
            </div>
          </div>

          {/* 본문 카드 — 시안 .card padding:20 */}
          <div className="card" style={{ padding: 20 }}>
            {/* 서버 액션 에러 표시 (기존 동작 그대로) */}
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

            {/* form action / hidden public_id / pending 모두 기존 그대로 (변경 0) */}
            <form action={formAction}>
              {/* hidden 필드: 어떤 게시글을 수정하는지 식별 — updatePostAction 가 사용 */}
              <input type="hidden" name="public_id" value={params.id} />

              {/* 게시판 선택 + 제목 — 시안 L87~100 160px / 1fr 그리드 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label className="label" htmlFor="post-category">
                    게시판 선택
                  </label>
                  <select
                    id="post-category"
                    name="category"
                    className="select"
                    defaultValue={post.category}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="post-title">
                    제목
                  </label>
                  <input
                    id="post-title"
                    name="title"
                    type="text"
                    required
                    className="input"
                    placeholder="제목을 입력하세요 (최대 80자)"
                    maxLength={80}
                    defaultValue={post.title}
                  />
                </div>
              </div>

              {/* Toolbar — 시안 L102~116: B/I/U/S, H1/H2, 인용/목록, 사진/링크/영상, 미리보기 모두 disabled
                     모바일 폴리시: nowrap + overflowX:auto 로 1줄 가로 스크롤 */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderBottom: 0,
                  borderRadius:
                    "var(--radius-chip) var(--radius-chip) 0 0",
                  background: "var(--bg-alt)",
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
                title="에디터 툴바 준비 중"
              >
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ fontWeight: 800, minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>B</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ fontStyle: "italic", minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>I</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ textDecoration: "underline", minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>U</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ textDecoration: "line-through", minWidth: 32, opacity: 0.5, cursor: "not-allowed" }}>S</button>

                <div style={{ width: 1, background: "var(--border)", margin: "4px 4px" }} />

                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>H1</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>H2</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>인용</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>목록</button>

                <div style={{ width: 1, background: "var(--border)", margin: "4px 4px" }} />

                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>image</span>
                  사진
                </button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>링크</button>
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed" }}>영상</button>

                <span style={{ flex: 1, minWidth: 8 }} />
                <button type="button" className="btn btn--sm" disabled title="준비 중" style={{ opacity: 0.5, cursor: "not-allowed", flexShrink: 0 }}>미리보기</button>
              </div>

              {/* 본문 textarea — 시안 L117: 툴바와 시각적으로 연결 (상단 radius 0) */}
              <textarea
                name="content"
                required
                className="textarea"
                placeholder="내용을 입력하세요"
                defaultValue={post.content}
                onChange={(e) => {
                  setBodyLen(e.target.value.length);
                  setSavedAt("수정 중");
                }}
                style={{
                  minHeight: 340,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  fontFamily: "var(--ff-body)",
                  lineHeight: 1.7,
                }}
              />

              {/* 첨부 사진 prefill — 시안 L120~141
                     UI만: post.images 가 비어있으면 섹션 숨김
                     서버 미연동 (updatePostAction 이 images 미처리) — 삭제/+ 추가는 로컬 state 만 변경, submit 시 반영 X */}
              {attachments.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="label" style={{ marginBottom: 8 }}>
                    첨부된 사진 ({attachments.length}장)
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      overflowX: "auto",
                      paddingBottom: 4,
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {attachments.map((src, i) => (
                      <div
                        key={`${src}-${i}`}
                        style={{ position: "relative", flex: "0 0 auto" }}
                      >
                        <div
                          style={{
                            width: 96,
                            height: 96,
                            background: "var(--bg-alt)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            display: "grid",
                            placeItems: "center",
                            color: "var(--ink-dim)",
                            fontSize: 11,
                            overflow: "hidden",
                          }}
                        >
                          {/* 시안과 동일하게 placeholder 텍스트 — 실제 이미지 렌더링은 추후 P1 */}
                          사진 {i + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments(
                              attachments.filter((_, j) => j !== i)
                            )
                          }
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "var(--bdr-red)",
                            color: "#fff",
                            border: "none",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                            fontSize: 14,
                            lineHeight: 1,
                          }}
                          aria-label="사진 삭제"
                          title="삭제 (저장에는 미반영 — 준비 중)"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {/* + 추가 버튼 — 시안 그대로 노출하되 서버 미구현이라 disabled */}
                    <button
                      type="button"
                      className="btn"
                      disabled
                      title="사진 추가 준비 중"
                      style={{
                        flex: "0 0 auto",
                        width: 96,
                        height: 96,
                        fontSize: 11,
                        color: "var(--ink-mute)",
                        opacity: 0.55,
                        cursor: "not-allowed",
                      }}
                    >
                      + 추가
                    </button>
                  </div>
                </div>
              )}

              {/* 옵션 체크박스 — 시안 L143~152: 댓글 허용 / 비밀글 + 글자수 카운터
                     댓글/비밀글 모두 백엔드 미구현 → disabled (시안도 dummy state) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 14,
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "not-allowed",
                    opacity: 0.55,
                  }}
                  title="댓글 허용 옵션 준비 중"
                >
                  <input type="checkbox" disabled defaultChecked /> 댓글 허용
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "not-allowed",
                    opacity: 0.55,
                  }}
                  title="비밀글 옵션 준비 중"
                >
                  <input type="checkbox" disabled /> 비밀글
                </label>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12 }}>
                  {bodyLen.toLocaleString()} / {BODY_MAX.toLocaleString()}자
                </span>
              </div>

              {/* 수정 이력 안내 — 시안 L154~158: history 아이콘 + "수정됨" 표시 안내 */}
              <div
                style={{
                  marginTop: 14,
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
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: "var(--ink-dim)" }}
                >
                  history
                </span>
                <span>
                  수정된 글은 상세 페이지에{" "}
                  <b style={{ color: "var(--ink)" }}>&quot;수정됨&quot;</b>{" "}
                  표시가 붙습니다. 원본은 복원할 수 없어요.
                </span>
              </div>

              {/* 액션 버튼 — 시안 L160~164: 취소 / 임시저장(disabled) / 수정 완료 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  flexWrap: "wrap",
                }}
              >
                {/* 취소: 이전 페이지로 (보통 상세 페이지에서 들어옴) */}
                <button
                  type="button"
                  className="btn"
                  onClick={() => router.back()}
                >
                  취소
                </button>
                {/* 임시저장: 버튼은 노출하되 disabled "준비 중" */}
                <button
                  type="button"
                  className="btn"
                  disabled
                  title="임시저장 준비 중"
                  style={{ opacity: 0.55, cursor: "not-allowed" }}
                >
                  임시저장
                </button>
                {/* 수정 완료: 기존 submit 버튼 — pending 시 라벨 변경
                       updatePostAction 가 redirect(`/community/${publicId}`) 로 자동 복귀 */}
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={pending}
                >
                  {pending ? "수정 중..." : "수정 완료"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
