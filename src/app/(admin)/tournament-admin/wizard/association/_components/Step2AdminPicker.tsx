"use client";

/**
 * Step2AdminPicker — 사무국장/임원 지정 (Phase 6 PR2, 2026-05-15).
 *
 * 왜:
 *   - 협회 마법사 Step 2 — 기존 user 검색 (Q3 = 이메일 invite 미적용) + role 9 종 선택.
 *   - PR1 `POST /api/web/admin/associations/[id]/admins` Zod 와 정합.
 *
 * 어떻게:
 *   - `/api/web/admin/users/search?q=...` (super_admin 전용 endpoint 재사용) 호출.
 *   - 검색 input + debounce 350ms (입력 즉시 호출 시 운영 DB 부하 ↑).
 *   - 결과 list 클릭 시 user_id + user_label 박제.
 *   - role select 9 종 (ASSOCIATION_ADMIN_ROLE_OPTIONS) — default secretary_general.
 */

import { useState, useEffect, useRef } from "react";
import type { AssociationStep2Data } from "@/lib/tournaments/association-wizard-types";
import { ASSOCIATION_ADMIN_ROLE_OPTIONS } from "@/lib/tournaments/association-wizard-constants";

export interface Step2AdminPickerProps {
  data: AssociationStep2Data;
  onChange: (next: AssociationStep2Data) => void;
}

// 검색 결과 user 1건 — search route 응답 shape 박제.
interface SearchedUser {
  id: string;
  nickname: string;
  email: string;
  name: string | null;
}

// 토스 스타일 인풋 — 일반 마법사와 동일 토큰.
const inputCls =
  "w-full rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

export function Step2AdminPicker({ data, onChange }: Step2AdminPickerProps) {
  // 검색 query — input 박제용 (data 와 분리: 검색은 보조 상태, 최종 user_id 만 draft 박제).
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);
  // debounce 처리 — 350ms 입력 멈추면 API 호출 (운영 DB 부하 가드).
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // query 변경 시 debounce 후 검색 API 호출.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/web/admin/users/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json = await res.json();
        // apiSuccess 자동 snake_case 변환 → data.users 가 직접 배열.
        const users: SearchedUser[] =
          (json.data?.users ?? json.users ?? []) as SearchedUser[];
        setResults(users);
      } catch {
        // 네트워크 실패 시 빈 결과 — 사용자가 다시 입력 가능.
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // user 선택 시 draft 박제.
  function selectUser(u: SearchedUser) {
    onChange({
      ...data,
      user_id: u.id,
      // UI 표시 라벨 — nickname + email (없으면 nickname 만).
      user_label: u.email ? `${u.nickname} (${u.email})` : u.nickname,
    });
    // 검색 결과 닫기 — 선택 후 다시 검색 가능.
    setResults([]);
    setQuery("");
  }

  // 선택 해제 — 다른 사용자로 변경 시.
  function clearSelection() {
    onChange({ ...data, user_id: null, user_label: "" });
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
        <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
          person_add
        </span>
        사무국장 지정
      </h2>

      <p className="text-sm text-[var(--color-text-muted)]">
        기존 회원 중에서 검색하세요. 이메일·닉네임·회원ID 로 검색 가능.
      </p>

      {/* 선택된 사용자 표시 — 박제된 user_id 가 있을 때만 노출 */}
      {data.user_id && (
        <div className="rounded-md border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-base text-[var(--color-info)]">
                check_circle
              </span>
              <span className="font-bold">{data.user_label}</span>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-[var(--color-text-muted)] underline hover:text-[var(--color-text-secondary)]"
            >
              변경
            </button>
          </div>
        </div>
      )}

      {/* 검색 input — 선택 안 된 경우만 노출 (선택 후 변경 클릭 시 다시 노출) */}
      {!data.user_id && (
        <div>
          <label className={labelCls}>회원 검색</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={inputCls}
            placeholder="이메일, 닉네임, 또는 회원 ID"
          />

          {/* 검색 진행 표시 */}
          {searching && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              검색 중...
            </p>
          )}

          {/* 결과 list — 최대 20건 */}
          {!searching && results.length > 0 && (
            <ul className="mt-2 max-h-64 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => selectUser(u)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-border)]"
                  >
                    <span className="material-symbols-outlined text-base text-[var(--color-text-muted)]">
                      person
                    </span>
                    <span className="flex-1 text-[var(--color-text-primary)]">
                      <span className="font-bold">{u.nickname}</span>
                      {u.email && (
                        <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                          {u.email}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 빈 결과 안내 (query 있고 검색 끝났는데 결과 0) */}
          {!searching && query.trim() && results.length === 0 && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              일치하는 회원이 없습니다.
            </p>
          )}
        </div>
      )}

      {/* role select — 9 종 */}
      <div>
        <label className={labelCls}>역할 *</label>
        <select
          value={data.role}
          onChange={(e) =>
            onChange({
              ...data,
              role: e.target.value as AssociationStep2Data["role"],
            })
          }
          className={inputCls}
        >
          {ASSOCIATION_ADMIN_ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          기본 = 사무국장. 협회 사무를 총괄하는 운영자 1인을 지정하세요.
        </p>
      </div>

      {/* 안내 — 1인 1협회 제약 */}
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 text-xs text-[var(--color-text-muted)]">
        <p className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            info
          </span>
          <span>
            한 회원은 한 협회에만 소속됩니다. 이미 다른 협회 관리자인 회원을
            선택하면 본 협회로 이동됩니다.
          </span>
        </p>
      </div>
    </div>
  );
}
