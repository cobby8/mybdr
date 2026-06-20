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

      {/* 기존 시상 목록 */}
      <div className="overflow-x-auto admin-table-wrap">
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">시리즈</th>
              <th className="px-5 py-4 font-medium">카테고리</th>
              <th className="px-5 py-4 font-medium">수상 선수/팀</th>
              <th className="px-5 py-4 font-medium">코멘트</th>
              <th className="w-[80px] px-5 py-4 font-medium">순서</th>
              <th className="w-[80px] px-5 py-4 font-medium">삭제</th>
            </tr>
          </thead>
          <tbody>
            {awards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                  등록된 시상이 없습니다. 위에서 추가하세요.
                </td>
              </tr>
            ) : (
              awards.map((a) => {
                const catLabel =
                  SEASON_AWARD_CATEGORY_LABELS[a.category as SeasonAwardCategory] ?? a.category;
                const recipient =
                  a.recipientName ?? a.teamName ?? "—";
                const commentText = a.quote ?? a.comment ?? "";
                return (
                  <tr key={a.id}>
                    <td className="px-5 py-4">{a.seriesName ?? (a.seasonYear ? `${a.seasonYear}` : "전체")}</td>
                    <td className="px-5 py-4">{catLabel}</td>
                    <td className="px-5 py-4">{recipient}</td>
                    <td className="px-5 py-4" style={{ color: "var(--color-text-muted)" }}>
                      {commentText || "—"}
                    </td>
                    <td className="px-5 py-4">{a.displayOrder}</td>
                    <td className="px-5 py-4">
                      <form
                        action={async (fd) => {
                          await deleteAction(fd);
                          router.refresh();
                        }}
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          style={{ color: "var(--color-error)", cursor: "pointer", background: "transparent", border: 0 }}
                          aria-label="삭제"
                        >
                          {/* delete → lucide trash-2 (버튼 자체가 아이콘이던 것을 <Icon> 으로 교체) */}
                          <Icon name="trash-2" size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
