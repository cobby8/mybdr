"use client";

/**
 * 시즌 시상(P1-b) 관리자 입력 — 클라이언트 본체.
 *
 * 왜 클라이언트:
 *   - 선수 검색 autocomplete(닉네임/이름 입력 → /api/web/admin/users/search fetch → 선택)
 *     인터랙션 필요. 선택 결과를 hidden input(user_id)로 폼에 박제.
 *   - 카테고리 select / 코멘트·quote 입력 / 시리즈 선택은 일반 폼 필드.
 *
 * 어떻게:
 *   - 추가 폼: series·season_year·category·선수검색·코멘트/quote → upsertAction(server action).
 *   - 목록: 기존 시상 표 + 삭제 버튼(deleteAction).
 *   - admin-courts-content.tsx 의 토큰/버튼/표 패턴 동형.
 */

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
// Phase 2A (Toss 전환) — Material Symbols → lucide(<Icon>) 키트
import { Icon } from "@/components/admin-toss";
// v2.40 A3-2a — 통합 콘솔 키트(목록/툴바). 목록 table→DataTable + Toolbar(검색).
//   ⚠ 입력 폼(선수검색 autocomplete)·upsert/delete 액션은 전부 기존 그대로 보존.
import {
  Toolbar,
  DataTable,
  useFilter,
  type Column,
  type FilterableRow,
} from "@/components/admin/console-kit";

import {
  SEASON_AWARD_CATEGORIES,
  SEASON_AWARD_CATEGORY_LABELS,
  SEASON_AWARD_MULTI_SLOT,
  type SeasonAwardCategory,
} from "@/lib/awards/season-award-categories";

// (web)/admin 공용 카드 패턴 (admin-courts-content 동형)
const CARD_CLASS = "rounded-[var(--radius-card)] border";
const CARD_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
  boxShadow: "var(--shadow-card)",
};
const INPUT_CLASS = "rounded-[10px] border px-3 py-2 text-sm outline-none";
const INPUT_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text-primary)",
};

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

// v2.40 A3-2a — useFilter 검색 행 타입(키트 FilterableRow 제약 충족 위해 교차).
//   상태탭 없음 → tab="all" 고정. 검색만 사용(시리즈/카테고리/수상자/코멘트).
//   _search = 검색 대상 텍스트를 합친 단일 필드(소문자 부분일치).
type AwardRow = SerializedAward & { _search: string } & FilterableRow;

// useFilter 검색 필드(컴포넌트 밖 상수 — 매 렌더 새 참조 방지·승인 규약 §3).
const FILTER_FIELDS: (keyof AwardRow)[] = ["_search"];

interface Props {
  seriesList: SeriesOption[];
  awards: SerializedAward[];
  upsertAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function AdminSeasonAwardsContent({
  seriesList,
  awards,
  upsertAction,
  deleteAction,
}: Props) {
  const router = useRouter();

  // 폼 상태
  const [category, setCategory] = useState<SeasonAwardCategory>(SEASON_AWARD_CATEGORIES[0]);
  const [selectedUser, setSelectedUser] = useState<UserHit | null>(null);

  // 선수 검색 autocomplete 상태
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 닉네임/이름 입력 → 디바운스 후 super_admin user 검색 API 호출
  const runSearch = useCallback((q: string) => {
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
        // apiSuccess → snake_case 변환됨. data.users 접근 (route 응답 키 users)
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

  // mvp_quote 카테고리는 quote 필드, 그 외는 comment 필드 강조
  const isQuoteCat = category === "mvp_quote";
  const multiSlot = SEASON_AWARD_MULTI_SLOT[category];

  // v2.40 A3-2a — 목록 검색용 rows 변환. 각 행에 검색 대상 텍스트(_search)를 합쳐 부여.
  //   시리즈명/카테고리라벨/수상자명·팀명/코멘트를 소문자로 합침(useFilter 부분일치).
  const awardRows: AwardRow[] = awards.map((a) => {
    const catLabel =
      SEASON_AWARD_CATEGORY_LABELS[a.category as SeasonAwardCategory] ?? a.category;
    const recipient = a.recipientName ?? a.teamName ?? "";
    const commentText = a.quote ?? a.comment ?? "";
    const seriesText = a.seriesName ?? (a.seasonYear ? String(a.seasonYear) : "전체");
    return {
      ...a,
      _search: `${seriesText} ${catLabel} ${recipient} ${commentText}`.toLowerCase(),
    } as AwardRow;
  });

  // 클라 검색 필터(상태탭 없음 → tab="all" 고정). q 만 사용.
  const { q, setQ, filtered } = useFilter<AwardRow>(awardRows, FILTER_FIELDS);

  // v2.40 A3-2a — 키트 DataTable 컬럼(시리즈/카테고리/수상자/코멘트/순서/삭제).
  //   삭제 컬럼은 deleteAction·router 를 쓰므로 컴포넌트 내부에서 정의(기존 form action 100% 보존).
  const columns: Column<AwardRow>[] = [
    {
      key: "series",
      label: "시리즈",
      width: "140px",
      render: (a) => a.seriesName ?? (a.seasonYear ? `${a.seasonYear}` : "전체"),
    },
    {
      key: "category",
      label: "카테고리",
      width: "120px",
      render: (a) =>
        SEASON_AWARD_CATEGORY_LABELS[a.category as SeasonAwardCategory] ?? a.category,
    },
    {
      key: "recipient",
      label: "수상 선수/팀",
      render: (a) => a.recipientName ?? a.teamName ?? "—",
    },
    {
      key: "comment",
      label: "코멘트",
      hideSm: true,
      render: (a) => (
        <span style={{ color: "var(--color-text-muted)" }}>
          {a.quote ?? a.comment ?? "—"}
        </span>
      ),
    },
    {
      key: "order",
      label: "순서",
      align: "center",
      width: "70px",
      hideSm: true,
      render: (a) => a.displayOrder,
    },
    {
      key: "delete",
      label: "삭제",
      align: "center",
      width: "70px",
      render: (a) => (
        // 기존 삭제 form action 100% 보존(deleteAction + router.refresh).
        <form
          action={async (fd) => {
            await deleteAction(fd);
            router.refresh();
          }}
        >
          <input type="hidden" name="id" value={a.id} />
          <button
            type="submit"
            style={{
              color: "var(--color-error)",
              cursor: "pointer",
              background: "transparent",
              border: 0,
            }}
            aria-label="삭제"
          >
            {/* delete → lucide trash-2 */}
            <Icon name="trash-2" size={16} />
          </button>
        </form>
      ),
    },
  ];

  return (
    <div>
      {/* 입력 폼 */}
      <div className={`${CARD_CLASS} mb-6 p-5`} style={CARD_STYLE}>
        <h2 className="mb-1 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          {/* add_circle → lucide circle-plus */}
          <Icon name="circle-plus" size={16} className="mr-1 align-middle" />
          시즌 시상 추가
        </h2>
        <p className="mb-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          시리즈와 카테고리를 고르고 수상 선수를 검색해 지정합니다. 승인 절차 없이 즉시 반영됩니다.
        </p>

        <form
          action={async (fd) => {
            await upsertAction(fd);
            // 폼 초기화 + 서버 데이터 갱신
            setSelectedUser(null);
            setQuery("");
            setHits([]);
            router.refresh();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-end gap-3">
            {/* 시리즈 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>시리즈(시즌)</label>
              <select name="series_id" className={INPUT_CLASS} style={INPUT_STYLE} defaultValue="">
                <option value="">— 미지정(전체) —</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 연도 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>연도</label>
              <input
                name="season_year"
                type="number"
                placeholder="2026"
                className={`w-24 ${INPUT_CLASS}`}
                style={INPUT_STYLE}
              />
            </div>

            {/* 카테고리 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>카테고리 *</label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SeasonAwardCategory)}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              >
                {SEASON_AWARD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{SEASON_AWARD_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            {/* 정렬 순서 (올스타 5명 등 다수 슬롯일 때) */}
            {multiSlot > 1 && (
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  순서 (0~{multiSlot - 1})
                </label>
                <input
                  name="display_order"
                  type="number"
                  min={0}
                  max={multiSlot - 1}
                  defaultValue={0}
                  className={`w-24 ${INPUT_CLASS}`}
                  style={INPUT_STYLE}
                />
              </div>
            )}
          </div>

          {/* 선수 검색 autocomplete */}
          <div className="flex flex-col gap-1" style={{ position: "relative", maxWidth: 360 }}>
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>수상 선수 (닉네임/이름 검색)</label>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="선수 닉네임 또는 이름"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              autoComplete="off"
            />
            {/* 선택된 user_id 를 폼에 박제 (선택 없으면 빈값 → 팀상/코멘트만 시상도 허용) */}
            <input type="hidden" name="user_id" value={selectedUser?.id ?? ""} />

            {/* 검색 결과 드롭다운 */}
            {hits.length > 0 && !selectedUser && (
              <div
                className={`${CARD_CLASS}`}
                style={{
                  ...CARD_STYLE,
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                {hits.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => pickUser(u)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    <span className="font-semibold">{u.nickname || u.name || `#${u.id}`}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {u.name ?? ""} {u.email ? `· ${u.email}` : ""} · #{u.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>검색 중…</span>
            )}
            {selectedUser && (
              <span className="text-xs" style={{ color: "var(--cafe-blue)" }}>
                선택됨: {selectedUser.nickname || selectedUser.name} (#{selectedUser.id})
              </span>
            )}
          </div>

          {/* 코멘트 / MVP 코멘트(quote) */}
          {isQuoteCat ? (
            <div className="flex flex-col gap-1" style={{ maxWidth: 480 }}>
              <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>MVP 코멘트(인용)</label>
              <textarea
                name="quote"
                rows={2}
                placeholder="예: 끝까지 포기하지 않았습니다."
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1" style={{ maxWidth: 480 }}>
              <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>코멘트(선택)</label>
              <textarea
                name="comment"
                rows={2}
                placeholder="수상 코멘트"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
          )}

          <div>
            <button type="submit" className="btn btn--primary btn--sm">
              {/* save → lucide save */}
              <Icon name="save" size={16} className="mr-1 align-middle" />
              시상 추가
            </button>
          </div>
        </form>
      </div>

      {/* v2.40 A3-2a — 목록 검색 툴바(시리즈/카테고리/수상자/코멘트 부분일치) */}
      <Toolbar search={q} onSearch={setQ} placeholder="시리즈·카테고리·수상자 검색" />

      {/* v2.40 A3-2a — 키트 DataTable (시리즈/카테고리/수상자/코멘트/순서/삭제).
          입력 폼·삭제 server action 보존. 클라 검색 결과(filtered) 표시. */}
      <DataTable<AwardRow>
        keyField="id"
        rows={filtered}
        columns={columns}
        emptyTitle="등록된 시상이 없습니다. 위에서 추가하세요."
      />
    </div>
  );
}
