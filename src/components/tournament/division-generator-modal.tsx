"use client";

import { useState } from "react";
import {
  GENDERS_LIST,
  CATEGORIES_LIST,
  DIVISIONS_BY_CATEGORY,
  YOUTH_AGES,
  buildYouthDivisionCodes,
  type GenderCode,
  type CategoryCode,
} from "@/lib/constants/divisions";

/**
 * 종별 생성기 모달 (BDR-join-v1 스타일)
 *
 * 단계:
 *   STEP 1. 성별 선택
 *   STEP 2. 종별 템플릿 선택
 *   STEP 3. 디비전 선택
 *   STEP 4. 연령 선택 (category === "youth" 시에만 노출 — 2026-05-15 사용자 결재)
 *
 * "생성하기" 버튼으로 선택된 (디비전 × 연령) cross-product 결합 코드를 위자드에 반환.
 *   - youth + 연령 선택 시: ["i2-U11", "i2-U12", "i3-U11", "i3-U12"] 형식
 *   - 그 외: ["i2"] 단독 (기존 동작 보존)
 *
 * format/settings 는 본 모달에서 결정 X → 종별 관리 페이지 (Phase 3.5) 에서 row 단위 편집.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (categories: Record<string, string[]>) => void;
}

export function DivisionGeneratorModal({ open, onClose, onApply }: Props) {
  const [gender, setGender] = useState<GenderCode>("male");
  const [category, setCategory] = useState<CategoryCode>("general");
  const [selectedDivs, setSelectedDivs] = useState<string[]>([]);
  // 2026-05-15 — 유청소년 연령 옵션 (Q1=b: U7~U18 / Q4=b: 1개 이상 선택 cross-product)
  const [selectedAges, setSelectedAges] = useState<string[]>([]);

  if (!open) return null;

  const divisions = DIVISIONS_BY_CATEGORY[gender]?.[category] ?? [];
  // youth 종별 + 디비전 1개 이상 선택 시에만 STEP 4 노출 (UX: 디비전 먼저 선택 유도)
  const showAgeStep = category === "youth" && selectedDivs.length > 0;
  // 생성 가능 여부 — youth = 디비전+연령 둘 다 필요 / 그 외 = 디비전만 필요
  const canCreate =
    selectedDivs.length > 0 &&
    (category !== "youth" || selectedAges.length > 0);
  // 미리보기 생성될 row 개수 (UX: 사용자가 cross-product 결과 직감)
  const previewCount =
    category === "youth"
      ? selectedDivs.length * Math.max(selectedAges.length, 1)
      : selectedDivs.length;

  function toggleDiv(key: string) {
    setSelectedDivs((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  }

  function toggleAge(age: string) {
    setSelectedAges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  }

  function handleCreate() {
    if (!canCreate) return;
    // youth = cross-product (i2 × U11, U12 → i2-U11, i2-U12) / 그 외 = 디비전 단독
    const codes =
      category === "youth"
        ? buildYouthDivisionCodes(selectedDivs, selectedAges)
        : [...selectedDivs];
    const catInfo = CATEGORIES_LIST.find((c) => c.key === category);
    const label = catInfo?.label ?? category;
    onApply({ [label]: codes });
    // 초기화
    setSelectedDivs([]);
    setSelectedAges([]);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="mx-4 w-full max-w-md overflow-hidden rounded-md border-l-4 border-[var(--color-primary)]"
        style={{ backgroundColor: "var(--color-card)", boxShadow: "0 0 30px rgba(0,0,0,0.5)" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-primary)" }}>
              layers
            </span>
            <h3 className="text-lg font-black uppercase tracking-wider pr-1" style={{ color: "var(--color-text-primary)" }}>
              새 종별 추가
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface)]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* STEP 1: 성별 선택 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
              <span className="material-symbols-outlined align-middle text-sm mr-1">wc</span>
              STEP 1. 성별 선택
            </p>
            <div
              className="flex rounded-sm overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              {GENDERS_LIST.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => {
                    setGender(g.key);
                    setSelectedDivs([]);
                    setSelectedAges([]); // 2026-05-15 STEP 4 — 성별 변경 시 연령도 초기화
                  }}
                  className="flex-1 py-3 text-[12px] font-black uppercase tracking-widest transition-all"
                  style={
                    gender === g.key
                      ? { backgroundColor: "var(--color-primary)", color: "#fff" }
                      : { color: "var(--color-text-muted)" }
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: 종별 선택 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
              <span className="material-symbols-outlined align-middle text-sm mr-1">category</span>
              STEP 2. 종별 템플릿
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES_LIST.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setCategory(cat.key);
                    setSelectedDivs([]);
                    setSelectedAges([]); // 2026-05-15 STEP 4 — 종별 변경 시 연령도 초기화
                  }}
                  className="rounded-sm px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all"
                  style={
                    category === cat.key
                      ? { backgroundColor: "var(--color-primary)", color: "#fff" }
                      : { backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: 디비전 선택 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
              <span className="material-symbols-outlined align-middle text-sm mr-1">tune</span>
              STEP 3. 디비전 선택
              {selectedDivs.length > 0 && (
                <span className="ml-2 font-bold" style={{ color: "var(--color-primary)" }}>
                  ({selectedDivs.length}개)
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {divisions.map((div) => {
                const active = selectedDivs.includes(div.key);
                return (
                  <button
                    key={div.key}
                    type="button"
                    onClick={() => toggleDiv(div.key)}
                    className="flex items-center gap-1 rounded-sm px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all border"
                    style={
                      active
                        ? {
                            borderColor: "var(--color-primary)",
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
                            color: "var(--color-primary)",
                          }
                        : {
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-surface)",
                            color: "var(--color-text-secondary)",
                          }
                    }
                  >
                    {active && (
                      <span className="material-symbols-outlined text-sm">check</span>
                    )}
                    {div.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: 연령 선택 (유청소년만 / 디비전 1개 이상 선택 후 노출) */}
          {showAgeStep && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
                <span className="material-symbols-outlined align-middle text-sm mr-1">cake</span>
                STEP 4. 연령 선택
                {selectedAges.length > 0 && (
                  <span className="ml-2 font-bold" style={{ color: "var(--color-primary)" }}>
                    ({selectedAges.length}개)
                  </span>
                )}
                <span className="ml-2 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  · 디비전 × 연령 cross-product 으로 {selectedDivs.length * Math.max(selectedAges.length, 1)}개 종별 생성
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {YOUTH_AGES.map((age) => {
                  const active = selectedAges.includes(age);
                  return (
                    <button
                      key={age}
                      type="button"
                      onClick={() => toggleAge(age)}
                      className="flex items-center gap-1 rounded-sm px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all border"
                      style={
                        active
                          ? {
                              borderColor: "var(--color-primary)",
                              backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
                              color: "var(--color-primary)",
                            }
                          : {
                              borderColor: "var(--color-border)",
                              backgroundColor: "var(--color-surface)",
                              color: "var(--color-text-secondary)",
                            }
                      }
                    >
                      {active && (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 하단 생성 버튼 */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canCreate}
          className="flex w-full items-center justify-center gap-2 py-4 text-[13px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-40"
          style={{ backgroundColor: canCreate ? "var(--color-accent, #191F28)" : "var(--color-text-disabled)" }}
        >
          생성하기
          {canCreate && (
            <span
              className="rounded-md px-2 py-0.5 text-xs"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              {previewCount}개 종별
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
