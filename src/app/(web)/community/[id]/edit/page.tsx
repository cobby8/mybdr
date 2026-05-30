"use client";

/**
 * EditPostPage — /community/[id]/edit (BDR v2.23 CU4 박제 · BC5)
 *
 * 이유(왜):
 *   - 시안 CU4(CommunityEdit) = BC5 룰: "CU3 컴포넌트 재사용 (별 컴포넌트 ❌)".
 *     따라서 정상 케이스는 공용 CommunityWizard 를 mode="edit" + prefill 로 호출.
 *   - 기존 데이터 fetch(prefill) / 로그인 유저 권한(isOwner) 가드는 보존.
 *   - updatePostAction 시그니처·hidden public_id 는 wizard 내부에서 0 변경 보존.
 *
 * 방법(어떻게):
 *   - 진입 시 /api/web/community/[id] + /api/web/me 병렬 fetch (기존 로직 보존)
 *   - 권한 없음(작성자≠본인) → 시안 lock view (수정 권한 없음)
 *   - 정상 → CommunityWizard mode="edit" publicId + prefill(title/content/category/images)
 *
 * 시안 출처: Dev/design/BDR-current/screens/CommunityEdit.jsx (CU4)
 * 박제 등급: A
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CommunityAsideNav } from "../../_components/community-aside-nav";
import { CommunityWizard } from "../../_components/community-wizard";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // 기존 게시글 데이터 로딩 (prefill) — 기존 로직 0 변경
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<{
    title: string;
    content: string;
    category: string;
    user_id: string;
    images: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 권한 체크용: 현재 로그인 유저 ID (없으면 null = 비로그인)
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    // 게시글 + 본인 정보 병렬 fetch (기존 로직 보존)
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

        setPost({
          title: data.title ?? "",
          content: data.content ?? "",
          category: data.category ?? "general",
          user_id: String(data.user_id ?? ""),
          // images 는 라우트가 select 안 하면 빈 배열 (prefill 구조만 유지)
          images: Array.isArray(data.images) ? data.images : [],
        });

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

  // 로딩 중 — with-aside 레이아웃 안 메시지
  if (loading) {
    return (
      <div className="page">
        <div className="with-aside">
          <CommunityAsideNav activeCategory={null} />
          <main>
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink-dim)" }}>불러오는 중...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 에러 / 데이터 없음
  if (error || !post) {
    return (
      <div className="page">
        <div className="with-aside">
          <CommunityAsideNav activeCategory={null} />
          <main>
            <div
              className="card"
              style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}
            >
              <span style={{ fontSize: 13, color: "var(--bdr-red)", fontWeight: 600 }}>
                {error ?? "게시글을 찾을 수 없습니다."}
              </span>
              <button type="button" onClick={() => router.back()} className="btn">
                뒤로 가기
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 권한 체크: 본인이 작성자가 아니면 시안 lock view (수정 권한 없음)
  // (서버 액션 updatePostAction 에서도 한 번 더 막힘)
  const isOwner = meId !== null && meId === post.user_id;
  if (!isOwner) {
    return (
      <div className="page">
        <div className="with-aside">
          <CommunityAsideNav activeCategory={null} />
          <main>
            <div
              className="card"
              style={{ padding: "48px 28px", textAlign: "center", maxWidth: 520, margin: "40px auto" }}
            >
              <div style={{ fontSize: 42, marginBottom: 14, color: "var(--ink-dim)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 56 }}>lock</span>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>수정 권한이 없습니다</h2>
              <p style={{ margin: "0 0 20px", color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
                본인이 작성한 글만 수정할 수 있어요.
                <br />
                다른 사용자가 작성한 글은 신고/차단 기능을 이용해 주세요.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn" type="button" onClick={() => router.push(`/community/${params.id}`)}>
                  상세로 돌아가기
                </button>
                <button className="btn btn--primary" type="button" onClick={() => router.push("/community")}>
                  목록으로
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 정상: 본인 글 → 공용 wizard 를 mode="edit" + prefill 로 호출 (BC5)
  return (
    <CommunityWizard
      mode="edit"
      publicId={params.id}
      prefill={{
        title: post.title,
        content: post.content,
        category: post.category,
        images: post.images,
      }}
    />
  );
}
