"use client";

// =====================================================================
// categories-content.tsx — 종별 마스터 관리 (admin_categories CRUD UI)
//   시안: Dev/design/BDR-current/_handoff-admin-toss-P0/design-files/CategoryMaster.jsx
//
//   ⚠ 운영 연동 변경점 (시안의 로컬 mock setMaster → 실 API):
//   - 칩 add/remove 마다 즉시 PATCH(채터링) 회피 → 카드별 "변경사항 저장" 버튼으로
//     name/divisions/ages 를 묶어 1회 PATCH.
//   - fetch 응답은 apiSuccess 의 snake (sort_order) — 접근자 snake 로 통일.
//   - 새 종별 추가 = POST, 삭제 = DELETE(확인 모달), 로딩/에러 상태 노출.
//   - Toss 스킨: @/components/admin-toss 키트(Icon/Btn/Badge/Modal) + .ts-* 클래스 재사용.
// =====================================================================

import React from "react";
import { Icon, Btn, Badge, Modal } from "@/components/admin-toss";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// 클라/서버 공통 종별 형태 — apiSuccess snake 와 page.tsx 직렬화에 정합(sort_order).
export type CategoryItem = {
  id: string;
  name: string;
  divisions: string[];
  ages: string[];
  sort_order: number;
};

const API = "/api/web/admin/categories";

// ── 공용 fetch 헬퍼 — apiError 응답(error/code) 을 throw 로 표면화 ──
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 서버 apiError 는 { error, code } — 사용자 메시지로 던진다.
    const msg =
      typeof json?.error === "string" ? json.error : "요청에 실패했습니다";
    throw new Error(msg);
  }
  return json as T;
}

// =====================================================================
// TagInput — 칩(태그) 추가/삭제 (시안 동일). kind="age" 면 보라톤(.ts-chip--age).
// =====================================================================
function TagInput({
  items,
  onAdd,
  onRemove,
  kind,
  placeholder,
}: {
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  kind?: "age";
  placeholder?: string;
}) {
  const [val, setVal] = React.useState("");
  const commit = () => {
    const v = val.trim();
    if (v) {
      onAdd(v);
      setVal("");
    }
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          minHeight: 34,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {items.map((it) => (
          <span
            key={it}
            className={
              "ts-chip ts-chip--tag" + (kind === "age" ? " ts-chip--age" : "")
            }
          >
            {it}
            <button type="button" onClick={() => onRemove(it)} aria-label={`${it} 삭제`}>
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: 13, color: "var(--ink-dim)" }}>없음</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="ts-input"
          style={{ padding: "10px 14px", fontSize: 14 }}
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            // 한글 IME 조합 중 Enter는 무시 — 조합 중 commit 하면 마지막 글자 잘림(데이터 손상)
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <Btn variant="secondary" size="sm" icon="plus" onClick={commit}>
          추가
        </Btn>
      </div>
    </div>
  );
}

// =====================================================================
// CategoryCard — 종별 1장. 로컬 편집 후 "변경사항 저장" 버튼으로 1회 PATCH.
// =====================================================================
function CategoryCard({
  item,
  onSaved,
  onDeleted,
  onError,
}: {
  item: CategoryItem;
  onSaved: (next: CategoryItem) => void;
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
}) {
  // 로컬 편집 state — 칩/이름 변경은 여기에 쌓고, 저장 시점에 한 번에 PATCH.
  const [name, setName] = React.useState(item.name);
  const [divisions, setDivisions] = React.useState<string[]>(item.divisions);
  const [ages, setAges] = React.useState<string[]>(item.ages);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // 서버 데이터(item) 가 바뀌면(저장 성공 후 재동기화) 로컬도 갱신.
  React.useEffect(() => {
    setName(item.name);
    setDivisions(item.divisions);
    setAges(item.ages);
  }, [item]);

  // dirty 판정 — 이름/디비전/연령 중 하나라도 변하면 저장 버튼 활성.
  const dirty =
    name.trim() !== item.name ||
    JSON.stringify(divisions) !== JSON.stringify(item.divisions) ||
    JSON.stringify(ages) !== JSON.stringify(item.ages);

  // 칩 add — 중복은 무시(서버 Zod 도 중복 차단하지만 UI 선차단).
  const addItem = (field: "divisions" | "ages", v: string) => {
    if (field === "divisions") {
      if (divisions.includes(v)) return;
      setDivisions([...divisions, v]);
    } else {
      if (ages.includes(v)) return;
      setAges([...ages, v]);
    }
  };
  const removeItem = (field: "divisions" | "ages", v: string) => {
    if (field === "divisions") setDivisions(divisions.filter((i) => i !== v));
    else setAges(ages.filter((i) => i !== v));
  };

  // 저장 — name/divisions/ages 묶어 1 PATCH (채터링 회피).
  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const next = await apiFetch<CategoryItem>(`${API}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), divisions, ages }),
      });
      onSaved(next);
    } catch (e) {
      onError(e instanceof Error ? e.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  // 삭제 — 확인 모달 후 DELETE.
  const remove = async () => {
    setDeleting(true);
    try {
      await apiFetch<{ id: string }>(`${API}/${item.id}`, { method: "DELETE" });
      onDeleted(item.id);
    } catch (e) {
      onError(e instanceof Error ? e.message : "삭제에 실패했습니다");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="ts-card">
      {/* 헤더 — 이름 인라인 편집 + 디비전/연령 개수 배지 + 삭제 버튼 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="종별 이름"
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: "var(--ink)",
            border: 0,
            background: "transparent",
            outline: "none",
            fontFamily: "var(--ff)",
            letterSpacing: "-0.02em",
            flex: 1,
            minWidth: 0,
          }}
        />
        <Badge tone="grey">
          {divisions.length} 디비전
          {ages.length ? ` · ${ages.length} 연령` : ""}
        </Badge>
        <Btn
          variant="ghost"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          style={{ padding: 8 }}
          aria-label="종별 삭제"
        >
          <Icon name="trash-2" size={17} />
        </Btn>
      </div>

      {/* 2열 grid — 디비전(primary) / 연령·옵션(보라) TagInput */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--primary)",
              marginBottom: 12,
            }}
          >
            <Icon name="layout-grid" size={15} /> 디비전
          </div>
          <TagInput
            items={divisions}
            placeholder="추가 (Enter)"
            onAdd={(v) => addItem("divisions", v)}
            onRemove={(v) => removeItem("divisions", v)}
          />
        </div>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              // 연령 라벨 — .ts-chip--age 와 동일 보라톤(시안 #6D5AE6)
              color: "#6D5AE6",
              marginBottom: 12,
            }}
          >
            <Icon name="cake" size={15} /> 연령 / 옵션
          </div>
          <TagInput
            items={ages}
            kind="age"
            placeholder="추가 (Enter)"
            onAdd={(v) => addItem("ages", v)}
            onRemove={(v) => removeItem("ages", v)}
          />
        </div>
      </div>

      {/* 변경사항 저장 — dirty 일 때만 활성(채터링 회피·1 PATCH) */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 18,
        }}
      >
        <Btn
          size="sm"
          icon="save"
          onClick={save}
          disabled={!dirty || saving || !name.trim()}
        >
          {saving ? "저장 중…" : "변경사항 저장"}
        </Btn>
      </div>

      {/* 삭제 확인 모달 — FK 참조 0건이라 기존 대회 무영향 안내 */}
      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="종별 삭제"
        sub={`'${item.name}' 종별을 삭제할까요?`}
        maxWidth={440}
        foot={
          <>
            <Btn
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              취소
            </Btn>
            <Btn variant="danger" onClick={remove} disabled={deleting}>
              {deleting ? "삭제 중…" : "삭제"}
            </Btn>
          </>
        }
      >
        <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          기존 대회에는 영향이 없지만, 대회 생성기 프리셋에서 이 종별이
          사라집니다.
        </div>
      </Modal>
    </div>
  );
}

// =====================================================================
// CategoriesContent — 루트. 새 종별 추가 + 카드 리스트 + 안내 푸터.
// =====================================================================
export function CategoriesContent({ initial }: { initial: CategoryItem[] }) {
  const [list, setList] = React.useState<CategoryItem[]>(initial);
  const [newName, setNewName] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 새 종별 추가 — POST 후 응답을 목록 끝에 append.
  const addCat = async () => {
    const v = newName.trim();
    if (!v || adding) return;
    setAdding(true);
    setError(null);
    try {
      const created = await apiFetch<CategoryItem>(API, {
        method: "POST",
        body: JSON.stringify({ name: v }),
      });
      setList((prev) => [...prev, created]);
      setNewName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가에 실패했습니다");
    } finally {
      setAdding(false);
    }
  };

  // 저장 성공 — 해당 카드 데이터를 서버 응답으로 교체.
  const handleSaved = (next: CategoryItem) =>
    setList((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  // 삭제 성공 — 목록에서 제거.
  const handleDeleted = (id: string) =>
    setList((prev) => prev.filter((c) => c.id !== id));

  return (
    <>
      <AdminPageHeader
        eyebrow="ADMIN · 설정"
        title="종별 관리"
        subtitle="대회 생성 시 불러올 종별·디비전·연령 기본 구성"
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "설정" },
          { label: "종별 관리" },
        ]}
      />

      {/* 에러 배너 — API 실패 시 표면화 */}
      {error && (
        <div
          className="ts-card ts-card--flat"
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--danger)",
          }}
        >
          <Icon name="circle-x" size={18} color="var(--danger)" />
          <span style={{ fontSize: 14 }}>{error}</span>
        </div>
      )}

      {/* 새 종별 추가 카드 */}
      <div className="ts-card" style={{ marginBottom: 20 }}>
        <label className="ts-field__label">새 종별 추가</label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="ts-input"
            value={newName}
            placeholder="일반부 · 대학부 · 유청소년 …"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter는 무시 — 종별명 마지막 글자 잘림 방지
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") addCat();
            }}
            aria-label="새 종별 이름"
          />
          <Btn icon="plus" onClick={addCat} disabled={adding || !newName.trim()}>
            {adding ? "추가 중…" : "추가"}
          </Btn>
        </div>
      </div>

      {/* 종별 카드 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {list.map((c) => (
          <CategoryCard
            key={c.id}
            item={c}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onError={setError}
          />
        ))}
      </div>

      {/* 안내 푸터 (시안 info 박스) */}
      <div
        className="ts-card ts-card--flat"
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--primary-weak)",
          border: 0,
        }}
      >
        <Icon name="info" size={20} color="var(--primary)" />
        <div
          style={{
            fontSize: 13.5,
            color: "var(--ink-soft)",
            lineHeight: 1.5,
          }}
        >
          이 종별 마스터는 운영 Supabase의{" "}
          <b style={{ color: "var(--ink)" }}>admin_categories</b> 와
          연결됩니다. 현재 4종(일반부·유청소년·대학부·시니어)은 기존 데이터 복원
          시드입니다.
        </div>
      </div>
    </>
  );
}
