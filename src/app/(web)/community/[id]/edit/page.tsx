"use client";

/**
 * EditPostPage — BDR v2 PostWrite 시안 적용 (Phase 9 D등급 박제)
 *
 * 이유: phase-9-paste-completeness D등급 P1.
 *       /community/new 가 PostWrite.jsx 시안으로 박제 완료되어 있어, edit 도 동일 톤으로 통일.
 *       form action / useActionState / updatePostAction / hidden public_id / 기존 글 fetch 로직은
 *       전부 0 변경(서버 액션·데이터 흐름 보존). UI만 v2 with-aside 2열 + 카드 폼으로 교체.
 *
 * 보존 사항:
 *   - useActionState(updatePostAction, null) — 시그니처 그대로
 *   - useEffect 로 /api/web/community/${id} fetch → post 초기값 채우기 (기존 그대로)
 *   - hidden input name="public_id" — updatePostAction 가 formData.get("public_id") 로 사용
 *   - loading / error 분기 그대로
 *
 * 변경 사항 (PostWrite 패턴 차용):
 *   - 단독 Card → `.page > .with-aside` (좌 CommunityAsideNav + 우 main)
 *   - 카테고리 select: 4개 → 7개 (notice 제외 6개, new 와 동일)
 *   - 입력 컴포넌트: 커스텀 클래스 → v2 글로벌 클래스(.label/.select/.input/.textarea)
 *   - 툴바: B/I/U/S, H1/H2, 인용/목록, 사진/링크/영상, 미리보기 모두 disabled
 *   - 옵션 체크박스 3개(댓글허용/비밀글/공감표시) disabled + 글자수 카운터
 *   - 액션 버튼: 단일 "수정하기" → 취소 / 임시저장(disabled) / 수정
 *
 * 이미지 첨부 섹션 (PostWrite D5)은 추가하지 않음:
 *   - updatePostAction 이 formData.get("images") 를 처리하지 않음 (community.ts:165~202 확인)
 *   - 기존 edit 페이지에도 이미지 입력이 없었음 → API/데이터 흐름 보존 원칙 유지
 */

import { useActionState, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CommunityAsideNav } from "../../_components/community-aside-nav";
import { updatePostAction } from "@/app/actions/community";

// 카테고리 옵션 — /community/new (PostWrite 박제) 와 동일한 6개 (notice 제외)
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "general",     label: "자유게시판" },
  { value: "recruit",     label: "팀원모집" },
  { value: "review",      label: "대회후기" },
  { value: "marketplace", label: "농구장터" },
  { value: "qna",         label: "질문답변" },
  { value: "info",        label: "정보공유" },
];

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
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 본문 글자수 카운터 — 시안 표시용 (post 로드 시 초기화)
  const [bodyLen, setBodyLen] = useState(0);

  useEffect(() => {
    // 서버에서 게시글 데이터를 가져옴 (public_id 기반) — 기존 로직 0 변경
    async function fetchPost() {
      try {
        const res = await fetch(`/api/web/community/${params.id}`);
        if (!res.ok) {
          setError("게시글을 불러올 수 없습니다.");
          return;
        }
        const json = await res.json();
        const data = json.data ?? json;
        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          category: data.category ?? "general",
        });
        // 글자수 카운터 초기값을 기존 본문 길이로 세팅
        setBodyLen((data.content ?? "").length);
      } catch {
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
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
            <div className="card" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--color-error, #E31B23)", fontWeight: 600 }}>
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

  return (
    // 시안 .page > .with-aside — PostWrite / BoardList / PostDetail 와 동일 레이아웃
    <div className="page">
      <div className="with-aside">
        {/* 좌측: 동일한 사이드바 재사용. 글 수정 페이지엔 활성 카테고리 개념 없음 → null */}
        <CommunityAsideNav activeCategory={null} />

        <main>
          {/* 1. 페이지 헤더 — PostWrite 톤: 좌 제목 + 우 안내 */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>
              글 수정
            </h1>
            {/* 수정 페이지 보조 안내 — 임시저장은 신규 작성과 동일하게 준비 중 */}
            <div style={{ fontSize: 12, color: "var(--ink-dim)" }} title="임시저장 / 자동저장 준비 중">
              자동저장 준비 중
            </div>
          </div>

          {/* 2. 본문 카드 — 시안 .card padding:20 */}
          <div className="card" style={{ padding: 20 }}>
            {/* 서버 액션 에러 표시 (기존 동작 그대로) */}
            {state?.error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-chip, 6px)",
                  background: "var(--color-error-light, rgba(227,27,35,0.08))",
                  color: "var(--color-error, #E31B23)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {state.error}
              </div>
            )}

            {/* form action / hidden public_id / pending 모두 기존 그대로 (변경 0) */}
            <form action={formAction}>
              {/* hidden 필드: 어떤 게시글을 수정하는지 식별 — updatePostAction 이 사용 */}
              <input type="hidden" name="public_id" value={params.id} />

              {/* 2-1. 게시판 선택 + 제목 — PostWrite 와 동일 160px / 1fr 그리드 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label className="label" htmlFor="post-category">게시판 선택</label>
                  <select
                    id="post-category"
                    name="category"
                    className="select"
                    defaultValue={post.category}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="post-title">제목</label>
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

              {/* 2-2. 툴바 — 모두 disabled "준비 중" (PostWrite 와 동일 패턴)
                     모바일 폴리시: nowrap + overflowX:auto 로 1줄 가로 스크롤 */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "6px 8px",
                  border: "1px solid var(--border)",
                  borderBottom: 0,
                  borderRadius: "var(--radius-chip) var(--radius-chip) 0 0",
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

              {/* 2-3. 본문 textarea — 툴바와 시각적으로 연결 (상단 radius 0) */}
              <textarea
                name="content"
                required
                className="textarea"
                placeholder="내용을 입력하세요"
                defaultValue={post.content}
                onChange={(e) => setBodyLen(e.target.value.length)}
                style={{
                  minHeight: 340,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  fontFamily: "var(--ff-body)",
                  lineHeight: 1.7,
                }}
              />

              {/* 2-4. 옵션 체크박스 — 모두 disabled, 글자수 카운터만 실 동작 */}
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
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "not-allowed", opacity: 0.55 }}
                  title="댓글 허용 옵션 준비 중"
                >
                  <input type="checkbox" disabled defaultChecked /> 댓글 허용
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "not-allowed", opacity: 0.55 }}
                  title="비밀글 옵션 준비 중"
                >
                  <input type="checkbox" disabled /> 비밀글
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6, cursor: "not-allowed", opacity: 0.55 }}
                  title="공감 표시 옵션 준비 중"
                >
                  <input type="checkbox" disabled defaultChecked /> 공감 표시
                </label>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12 }}>
                  {bodyLen.toLocaleString()} / {BODY_MAX.toLocaleString()}자
                </span>
              </div>

              {/* 2-5. 액션 버튼 — 취소 / 임시저장(disabled) / 수정
                     PostWrite 와 동일 패턴이지만 우측 버튼은 "등록" → "수정" */}
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
                {/* 수정: 기존 submit 버튼 — pending 시 라벨 변경 */}
                <button type="submit" className="btn btn--primary" disabled={pending}>
                  {pending ? "수정 중..." : "수정"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
