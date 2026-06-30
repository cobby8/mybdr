"use client";

// =====================================================================
// _console.tsx — 시즌 시상 콘솔 (클라). 레거시 admin-season-awards-content.tsx 1:1 동작.
//   시리즈/카테고리 선택 → 선수 검색 autocomplete → 시상 추가/삭제 + 목록표.
//
//   ⚠ 백엔드 0변경 — mutation 은 기존 server action 그대로 호출(props 주입):
//     · 추가/수정 = upsertAction(formData)  · 삭제 = deleteAction(formData)
//   선수 검색 = 기존 GET /api/web/admin/users/search (레거시 동일·debounce 300ms).
//   ⚠ 디자인 — admin-v2 키트(PageHead/DataTable/Btn/Icon) + ts-*/ad-* + var(--*) 토큰만.
//     하드코딩 색상(#fff/hex/rgba) 0. pill 9999px 0.
// =====================================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageHead,
  DataTable,
  Btn,
  Icon,
  type DataCol,
  type DataRow,
} from "@/components/admin-v2";

import {
  SEASON_AWARD_CATEGORIES,
  SEASON_AWARD_CATEGORY_LABELS,
  SEASON_AWARD_MULTI_SLOT,
  type SeasonAwardCategory,
} from "@/lib/awards/season-award-categories";

interface SeriesOption {
  id: string;
  slug: string;
  name: string;
}

interface SerializedAward {
  id: string;
  seriesId: string | null;
  seriesName: string | null;
  seasonYear: number | null;
  category: string;
  userId: string | null;
  recipientName: string | null;
  teamId: string | null;
  teamName: string | null;
  comment: string | null;
  quote: string | null;
  displayOrder: number;
}

interface UserHit {
  id: string;
  nickname: string | null;
  email: string | null;
  name: string | null;
}

interface Props {
  seriesList: SeriesOption[];
  awards: SerializedAward[];
  upsertAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

// 목록 표 컬럼(admin-v2 DataTable)
const COLS: DataCol[] = [
  { key: "series", label: "시리즈", w: "140px" },
  { key: "category", label: "카테고리", w: "120px" },
  { key: "recipient", label: "수상 선수/팀", w: "minmax(0,1fr)" },
  { key: "comment", label: "코멘트", w: "minmax(0,1.2fr)" },
  { key: "order", label: "순서", w: "70px", align: "center" },
  { key: "delete", label: "삭제", w: "70px", align: "center" },
];

export function SeasonAwardsConsole({ seriesList, awards, upsertAction, deleteAction }: Props) {
  const router = useRouter();

  // 폼 상태
  const [category, setCategory] = React.useState<SeasonAwardCategory>(SEASON_AWARD_CATEGORIES[0]);
  const [selectedUser, setSelectedUser] = React.useState<UserHit | null>(null);

  // 선수 검색 autocomplete 상태 (레거시 debounce 300ms 동일)
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<UserHit[]>([]);
  const [searching, setSearching] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // 목록 검색
  const [listQ, setListQ] = React.useState("");

  const runSearch = React.useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/web/admin/users/search?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        // apiSuccess → snake_case 변환. data.users 접근(레거시 동일·방어 hedge)
        const users: UserHit[] = json?.data?.users ?? json?.users ?? [];
        setHits(users);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const onQueryChange = (v: string) => {
    setQuery(v);
    setSelectedUser(null); // 다시 입력하면 선택 해제
    runSearch(v);
  };

  const pickUser = (u: UserHit) => {
    setSelectedUser(u);
    setHits([]);
    setQuery(u.nickname || u.name || `#${u.id}`);
  };

  // mvp_quote 카테고리는 quote 필드, 그 외는 comment 필드
  const isQuoteCat = category === "mvp_quote";
  const multiSlot = SEASON_AWARD_MULTI_SLOT[category];

  // 목록 검색 필터 (시리즈/카테고리/수상자/코멘트 부분일치)
  const filtered = awards.filter((a) => {
    if (!listQ.trim()) return true;
    const catLabel = SEASON_AWARD_CATEGORY_LABELS[a.category as SeasonAwardCategory] ?? a.category;
    const recipient = a.recipientName ?? a.teamName ?? "";
    const commentText = a.quote ?? a.comment ?? "";
    const seriesText = a.seriesName ?? (a.seasonYear ? String(a.seasonYear) : "전체");
    return `${seriesText} ${catLabel} ${recipient} ${commentText}`.toLowerCase().includes(listQ.trim().toLowerCase());
  });

  // 표 셀 렌더 — DataRow 를 SerializedAward 로 복원
  const renderCell = (row: DataRow, key: string) => {
    const a = row as unknown as SerializedAward;
    switch (key) {
      case "series":
        return <span style={{ color: "var(--ink)" }}>{a.seriesName ?? (a.seasonYear ? `${a.seasonYear}` : "전체")}</span>;
      case "category":
        return (
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>
            {SEASON_AWARD_CATEGORY_LABELS[a.category as SeasonAwardCategory] ?? a.category}
          </span>
        );
      case "recipient":
        return <span style={{ color: "var(--ink)" }}>{a.recipientName ?? a.teamName ?? "—"}</span>;
      case "comment":
        return <span style={{ color: "var(--ink-mute)" }}>{a.quote ?? a.comment ?? "—"}</span>;
      case "order":
        return <span style={{ color: "var(--ink-soft)" }}>{a.displayOrder}</span>;
      case "delete":
        return (
          // 기존 삭제 server action 그대로 호출 + router.refresh
          <form
            action={async (fd) => {
              await deleteAction(fd);
              router.refresh();
            }}
          >
            <input type="hidden" name="id" value={a.id} />
            <button
              type="submit"
              aria-label="삭제"
              style={{ color: "var(--danger)", cursor: "pointer", background: "transparent", border: 0, display: "inline-flex" }}
            >
              <Icon name="trash-2" size={16} />
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 콘텐츠"
        title="시즌 시상"
        sub={`전체 ${awards.length}건 — 시리즈와 카테고리를 고르고 수상 선수를 검색해 지정합니다. 승인 절차 없이 즉시 반영됩니다.`}
      />

      {/* 입력 폼 카드 */}
      <section className="ad-panel" style={{ marginBottom: 18 }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
          <Icon name="circle-plus" size={18} color="var(--primary)" /> 시즌 시상 추가
        </h3>

        <form
          action={async (fd) => {
            await upsertAction(fd);
            // 폼 초기화 + 서버 데이터 갱신
            setSelectedUser(null);
            setQuery("");
            setHits([]);
            router.refresh();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 14 }}>
            {/* 시리즈 */}
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={fieldLabel}>시리즈(시즌)</span>
              <select name="series_id" className="ts-select" defaultValue="" style={{ minWidth: 180 }}>
                <option value="">— 미지정(전체) —</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            {/* 연도 */}
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={fieldLabel}>연도</span>
              <input name="season_year" type="number" placeholder="2026" className="ts-input" style={{ width: 110 }} />
            </label>

            {/* 카테고리 */}
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={fieldLabel}>카테고리 *</span>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SeasonAwardCategory)}
                className="ts-select"
                style={{ minWidth: 160 }}
              >
                {SEASON_AWARD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{SEASON_AWARD_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </label>

            {/* 정렬 순서 (다수 슬롯일 때만) */}
            {multiSlot > 1 && (
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={fieldLabel}>순서 (0~{multiSlot - 1})</span>
                <input name="display_order" type="number" min={0} max={multiSlot - 1} defaultValue={0} className="ts-input" style={{ width: 110 }} />
              </label>
            )}
          </div>

          {/* 선수 검색 autocomplete */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", maxWidth: 360 }}>
            <span style={fieldLabel}>수상 선수 (닉네임/이름 검색)</span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="선수 닉네임 또는 이름"
              className="ts-input"
              autoComplete="off"
            />
            {/* 선택된 user_id 를 폼에 박제 (선택 없으면 빈값 → 팀상/코멘트만 시상도 허용) */}
            <input type="hidden" name="user_id" value={selectedUser?.id ?? ""} />

            {/* 검색 결과 드롭다운 */}
            {hits.length > 0 && !selectedUser && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  marginTop: 4,
                  maxHeight: 240,
                  overflowY: "auto",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "var(--sh-md)",
                }}
              >
                {hits.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => pickUser(u)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", padding: "10px 12px", textAlign: "left", background: "transparent", border: 0, cursor: "pointer", color: "var(--ink)" }}
                  >
                    <span style={{ fontWeight: 700 }}>{u.nickname || u.name || `#${u.id}`}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                      {u.name ?? ""} {u.email ? `· ${u.email}` : ""} · #{u.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searching && <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>검색 중…</span>}
            {selectedUser && (
              <span style={{ fontSize: 12, color: "var(--primary)" }}>
                선택됨: {selectedUser.nickname || selectedUser.name} (#{selectedUser.id})
              </span>
            )}
          </div>

          {/* 코멘트 / MVP 코멘트(quote) */}
          {isQuoteCat ? (
            <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 480 }}>
              <span style={fieldLabel}>MVP 코멘트(인용)</span>
              <textarea name="quote" rows={2} placeholder="예: 끝까지 포기하지 않았습니다." className="ts-input" style={{ resize: "vertical" }} />
            </label>
          ) : (
            <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 480 }}>
              <span style={fieldLabel}>코멘트(선택)</span>
              <textarea name="comment" rows={2} placeholder="수상 코멘트" className="ts-input" style={{ resize: "vertical" }} />
            </label>
          )}

          <div>
            <Btn type="submit" icon="save">시상 추가</Btn>
          </div>
        </form>
      </section>

      {/* 목록 검색 */}
      <div className="ad-search" style={{ position: "relative", marginBottom: 12, maxWidth: 360 }}>
        <Icon name="search" size={16} />
        <input
          value={listQ}
          onChange={(e) => setListQ(e.target.value)}
          placeholder="시리즈·카테고리·수상자 검색"
        />
      </div>

      {/* 목록 표 */}
      <DataTable
        cols={COLS}
        rows={filtered as unknown as DataRow[]}
        render={renderCell}
        empty="등록된 시상이 없습니다. 위에서 추가하세요."
      />
    </div>
  );
}

const fieldLabel: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" };
