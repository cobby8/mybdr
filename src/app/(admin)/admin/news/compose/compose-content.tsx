"use client";

// 2026-06-14: Phase 10 박제 #5 IA1 (AdminNews A안) — 작성/발행 client 컴포넌트
//
// 시안 source: Dev/design/BDR-current/screens/AdminNews.jsx 를 React/TSX 로 1:1 박제.
//   - window.OperatorBadge       → <SiteOperatorBadge /> (운영 실제 뱃지 재사용)
//   - window.ANW_STATS           → props.stats (실집계)
//   - window.ANW_CATS            → 아래 CATS 상수 (카테고리 4종)
//   - window.ANW_TN_OPTIONS      → props.tournamentOptions (실조회)
//   - window.ANW_MATCH_OPTIONS   → 대회 선택 시 listMatchOptionsAction 으로 실조회
//   - window.ANW_HISTORY         → props.history (실조회)
//   - 발행 버튼/모달             → createAction(createNewsPostAction) 연동
//
// ★ 발행 모달의 "사용자 알림 보내기" 체크박스는 UI 만 존재 — 실제 알림 미연동
//   (대량 알림 위험 → 후속 연동 예정. server action 도 createNotification 미호출).

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SiteOperatorBadge } from "@/components/admin/site-operator-badge";
// 2026-06-21 Toss 2C — Material Symbols → lucide <Icon> 키트
import { Icon } from "@/components/admin-toss";

// 카테고리 4종 (시안 ANW_CATS 박제) — key 는 작성 메타, 저장 category 는 "news" 고정
const CATS = [
  { key: "magazine", label: "매거진", desc: "기획·인터뷰·칼럼" },
  { key: "match", label: "매치 단신", desc: "경기 결과·하이라이트" },
  { key: "notice", label: "공지", desc: "운영 안내·정책" },
  { key: "event", label: "이벤트", desc: "대회·프로모션" },
] as const;

// rich text mock toolbar 버튼 (시안 박제 — 동작 미구현)
// 2026-06-21 Toss 2C — Material명 → lucide <Icon> name (kebab). 버튼 순서/개수/sep 위치(i===4) 보존
const RICH_BTNS = [
  "bold", // format_bold
  "italic", // format_italic
  "list", // format_list_bulleted
  "quote", // format_quote
  "link", // link
  "image", // image
];

type Stats = { total: number; published: number; draft: number; thisMonth: number };
type HistoryRow = {
  id: string;
  title: string;
  status: string; // published | draft
  cat: string; // magazine | match
  time: string; // ISO
  views: number;
};
type Option = { id: string; name: string };

type CreateAction = (data: {
  title: string;
  content?: string;
  category?: string;
  publishMode?: string;
  tournamentId?: string | null;
  tournamentMatchId?: string | null;
}) => Promise<{ ok: boolean; id?: string; error?: string }>;

type ListMatchAction = (
  tournamentId: string,
) => Promise<{ ok: boolean; matches?: Option[]; error?: string }>;

// ISO → "YYYY.MM.DD HH:mm" (발행 이력 시각 표시)
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ComposeContent({
  stats,
  history,
  tournamentOptions,
  createAction,
  listMatchOptionsAction,
}: {
  stats: Stats;
  history: HistoryRow[];
  tournamentOptions: Option[];
  createAction: CreateAction;
  listMatchOptionsAction: ListMatchAction;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 작성 form 상태 (시안 useState 박제)
  const [cat, setCat] = useState<string>("magazine");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pub, setPub] = useState<string>("publish"); // publish | draft | schedule
  const [confirm, setConfirm] = useState(false);

  // 매치 cross-domain 선택 상태 (category=match 일 때)
  const [tnId, setTnId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [matchOptions, setMatchOptions] = useState<Option[]>([]);

  const catMeta = CATS.find((c) => c.key === cat)!;

  // 대회 선택 → 해당 대회 경기 옵션 실조회 (listMatchOptionsAction)
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

  // 발행/저장 실행 — createNewsPostAction 호출
  const onSubmit = () => {
    startTransition(async () => {
      const res = await createAction({
        title: title.trim(),
        content,
        category: cat,
        publishMode: pub,
        tournamentId: cat === "match" ? tnId || null : null,
        tournamentMatchId: cat === "match" ? matchId || null : null,
      });
      setConfirm(false);
      if (res.ok) {
        // 작성 후 검수 페이지(목록)로 이동 — 결과 확인
        router.push("/admin/news");
        router.refresh();
      } else {
        alert(`저장 실패: ${res.error ?? "ERROR"}`);
      }
    });
  };

  // nw-tag 카테고리 클래스 매핑 (시안: magazine→news)
  const tagClass = (k: string) => "nw-tag nw-tag--" + (k === "magazine" ? "news" : k);

  return (
    // 2026-06-21 Toss 2C — page 가 이 컴포넌트를 래퍼 div 없이 직접 렌더 → 루트에 data-skin opt-in
    <div className="oa1-page" data-skin="toss">
      <header className="oa1-hero">
        <div>
          <SiteOperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>
            BDR NEWS 발행
          </h1>
          <div className="oa1-hero__sub">ADMIN · 콘텐츠 · 매거진·매치 단신 발행 hub</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num">{stats.total}</div>
            <div className="oa1-hero__stat-lbl">전체 뉴스</div>
          </div>
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num oa1-hero__stat-num--approved">
              {stats.published}
            </div>
            <div className="oa1-hero__stat-lbl">발행됨</div>
          </div>
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num">{stats.draft}</div>
            <div className="oa1-hero__stat-lbl">임시저장</div>
          </div>
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num">{stats.thisMonth}</div>
            <div className="oa1-hero__stat-lbl">이달 발행</div>
          </div>
        </div>
      </header>

      <div className="anw-grid">
        {/* 작성 form */}
        <div className="pm-card">
          <h2 className="pm-card__h" style={{ marginBottom: 16 }}>
            {/* 2026-06-21 Toss 2C — edit_note → file-pen. .ico 래퍼 클래스 보존 */}
            <Icon name="file-pen" className="ico" />새 기사 작성
          </h2>

          {/* 카테고리 4 */}
          <div className="bl-field">
            <label className="bl-field__l">카테고리</label>
            <div className="anw-catrow">
              {CATS.map((c) => (
                <button
                  key={c.key}
                  className={"anw-cat" + (cat === c.key ? " is-on" : "")}
                  data-k={c.key}
                  onClick={() => setCat(c.key)}
                  type="button"
                >
                  <span className="anw-cat__top">
                    <span className="anw-cat__dot" />
                    <span className="anw-cat__l">{c.label}</span>
                  </span>
                  <span className="anw-cat__d">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 매치 cross-domain (category=match) */}
          {cat === "match" && (
            <div className="bl-field">
              <div className="anw-xlink">
                <div className="anw-xlink__h">
                  {/* 2026-06-21 Toss 2C — link → link. .ico 래퍼 보존 */}
                  <Icon name="link" className="ico" />매치 연결 (대회 / 경기
                  cross-domain)
                </div>
                <div className="anw-xlink__row">
                  <select
                    className="anw-select"
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
                    className="anw-select"
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    disabled={!tnId || pending}
                  >
                    <option value="">
                      {tnId ? "경기 선택…" : "대회를 먼저 선택"}
                    </option>
                    {matchOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bl-field">
            <label className="bl-field__l">
              제목 <span style={{ color: "var(--accent)" }}>*</span>
            </label>
            <input
              className="pm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="기사 제목"
              maxLength={120}
            />
          </div>

          {/* 본문 rich text (toolbar 는 mock — 동작 미구현) */}
          <div className="bl-field">
            <label className="bl-field__l">본문</label>
            <div className="anw-rich">
              <div className="anw-rich__bar">
                {RICH_BTNS.map((b, i) => (
                  <React.Fragment key={b}>
                    {i === 4 && <span className="anw-rich__sep" />}
                    <button className="anw-rich__btn" tabIndex={-1} type="button">
                      {/* 2026-06-21 Toss 2C — RICH_BTNS lucide name. .ico 래퍼 보존 */}
                      <Icon name={b} className="ico" />
                    </button>
                  </React.Fragment>
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="기사 본문을 입력하세요. 매치 단신은 알기자가 작성한 초안을 검수·수정합니다."
              />
            </div>
          </div>

          {/* 대표 이미지 (placeholder — 업로드 동작 미구현) */}
          <div className="bl-field">
            <label className="bl-field__l">대표 이미지</label>
            <div className="anw-cover">
              {/* 2026-06-21 Toss 2C — add_photo_alternate → image-plus. .ico 래퍼 보존 */}
              <Icon name="image-plus" className="ico" />
              <span>클릭 또는 드래그하여 대표 이미지 업로드</span>
            </div>
          </div>

          {/* 발행 옵션 */}
          <div className="bl-field" style={{ marginBottom: 18 }}>
            <label className="bl-field__l">발행 방식</label>
            <div className="anw-opts">
              {/* 2026-06-21 Toss 2C — ico 값을 lucide name(kebab)으로: send→send / save→save / schedule→clock */}
              {(
                [
                  ["publish", "send", "바로 발행"],
                  ["draft", "save", "임시저장"],
                  ["schedule", "clock", "예약 발행"],
                ] as const
              ).map(([k, ico, l]) => (
                <button
                  key={k}
                  className={"anw-opt" + (pub === k ? " is-on" : "")}
                  onClick={() => setPub(k)}
                  type="button"
                >
                  <span className="anw-opt__radio" />
                  <Icon name={ico} className="ico" />
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn--primary"
            style={{ width: "100%" }}
            disabled={!title.trim() || pending}
            onClick={() => setConfirm(true)}
            type="button"
          >
            {/* 2026-06-21 Toss 2C — save→save / schedule→clock / send→send */}
            <Icon
              name={pub === "draft" ? "save" : pub === "schedule" ? "clock" : "send"}
              className="ico"
            />
            {pub === "draft" ? "임시저장" : pub === "schedule" ? "예약 발행 설정" : "발행하기"}
          </button>
        </div>

        {/* 미리보기 */}
        <aside>
          <div className="anw-preview-h">
            {/* 2026-06-21 Toss 2C — visibility → eye. .ico 래퍼 보존 */}
            <Icon name="eye" className="ico" />미리보기 (사용자 IU2)
          </div>
          <div className="anw-preview">
            <div className="anw-preview__cover">
              {/* 2026-06-21 Toss 2C — 카테고리별: sports_basketball→volleyball(농구 부재) / celebration→party-popper / campaign→megaphone / photo→image */}
              <Icon
                name={
                  cat === "match"
                    ? "volleyball"
                    : cat === "event"
                      ? "party-popper"
                      : cat === "notice"
                        ? "megaphone"
                        : "image"
                }
                className="ico"
              />
            </div>
            <div className="anw-preview__body">
              <div className="anw-preview__cat">
                <span className={tagClass(cat)}>{catMeta.label}</span>
              </div>
              {title.trim() ? (
                <>
                  <div className="anw-preview__title">{title}</div>
                  {content && (
                    <div className="anw-preview__content">
                      {content.slice(0, 100)}
                      {content.length > 100 ? "…" : ""}
                    </div>
                  )}
                </>
              ) : (
                <div className="anw-preview__empty">제목을 입력하면 미리보기가 표시됩니다</div>
              )}
            </div>
          </div>
          <div className="bl-refund-note" style={{ marginTop: 12 }}>
            {/* 2026-06-21 Toss 2C — hub → share-2. .ico 래퍼 보존 */}
            <Icon name="share-2" className="ico" />
            <div>
              <div className="bl-refund-note__t">발행 시 자동 동기화</div>
              <div className="bl-refund-note__d">
                발행된 기사는 News 매거진에 즉시 노출됩니다. (알림 발송은 후속 연동 예정)
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 발행 이력 — 실조회 */}
      <div className="pm-card" style={{ marginTop: 4 }}>
        <h2 className="pm-card__h" style={{ marginBottom: 14 }}>
          {/* 2026-06-21 Toss 2C — history → history. .ico 래퍼 보존 */}
          <Icon name="history" className="ico" />발행 이력
        </h2>
        <div className="anw-hist">
          {history.length === 0 ? (
            <div className="anw-preview__empty" style={{ padding: "12px 0" }}>
              아직 발행 이력이 없습니다
            </div>
          ) : (
            history.map((h) => {
              const cm = CATS.find((c) => c.key === h.cat) ?? CATS[0];
              return (
                <div key={h.id} className="anw-hrow">
                  <span className={tagClass(h.cat)}>{cm.label}</span>
                  <div className="anw-hrow__body">
                    <div className="anw-hrow__title">{h.title}</div>
                    <div className="anw-hrow__meta">
                      <span>{fmtTime(h.time)}</span>
                    </div>
                  </div>
                  <div className="anw-hrow__views">
                    {h.views.toLocaleString("ko-KR")}
                    <small>조회</small>
                  </div>
                  <span className={"anw-status anw-status--" + h.status}>
                    {/* 2026-06-21 Toss 2C — check_circle→circle-check / edit→pencil (size 12 이관) */}
                    <Icon
                      name={h.status === "published" ? "circle-check" : "pencil"}
                      size={12}
                      className="ico"
                    />
                    {h.status === "published" ? "발행됨" : "임시저장"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 발행 확인 모달 — ★ "사용자 알림 보내기" 체크박스는 UI 만 (미연동) */}
      {confirm && (
        <div className="bl-modal-stage" onClick={() => setConfirm(false)}>
          <div className="bl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title">
                {/* 2026-06-21 Toss 2C — send → send. color var(--accent) 인라인 보존 */}
                <Icon
                  name="send"
                  className="ico"
                  style={{ color: "var(--accent)" }}
                />
                기사를 발행할까요?
              </h3>
              <button
                className="bl-modal__close"
                onClick={() => setConfirm(false)}
                type="button"
              >
                {/* 2026-06-21 Toss 2C — close → x. .ico 래퍼 보존 */}
                <Icon name="x" className="ico" />
              </button>
            </div>
            <div className="bl-modal__body">
              <div className="ad-summary" style={{ marginBottom: 14 }}>
                <div className="ad-summary__row">
                  <span className="ad-summary__l">카테고리</span>
                  <span className="ad-summary__v">{catMeta.label}</span>
                </div>
                <div className="ad-summary__row">
                  <span className="ad-summary__l">제목</span>
                  <span className="ad-summary__v">{title || "—"}</span>
                </div>
              </div>
              {/* ★ 알림 체크박스 — UI 만 존재, 실제 발송 미연동 (후속 연동 예정) */}
              <label className="anw-modal-notify" htmlFor="anw-notify">
                <input type="checkbox" id="anw-notify" defaultChecked />
                <div>
                  <div className="anw-modal-notify__t">사용자에게 알림 보내기</div>
                  <div className="anw-modal-notify__d">
                    발행과 동시에 전체 사용자에게 새 기사 알림이 전송됩니다. (현재 UI 만 제공 —
                    알림 발송은 후속 연동 예정)
                  </div>
                </div>
              </label>
            </div>
            <div className="bl-modal__foot">
              <button
                className="btn btn--sm"
                onClick={() => setConfirm(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="btn btn--sm btn--primary"
                onClick={onSubmit}
                disabled={pending}
                type="button"
              >
                {/* 2026-06-21 Toss 2C — send → send. .ico 래퍼 보존 */}
                <Icon name="send" className="ico" />
                {pub === "publish" ? "발행" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
