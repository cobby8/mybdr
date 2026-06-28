"use client";

// ============================================================
// operate/[id]/_site-panel.tsx — 사이트 패널 (R4-D · Toss 관리 화면)
//   정본 참조: Dev/design/BDR v2.41-admin-toss/panels-ops.jsx (SitePanel)
//   - 이 패널 자체 = Toss(관리 UI). "방문하기"가 가리키는 공개 사이트(BDR 13룰)는
//     별도 트랙(PR-5) — 여기선 링크만.
//   - 데이터 = TournamentSite(서버 READ → props): subdomain·isPublished·primaryColor.
//   - mutation = adminFetch 기존 엔드포인트(백엔드 0변경):
//       · 설정 저장/생성 PATCH  /api/web/tournaments/[id]/site  {subdomain,primaryColor}
//       · 발행/비공개  POST     /api/web/tournaments/[id]/site/publish  {publish}
//   - 공개 URL = https://{subdomain}.mybdr.kr (site-panel.tsx publicUrl 동일).
//   className(ts-*/ct-*/ops-*)·토큰은 정본 verbatim(관리자 Toss).
//
//   ⚠️ 의도적 deviation(보고):
//     ① 정본 3-step 위자드(템플릿→색상→발행)의 "템플릿 갤러리"는 실 템플릿 카탈로그
//        엔드포인트 부재 → 생략(mock 템플릿 금지). 핵심(주소·색·발행·방문)만 실배선.
//     ② 발행 게이트 실패(PUBLISH_GATE_FAILED) = 서버 검증 메시지 표시(누락 항목 상세는
//        adminFetch 가 extra 미추출 → 메시지만 노출).
//     ③ 색상 = 네이티브 color input(실 primaryColor 저장 — 하드코딩 팔레트 회피).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, useAdminShell } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

export type SiteData = {
  exists: boolean;
  subdomain: string | null;
  isPublished: boolean;
  primaryColor: string | null;
  siteName: string | null;
  hasTemplate: boolean;
};

function errMsg(e: unknown): string {
  if (e instanceof AdminApiError) return e.message || "요청을 처리하지 못했습니다";
  return "요청을 처리하지 못했습니다";
}
const sanitizeSub = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, "");
const DEFAULT_COLOR = "#E53E3E"; // TournamentSite.primary_color 스키마 기본값

export function SitePanel({
  tournamentId,
  data,
}: {
  tournamentId: string;
  data: SiteData;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();

  const [sub, setSub] = React.useState(data.subdomain ?? "");
  const [color, setColor] = React.useState(data.primaryColor ?? DEFAULT_COLOR);
  const [published, setPublished] = React.useState(data.isPublished);
  const [exists, setExists] = React.useState(data.exists);
  const [busy, setBusy] = React.useState(false);

  // props 갱신 동기화(router.refresh 후)
  React.useEffect(() => {
    setSub(data.subdomain ?? "");
    setColor(data.primaryColor ?? DEFAULT_COLOR);
    setPublished(data.isPublished);
    setExists(data.exists);
  }, [data.subdomain, data.primaryColor, data.isPublished, data.exists]);

  const url = sub ? `https://${sub}.mybdr.kr` : "";
  const dirty = sub !== (data.subdomain ?? "") || color !== (data.primaryColor ?? DEFAULT_COLOR);

  // 설정 저장/생성(PATCH /site)
  const saveSettings = async () => {
    if (!sub.trim() || busy) return;
    setBusy(true);
    try {
      // ★ site PATCH 라우트가 body.primaryColor(camelCase)를 raw 로 읽음
      //   → rawBody:true(camel→snake 변환 우회). 변환 시 primary_color 가 되어 무시됨.
      await adminFetch(`/api/web/tournaments/${tournamentId}/site`, {
        method: "PATCH",
        body: { subdomain: sub.trim(), primaryColor: color },
        rawBody: true,
      });
      setExists(true);
      toast("사이트 설정을 저장했습니다");
      router.refresh();
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // 발행 / 비공개 전환(POST /site/publish)
  const togglePublish = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await adminFetch(`/api/web/tournaments/${tournamentId}/site/publish`, {
        method: "POST",
        body: { publish: next },
      });
      setPublished(next);
      toast(next ? "사이트를 공개했습니다" : "비공개로 전환했습니다");
      router.refresh();
    } catch (e) {
      // 발행 게이트 실패 등 — 서버 검증 메시지 표시
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 발행 상태 배너 */}
      {published ? (
        <div className="ts-card ts-card--flat" style={{ borderColor: "var(--ok)" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ok)" }}>● 사이트 공개 중</p>
              <p style={{ fontFamily: "var(--ff-mono)", fontWeight: 700, marginTop: 2 }}>{url}</p>
              <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 3 }}>
                참가팀·관중에게 공개되는 대회 페이지입니다.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="secondary"
                size="sm"
                iconRight="arrow-up-right"
                onClick={() => url && window.open(url, "_blank", "noopener")}
              >
                방문하기
              </Btn>
              <Btn variant="danger" size="sm" onClick={() => togglePublish(false)} disabled={busy}>
                비공개 전환
              </Btn>
            </div>
          </div>
        </div>
      ) : (
        <div className="ops-note" style={{ marginTop: 0 }}>
          <Icon name="info" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} />
          <span>
            {exists ? (
              <>
                사이트가 <b>비공개</b> 상태입니다. 주소·색상을 설정한 뒤 공개하면 참가팀에게 노출됩니다.
              </>
            ) : (
              <>
                아직 사이트가 생성되지 않았습니다. 대회 주소를 정하고 <b>설정 저장</b>하면 사이트가 만들어집니다.
              </>
            )}
          </span>
        </div>
      )}

      {/* 설정(주소 / 색상) */}
      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>사이트 설정</h3>
            <p>대회 주소와 대표 색상을 설정합니다.</p>
          </div>
        </div>

        <label className="ts-field" style={{ marginTop: 10 }}>
          <span className="ts-field__label">대회 주소 *</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--grey-100)",
              borderRadius: "var(--radius-input)",
              overflow: "hidden",
            }}
          >
            <input
              className="ts-input"
              style={{ background: "transparent", minWidth: 0, flex: 1 }}
              value={sub}
              onChange={(e) => setSub(sanitizeSub(e.target.value))}
              placeholder="대회-주소"
            />
            <span
              style={{
                fontSize: 14,
                color: "var(--ink-mute)",
                whiteSpace: "nowrap",
                padding: "0 14px 0 1px",
                fontFamily: "var(--ff-mono)",
              }}
            >
              .mybdr.kr
            </span>
          </div>
          {sub && (
            <span className="ts-field__hint">
              https://<b style={{ color: "var(--primary)" }}>{sub}</b>.mybdr.kr
            </span>
          )}
        </label>

        <label className="ts-field">
          <span className="ts-field__label">대표 색상</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_COLOR}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: 48,
                height: 40,
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--card)",
                cursor: "pointer",
                padding: 2,
              }}
            />
            <span style={{ fontFamily: "var(--ff-mono)", fontSize: 13, color: "var(--ink-soft)" }}>
              {color}
            </span>
          </div>
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "var(--ink-mute)", alignSelf: "center" }}>
            {exists ? "공개 전 언제든 변경할 수 있습니다." : "설정 저장 시 사이트가 생성됩니다."}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              onClick={saveSettings}
              icon="check"
              {...(sub.trim() && dirty && !busy ? {} : { disabled: true })}
            >
              설정 저장
            </Btn>
            {!published && exists && (
              <Btn
                onClick={() => togglePublish(true)}
                icon="rocket"
                {...(sub.trim() && !dirty && !busy ? {} : { disabled: true })}
              >
                공개하기
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
