"use client";

// =====================================================================
// _compose.tsx — BDR NEWS 작성 폼 (클라). 레거시 (admin)/admin/news/compose 통합.
//   news-console(검수)에 "작성" 기능을 더한다: 카테고리/제목/본문/발행방식 + 매치 cross-domain.
//
//   ⚠ 백엔드 0변경 — 작성은 기존 server action(createNewsPostAction) 1:1 호출.
//     대회 선택 시 경기 옵션은 기존 listMatchOptionsAction(SELECT only) 호출. 신규 API 0.
//     · category 4종(magazine/match/notice/event)은 작성 메타 — 저장 category 는 action 이 "news" 고정.
//     · publishMode: publish→즉시발행 / draft·schedule→임시저장(예약 스케줄러 미구현, 레거시 동일).
//   ⚠ 디자인 — admin-v2 키트(Modal/Btn/Icon) + .ts-field/.ts-input/.ts-select/.ts-chip + var(--*) 만.
//     하드코딩 색상(#fff/hex/rgba) 0. pill 9999px 0.
//   ⚠ 리치텍스트 툴바·대표 이미지 업로드·사용자 알림 발송 = 레거시도 mock/미구현 → 동등 처리(발명 0).
//     본문은 textarea(텍스트 위주), 알림은 hint 문구로만 안내.
// =====================================================================

import React from "react";
import { Modal, Btn, Icon, useAdminShell } from "@/components/admin-v2";

type Option = { id: string; name: string };

// createNewsPostAction 시그니처 1:1 (admin-news.ts)
type CreateAction = (data: {
  title: string;
  content?: string;
  category?: string;
  publishMode?: string;
  tournamentId?: string | null;
  tournamentMatchId?: string | null;
}) => Promise<{ ok: boolean; id?: string; error?: string }>;

// listMatchOptionsAction 시그니처 1:1 (admin-news.ts)
type ListMatchAction = (
  tournamentId: string,
) => Promise<{ ok: boolean; matches?: Option[]; error?: string }>;

// 카테고리 4종 (레거시 CATS 1:1) — key=작성 메타, 저장 category 는 action 이 "news" 로 고정.
const CATS = [
  { key: "magazine", label: "매거진", desc: "기획·인터뷰·칼럼" },
  { key: "match", label: "매치 단신", desc: "경기 결과·하이라이트" },
  { key: "notice", label: "공지", desc: "운영 안내·정책" },
  { key: "event", label: "이벤트", desc: "대회·프로모션" },
] as const;

// 발행 방식 3종 (레거시 동일) — schedule 은 스케줄러 미구현이라 action 에서 draft 로 보관.
const PUB_MODES = [
  { key: "publish", icon: "send", label: "바로 발행" },
  { key: "draft", icon: "save", label: "임시저장" },
  { key: "schedule", icon: "clock", label: "예약 발행" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentOptions: Option[];
  createAction: CreateAction;
  listMatchOptionsAction: ListMatchAction;
  // 작성 성공 시 호출 — _console 이 결과 상태(published/draft) 탭으로 목록 전환 + toast.
  onCreated: (resultStatus: "published" | "draft") => void;
}

export function NewsCompose({
  open,
  onClose,
  tournamentOptions,
  createAction,
  listMatchOptionsAction,
  onCreated,
}: Props) {
  const { toast } = useAdminShell();
  const [pending, startTransition] = React.useTransition();

  // 작성 폼 상태 (레거시 useState 1:1)
  const [cat, setCat] = React.useState<string>("magazine");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [pub, setPub] = React.useState<string>("publish");

  // 매치 cross-domain 상태 (category=match 전용)
  const [tnId, setTnId] = React.useState("");
  const [matchId, setMatchId] = React.useState("");
  const [matchOptions, setMatchOptions] = React.useState<Option[]>([]);

  const catMeta = CATS.find((c) => c.key === cat) ?? CATS[0];

  // 폼 초기화 — 다음 작성에 이전 입력 잔상 방지.
  const reset = () => {
    setCat("magazine");
    setTitle("");
    setContent("");
    setPub("publish");
    setTnId("");
    setMatchId("");
    setMatchOptions([]);
  };

  // 닫기 — 저장 중에는 차단(중복 제출/유실 방지). 닫을 때 폼 리셋.
  const handleClose = () => {
    if (pending) return;
    reset();
    onClose();
  };

  // 대회 선택 → 해당 대회 경기 옵션 실조회 (listMatchOptionsAction · 레거시 1:1).
  const onSelectTournament = (id: string) => {
    setTnId(id);
    setMatchId("");
    setMatchOptions([]);
    if (!id) return;
    startTransition(async () => {
      const res = await listMatchOptionsAction(id);
      if (res.ok && res.matches) setMatchOptions(res.matches);
    });
  };

  // 작성/발행 실행 — createNewsPostAction 호출 (레거시 onSubmit 1:1).
  const onSubmit = () => {
    startTransition(async () => {
      const res = await createAction({
        title: title.trim(),
        content,
        category: cat,
        publishMode: pub,
        // 매치 단신일 때만 cross-domain 메타 전달 (그 외 null — action 도 동일 규약).
        tournamentId: cat === "match" ? tnId || null : null,
        tournamentMatchId: cat === "match" ? matchId || null : null,
      });
      if (res.ok) {
        // publish→published / 그 외→draft (action 의 status 매핑과 일치).
        const resultStatus = pub === "publish" ? "published" : "draft";
        reset();
        onCreated(resultStatus);
      } else {
        toast(`저장 실패: ${res.error ?? "ERROR"}`);
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="새 기사 작성"
      sub="BDR NEWS · 매거진·매치 단신 발행"
      maxWidth={640}
      foot={
        <>
          <Btn variant="ghost" disabled={pending} onClick={handleClose}>
            취소
          </Btn>
          <Btn
            // 발행 방식별 아이콘 — publish=send / draft·schedule=save
            icon={pub === "publish" ? "send" : "save"}
            disabled={!title.trim() || pending}
            onClick={onSubmit}
          >
            {pending
              ? "저장 중…"
              : pub === "draft"
                ? "임시저장"
                : pub === "schedule"
                  ? "예약 저장"
                  : "발행하기"}
          </Btn>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* 카테고리 4 (레거시 CATS 1:1) — 선택 칩 + 설명 hint */}
        <div className="ts-field">
          <label className="ts-field__label">카테고리</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATS.map((c) => (
              <button
                key={c.key}
                type="button"
                className="ts-chip"
                data-active={cat === c.key ? "true" : "false"}
                onClick={() => setCat(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="ts-field__hint">{catMeta.desc}</div>
        </div>

        {/* 매치 cross-domain (category=match 전용) — 대회 선택 → 경기 옵션 실조회 */}
        {cat === "match" && (
          <div className="ts-field">
            <label className="ts-field__label">매치 연결 (대회 · 경기)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select
                className="ts-select"
                value={tnId}
                onChange={(e) => onSelectTournament(e.target.value)}
              >
                <option value="">대회 선택…</option>
                {tournamentOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select
                className="ts-select"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                disabled={!tnId || pending}
              >
                <option value="">{tnId ? "경기 선택…" : "대회 먼저 선택"}</option>
                {matchOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ts-field__hint">선택한 경기와 기사를 연결합니다. (선택 사항)</div>
          </div>
        )}

        {/* 제목 (필수) */}
        <div className="ts-field">
          <label className="ts-field__label">제목 *</label>
          <input
            className="ts-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="기사 제목"
            maxLength={120}
          />
        </div>

        {/* 본문 — 텍스트 위주(레거시 리치텍스트 툴바는 mock 이라 미구현·textarea 로 동등 처리) */}
        <div className="ts-field">
          <label className="ts-field__label">본문</label>
          <textarea
            className="ts-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="기사 본문을 입력하세요."
            style={{ resize: "vertical", lineHeight: 1.7 }}
          />
        </div>

        {/* 발행 방식 3 — 선택 칩 + 알림/예약 안내 hint */}
        <div className="ts-field" style={{ marginBottom: 0 }}>
          <label className="ts-field__label">발행 방식</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PUB_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                className="ts-chip"
                data-active={pub === m.key ? "true" : "false"}
                onClick={() => setPub(m.key)}
              >
                <Icon name={m.icon} size={14} />
                {m.label}
              </button>
            ))}
          </div>
          <div className="ts-field__hint">
            발행 시 사용자 알림 발송은 후속 연동 예정입니다. 예약 발행은 임시저장으로 보관됩니다.
          </div>
        </div>
      </div>
    </Modal>
  );
}
