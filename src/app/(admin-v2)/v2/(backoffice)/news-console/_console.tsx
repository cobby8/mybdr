"use client";

// =====================================================================
// _console.tsx — BDR NEWS 검수 콘솔 (클라). 레거시 admin-news-content.tsx 1:1 동작.
//   운영자가 알기자 AI 초안을 검수: 상태탭(draft/published/rejected) → 목록 → 상세 미리보기
//   → 발행/반려/본기사 재생성/요약 재생성/편집 + 사진 관리.
//
//   ⚠ 백엔드 0변경 — 목록/카운트/linkify/photos 는 서버 props 주입(추가 fetch 0).
//     검수 5액션 = props 로 받은 기존 server action 직접 호출.
//     사진 = _photo-manager(기존 REST 호출). 상태탭 전환 = ?status= URL(서버 재READ).
//   ⚠ 디자인 — admin-v2 키트(PageHead/DataTable/Modal/Badge/Btn/Icon) + .ts-*/.bo-* + var(--*) 토큰만.
//     하드코딩 색상(#fff/hex/rgba) 0. pill 9999px 0.
//   ⚠ 파괴적 액션(반려/재생성/요약재생성/삭제)은 confirm — 레거시 문구 그대로 보존(1:1).
//   ⚠ selected 는 id 로 보관 → props(posts) 갱신 시 최신 객체 재도출(사진 refresh 반영, 레거시 동일).
// =====================================================================

import React from "react";
import { useRouter } from "next/navigation";
import { LinkifyNewsBody, type LinkifyEntry } from "@/lib/news/linkify-news-body";
import { NewsPhotoManager, type NewsPhoto } from "./_photo-manager";
import { NewsCompose } from "./_compose";
import {
  PageHead,
  DataTable,
  Modal,
  Badge,
  Btn,
  Icon,
  useAdminShell,
  type DataCol,
  type DataRow,
  type BadgeTone,
} from "@/components/admin-v2";

// ── 직렬화 타입(page.tsx 서버 매핑과 1:1) ──
export type NewsPost = {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  view_count: number;
  tournament_match_id: string | null;
  tournament_id: string | null;
  period_type: string | null;
  period_key: string | null;
  linkifyEntries: LinkifyEntry[];
  photos: NewsPhoto[];
};

type Counts = { draft: number; published: number; rejected: number };
type ActionResult = { ok: boolean; error?: string };
// 작성(compose) 옵션 — 매치 cross-domain 대회 셀렉트용 (page.tsx READ 직렬화)
type Option = { id: string; name: string };

interface Props {
  posts: NewsPost[];
  currentStatus: "draft" | "published" | "rejected";
  counts: Counts;
  publishAction: (id: bigint) => Promise<ActionResult>;
  rejectAction: (id: bigint) => Promise<ActionResult>;
  regenerateAction: (id: bigint) => Promise<ActionResult>;
  regenerateSummaryAction: (matchId: bigint) => Promise<ActionResult>;
  editAction: (
    id: bigint,
    data: { title?: string; content?: string },
  ) => Promise<ActionResult>;
  // ── 작성(compose) 통합 — 레거시 (admin)/admin/news/compose 의 작성 기능 ──
  tournamentOptions: Option[];
  createAction: (data: {
    title: string;
    content?: string;
    category?: string;
    publishMode?: string;
    tournamentId?: string | null;
    tournamentMatchId?: string | null;
  }) => Promise<{ ok: boolean; id?: string; error?: string }>;
  listMatchOptionsAction: (
    tournamentId: string,
  ) => Promise<{ ok: boolean; matches?: Option[]; error?: string }>;
}

// ── 상태 라벨/톤 (레거시 NEWS_STATUS_* 1:1 — draft=warn / published=ok / rejected=danger) ──
const STATUS_LABEL: Record<string, string> = {
  draft: "검수 대기",
  published: "발행됨",
  rejected: "거절됨",
};
const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "warn",
  published: "ok",
  rejected: "danger",
};

// 상태탭 — 레거시 좌측 탭(검수 대기/발행됨/거절됨)을 ?status= 서버필터로.
const TABS: { id: "draft" | "published" | "rejected"; label: string; icon: string }[] = [
  { id: "draft", label: "검수 대기", icon: "clock" },
  { id: "published", label: "발행됨", icon: "circle-check" },
  { id: "rejected", label: "거절됨", icon: "ban" },
];

// 표 컬럼(admin-v2 DataTable)
const COLS: DataCol[] = [
  { key: "title", label: "제목", w: "minmax(0,2fr)" },
  { key: "match", label: "매치", w: "100px" },
  { key: "stats", label: "지표", w: "150px", align: "center" },
  { key: "date", label: "작성", w: "150px" },
];

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("ko-KR");
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ko-KR");

export function NewsConsole({
  posts,
  currentStatus,
  counts,
  publishAction,
  rejectAction,
  regenerateAction,
  regenerateSummaryAction,
  editAction,
  tournamentOptions,
  createAction,
  listMatchOptionsAction,
}: Props) {
  const router = useRouter();
  const { toast } = useAdminShell();

  // 작성 모달 열림 상태 (compose 통합)
  const [composeOpen, setComposeOpen] = React.useState(false);

  // selected 는 id 보관 — posts(props) 갱신 시 최신 객체 재도출(사진 refresh 반영, 레거시 동일).
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [editing, setEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");

  const selected = posts.find((p) => p.id === selectedId) ?? null;

  // 상태탭 전환 — URL ?status= 로 서버 재READ (목록은 서버가 status 별로 읽음).
  const goStatus = (id: string) => router.push(`/v2/news-console?status=${id}`);

  // 액션 공통 — server action 호출 → 성공 시 refresh + toast / 실패 시 toast.
  const runAction = (action: () => Promise<ActionResult>, successMsg: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        router.refresh(); // page.tsx 서버 재조회 → 목록/사진 갱신
        toast(successMsg);
      } else {
        toast(`실패: ${result.error ?? "ERROR"}`);
      }
    });
  };

  const handlePublish = (id: string) =>
    runAction(() => publishAction(BigInt(id)), "발행 완료");
  const handleReject = (id: string) => {
    // [레거시 confirm 문구 1:1 보존]
    if (!confirm("거절하시겠습니까? (rejected 처리, 노출 X)")) return;
    runAction(() => rejectAction(BigInt(id)), "거절 완료");
  };
  const handleRegenerate = (id: string) => {
    // [파괴적 — DELETE + LLM 재호출. 레거시 confirm 문구 1:1 보존]
    if (!confirm("재생성하시겠습니까? (기존 게시물 삭제 + LLM 새로 호출, 30~60초 소요)")) return;
    runAction(() => regenerateAction(BigInt(id)), "재생성 완료");
  };
  const handleRegenerateSummary = (matchId: string) => {
    // [레거시 confirm 문구 1:1 보존]
    if (!confirm("라이브 페이지 요약을 재생성하시겠습니까? (LLM 재호출, 본기사 영향 X)")) return;
    runAction(() => regenerateSummaryAction(BigInt(matchId)), "요약 재생성 완료");
  };
  const handleEditStart = (post: NewsPost) => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditing(true);
  };
  const handleEditSave = (id: string) => {
    runAction(
      () => editAction(BigInt(id), { title: editTitle, content: editContent }),
      "수정 완료",
    );
    setEditing(false);
  };

  // 작성 성공 → 결과 상태 탭으로 목록 전환 + 서버 재READ + toast.
  //   createAction 의 status 매핑(publish→published / 그 외→draft)과 동일한 status 로 이동해
  //   방금 작성한 기사가 보이게 한다.
  const handleCreated = (resultStatus: "published" | "draft") => {
    setComposeOpen(false);
    router.push(`/v2/news-console?status=${resultStatus}`);
    router.refresh();
    toast(resultStatus === "published" ? "발행 완료" : "임시저장 완료");
  };

  // 행 클릭 → 미리보기 Modal 오픈 (편집상태 초기화)
  const openPost = (id: string) => {
    setSelectedId(id);
    setEditing(false);
  };
  const closePost = () => {
    if (isPending) return;
    setSelectedId(null);
    setEditing(false);
  };

  // 표 셀 렌더
  const renderCell = (row: DataRow, key: string) => {
    const p = row as unknown as NewsPost;
    switch (key) {
      case "title":
        return (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: "var(--ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.title}
            </div>
            {/* 사진 보유 시 작은 표식 */}
            {p.photos.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2, fontSize: 11, color: "var(--ink-mute)" }}>
                <Icon name="image" size={12} />
                {p.photos.length}
              </div>
            )}
          </div>
        );
      case "match":
        return (
          <span style={{ color: "var(--ink-soft)", fontFamily: "var(--ff-mono)", fontSize: 12 }}>
            {p.tournament_match_id ? `#${p.tournament_match_id}` : "-"}
          </span>
        );
      case "stats":
        return (
          <span style={{ display: "inline-flex", gap: 10, color: "var(--ink-mute)", fontSize: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Icon name="eye" size={13} />
              {p.view_count}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Icon name="heart" size={13} />
              {p.likes_count}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Icon name="message-circle" size={13} />
              {p.comments_count}
            </span>
          </span>
        );
      case "date":
        return (
          <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>{fmtDate(p.created_at)}</span>
        );
      default:
        return null;
    }
  };

  const teamCount = selected?.linkifyEntries.filter((e) => e.type === "team").length ?? 0;
  const playerCount = selected?.linkifyEntries.filter((e) => e.type === "player").length ?? 0;

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 콘텐츠"
        title="BDR NEWS 검수"
        sub={`검수 대기 ${counts.draft} · 발행됨 ${counts.published} · 거절됨 ${counts.rejected}`}
        actions={
          // 작성 통합 — 레거시 /admin/news/compose 진입을 news-console 내부 모달로.
          <Btn icon="plus" onClick={() => setComposeOpen(true)}>
            새 기사 작성
          </Btn>
        }
      />

      {/* 작성 모달 — 기존 createNewsPostAction/listMatchOptionsAction 호출(백엔드 0변경) */}
      <NewsCompose
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        tournamentOptions={tournamentOptions}
        createAction={createAction}
        listMatchOptionsAction={listMatchOptionsAction}
        onCreated={handleCreated}
      />

      {/* 상태탭 — ?status= 서버필터(클릭 시 서버 재READ) */}
      <div className="bo-constabs" style={{ marginTop: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="bo-constab"
            data-on={currentStatus === t.id ? "true" : "false"}
            onClick={() => goStatus(t.id)}
          >
            <Icon name={t.icon} size={14} />
            {t.label} {counts[t.id]}
          </button>
        ))}
      </div>

      {/* 목록 표 — 행 클릭 시 미리보기/검수 Modal */}
      <div style={{ marginTop: 12 }}>
        <DataTable
          cols={COLS}
          rows={posts as unknown as DataRow[]}
          render={renderCell}
          onRow={(row) => openPost(String(row.id))}
          empty={`${STATUS_LABEL[currentStatus]} 항목이 없습니다.`}
        />
      </div>

      {/* 미리보기 / 검수 Modal */}
      <Modal
        open={!!selected}
        onClose={closePost}
        title={selected?.title}
        sub={selected ? STATUS_LABEL[selected.status] ?? selected.status : ""}
        maxWidth={760}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, color: "var(--ink)" }}>
            {/* 메타 행 — 매치 / 상태 배지 / 작성일 */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-mute)" }}>
              <span style={{ fontFamily: "var(--ff-mono)" }}>
                match {selected.tournament_match_id ? `#${selected.tournament_match_id}` : "-"}
              </span>
              <Badge tone={STATUS_TONE[selected.status] ?? "grey"}>
                {STATUS_LABEL[selected.status] ?? selected.status}
              </Badge>
              <span>{fmtDateTime(selected.created_at)}</span>
            </div>

            {editing ? (
              // ── 편집 모드 (제목/본문 직접 수정) ──
              <>
                <input
                  className="ts-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="제목"
                />
                <textarea
                  className="ts-input"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  placeholder="본문"
                  style={{ resize: "vertical", lineHeight: 1.7 }}
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Btn variant="ghost" disabled={isPending} onClick={() => setEditing(false)}>
                    취소
                  </Btn>
                  <Btn icon="check" disabled={isPending} onClick={() => handleEditSave(selected.id)}>
                    {isPending ? "저장 중…" : "저장"}
                  </Btn>
                </div>
              </>
            ) : (
              // ── 미리보기 + 검수 액션 ──
              <>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Btn variant="ghost" size="sm" icon="pencil" onClick={() => handleEditStart(selected)}>
                    수정
                  </Btn>
                </div>

                {/* 본문 — linkify (admin-v2 primary 링크색 주입). 부모 color=var(--ink) 상속. */}
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink)" }}>
                  <LinkifyNewsBody
                    content={selected.content}
                    entries={selected.linkifyEntries}
                    className=""
                    linkClassName="text-[color:var(--primary)] hover:underline font-medium"
                  />
                </div>

                {selected.linkifyEntries.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-mute)" }}>
                    <Icon name="link" size={13} />
                    자동 링크: 팀 {teamCount} · 선수 {playerCount}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--ink-mute)", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  {selected.content.length}자
                </div>

                {/* 검수 액션 — draft 에서만 발행/거절, 모든 상태에서 재생성 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selected.status === "draft" && (
                    <>
                      <Btn icon="check" disabled={isPending} onClick={() => handlePublish(selected.id)}>
                        발행
                      </Btn>
                      <Btn variant="danger" icon="ban" disabled={isPending} onClick={() => handleReject(selected.id)}>
                        거절
                      </Btn>
                    </>
                  )}
                  <Btn variant="secondary" icon="refresh-cw" disabled={isPending} onClick={() => handleRegenerate(selected.id)}>
                    본기사 재생성
                  </Btn>
                  {selected.tournament_match_id && (
                    <Btn
                      variant="secondary"
                      icon="file-text"
                      disabled={isPending}
                      onClick={() => handleRegenerateSummary(selected.tournament_match_id!)}
                    >
                      요약 재생성
                    </Btn>
                  )}
                  {selected.tournament_match_id && (
                    // Btn 은 button 렌더 → 외부 링크는 ts-btn 클래스를 입힌 anchor 로(새 탭).
                    <a
                      href={`/live/${selected.tournament_match_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ts-btn ts-btn--ghost"
                    >
                      <Icon name="external-link" size={17} />
                      매치 페이지
                    </a>
                  )}
                </div>

                {/* 사진 관리 — 매치 있을 때만 (옵션 B: 레거시 mutation 1:1 / 디자인만 admin-v2) */}
                {selected.tournament_match_id && (
                  <NewsPhotoManager
                    matchId={selected.tournament_match_id}
                    initialPhotos={selected.photos}
                  />
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
