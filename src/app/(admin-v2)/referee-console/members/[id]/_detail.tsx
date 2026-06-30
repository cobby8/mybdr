"use client";

// ============================================================
// referee-console/members/[id]/_detail.tsx — 심판 상세(클라)
//   레거시 (referee)/referee/admin/members/[id] 박제 → admin-v2 디자인.
//   서버(page)에서 Prisma 직접 READ 한 직렬화 data 를 받아 렌더.
//   ★mutation = adminFetch(기존 API·백엔드 0변경):
//     · GET  /api/web/referee-admin/members/[id]/match            (매칭 후보 검색)
//     · POST /api/web/referee-admin/members/[id]/match { userId } (수동 매칭)
//     · PATCH /api/web/admin/referee-certificates/[id]/verify { verified } (검증 토글)
//   ⚠ cross-association 한계: 위 3 API 는 getAssociationAdmin IDOR 가드라
//     super 자동선택 협회 외 대상은 403 → 실패 시 화면에 사유(message) 가시화(데이터 희박 수용).
//   ★성공 → router.refresh()(서버 재조회). admin-v2 키트·var(--*)만 — 하드코딩 색 0.
//   ★서류(RefereeDocument OCR) 관리는 이번 포팅 제외 — 후속(보고).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { PageHead, Btn, Badge, Icon, Empty } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";
// ★순수 포맷 타입은 _referee-format(server import 무유입)에서 가져온다 — RSC 경계 위반 방지.
import type { Tone } from "../../_referee-format";

// ── 서버 page 에서 넘어오는 직렬화 data 타입(BigInt/Date 없음) ──
export type RfDetailData = {
  id: string;
  name: string;
  matchStatus: "matched" | "unmatched";
  profile: {
    userName: string | null;
    userPhone: string | null;
    userEmail: string | null;
    userBirthDate: string;
    levelLabel: string;
    levelTone: Tone;
    licenseNumber: string | null;
    roleLabel: string;
    statusLabel: string;
    statusTone: string;
    region: string;
    joinedAt: string;
  };
  matching: {
    registeredName: string | null;
    registeredPhone: string | null;
    matchedAt: string | null;
  };
  certificates: {
    id: string;
    title: string;
    issuer: string;
    certNumber: string | null;
    issued: string;
    expire: string;
    verified: boolean;
    badge: string;
    tone: Tone;
  }[];
  assignments: {
    id: string;
    role: string;
    statusLabel: string;
    statusTone: Tone;
    assignedAt: string;
    memo: string | null;
  }[];
  settlements: {
    id: string;
    amount: string;
    statusLabel: string;
    statusTone: Tone;
    date: string;
    memo: string | null;
  }[];
};

// 매칭 후보(adminFetch camel 변환 후).
type MatchCandidate = {
  userId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
};
type MatchResponse = {
  alreadyMatched: boolean;
  candidates: MatchCandidate[];
};

export function MemberDetail({ data }: { data: RfDetailData }) {
  const router = useRouter();
  const { profile, matching } = data;

  // ── 매칭 상태(미매칭 심판) ──
  const [candidates, setCandidates] = React.useState<MatchCandidate[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [matchMsg, setMatchMsg] = React.useState<string | null>(null);

  // ── 자격증 검증 토글 진행 상태 ──
  const [togglingCertId, setTogglingCertId] = React.useState<string | null>(null);
  const [certError, setCertError] = React.useState<string | null>(null);

  const goList = () => router.push("/referee-console/members");

  // 매칭 후보 검색(GET).
  const searchMatch = async () => {
    setSearching(true);
    setMatchMsg(null);
    setCandidates([]);
    try {
      const res = await adminFetch<MatchResponse>(
        `/api/web/referee-admin/members/${data.id}/match`
      );
      if (res.alreadyMatched) {
        setMatchMsg("이미 매칭된 심판입니다.");
      } else if (!res.candidates || res.candidates.length === 0) {
        setMatchMsg("매칭 가능한 유저를 찾지 못했습니다.");
      } else {
        setCandidates(res.candidates);
      }
    } catch (e) {
      setMatchMsg(
        e instanceof AdminApiError ? e.message : "검색에 실패했습니다."
      );
    } finally {
      setSearching(false);
    }
  };

  // 수동 매칭 실행(POST). camel body { userId } → 자동 snake user_id.
  const executeMatch = async (userId: string) => {
    if (!confirm("이 유저를 심판에 매칭하시겠습니까?")) return;
    setExecuting(true);
    setMatchMsg(null);
    try {
      await adminFetch(`/api/web/referee-admin/members/${data.id}/match`, {
        method: "POST",
        body: { userId },
      });
      setMatchMsg("매칭이 완료되었습니다.");
      setCandidates([]);
      router.refresh(); // 서버 재조회 → 매칭 상태 갱신.
    } catch (e) {
      setMatchMsg(
        e instanceof AdminApiError ? e.message : "매칭에 실패했습니다."
      );
    } finally {
      setExecuting(false);
    }
  };

  // 자격증 검증 토글(PATCH). body { verified } 단일단어 — 변환 영향 없음.
  const toggleVerify = async (certId: string, current: boolean) => {
    setTogglingCertId(certId);
    setCertError(null);
    try {
      await adminFetch(
        `/api/web/admin/referee-certificates/${certId}/verify`,
        { method: "PATCH", body: { verified: !current } }
      );
      router.refresh(); // 서버 재조회 → 검증 배지 갱신.
    } catch (e) {
      setCertError(
        e instanceof AdminApiError
          ? e.message
          : "검증 상태 변경에 실패했습니다."
      );
    } finally {
      setTogglingCertId(null);
    }
  };

  return (
    <div>
      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={goList}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-mute)",
          fontFamily: "var(--ff)",
        }}
      >
        <Icon name="arrow-left" size={16} />
        목록으로
      </button>

      <PageHead
        eyebrow="심판 콘솔"
        title={profile.userName ?? data.name}
        sub="심판 프로필·매칭·자격증 검증·배정/정산 기록을 확인합니다."
        actions={
          <Badge tone={data.matchStatus === "matched" ? "ok" : "warn"}>
            {data.matchStatus === "matched" ? "매칭됨" : "미매칭"}
          </Badge>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {/* ── 프로필 ── */}
        <section className="ad-panel" style={{ padding: "16px 18px" }}>
          <SectionTitle>프로필</SectionTitle>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <InfoRow label="이메일" value={profile.userEmail} />
            <InfoRow label="전화번호" value={profile.userPhone} />
            <InfoRow label="생년월일" value={profile.userBirthDate} />
            <InfoRow label="등급" value={<Badge tone={profile.levelTone}>{profile.levelLabel}</Badge>} />
            <InfoRow label="자격번호" value={profile.licenseNumber} />
            <InfoRow label="역할" value={profile.roleLabel} />
            <InfoRow
              label="상태"
              value={
                <span className="ad-statusline">
                  <span className="ad-dot" data-tone={profile.statusTone} />
                  {profile.statusLabel}
                </span>
              }
            />
            <InfoRow label="지역" value={profile.region} />
            <InfoRow label="가입일" value={profile.joinedAt} />
          </div>
        </section>

        {/* ── 매칭 상태 ── */}
        <section className="ad-panel" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <SectionTitle>매칭 상태</SectionTitle>
            <Badge tone={data.matchStatus === "matched" ? "ok" : "warn"}>
              {data.matchStatus === "matched" ? "매칭됨" : "미매칭"}
            </Badge>
          </div>

          {/* 사전 등록 정보 */}
          {(matching.registeredName || matching.registeredPhone) && (
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              <InfoRow label="등록 이름" value={matching.registeredName} />
              <InfoRow label="등록 전화" value={matching.registeredPhone} />
              {matching.matchedAt && <InfoRow label="매칭일" value={matching.matchedAt} />}
            </div>
          )}

          {/* 미매칭 심판: 수동 매칭 UI */}
          {data.matchStatus === "unmatched" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <div>
                <Btn variant="secondary" icon="search" size="sm" disabled={searching} onClick={searchMatch}>
                  {searching ? "검색 중..." : "매칭 후보 검색"}
                </Btn>
              </div>

              {matchMsg && (
                <p style={{ fontSize: 13, color: "var(--ink-mute)", margin: 0 }}>{matchMsg}</p>
              )}

              {candidates.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    background: "var(--card)",
                  }}
                >
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-mute)", margin: 0 }}>
                    매칭 후보 ({candidates.length}명)
                  </p>
                  {candidates.map((c) => (
                    <div key={c.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                          {c.name ?? "이름 없음"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                          {c.phone ?? "-"} · {c.email ?? "-"}
                        </div>
                      </div>
                      <Btn variant="primary" icon="link" size="sm" disabled={executing} onClick={() => executeMatch(c.userId)}>
                        매칭
                      </Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 자격증 ── */}
        <section>
          <SectionTitle>자격증 ({data.certificates.length}건)</SectionTitle>
          {certError && (
            <div
              style={{
                fontSize: 13,
                color: "var(--danger)",
                background: "var(--danger-weak, color-mix(in srgb, var(--danger) 8%, transparent))",
                border: "1px solid var(--danger)",
                borderRadius: 8,
                padding: "10px 12px",
                margin: "12px 0 0",
              }}
            >
              {certError}
            </div>
          )}
          {data.certificates.length === 0 ? (
            <div style={{ marginTop: 12 }}>
              <Empty icon="award" title="등록된 자격증이 없습니다" />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {data.certificates.map((c) => (
                <div
                  key={c.id}
                  className="ad-panel"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{c.title}</span>
                      <Badge tone={c.tone}>{c.badge}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
                      {c.issuer} · {c.issued}
                      {c.certNumber ? ` · ${c.certNumber}` : ""}
                      {c.expire !== "—" ? ` · 만료 ${c.expire}` : ""}
                    </div>
                  </div>
                  {/* 검증 토글(PATCH) — cross-assoc 403 시 certError 노출. */}
                  <Btn
                    variant={c.verified ? "secondary" : "primary"}
                    icon={c.verified ? "x" : "badge-check"}
                    size="sm"
                    disabled={togglingCertId === c.id}
                    onClick={() => toggleVerify(c.id, c.verified)}
                  >
                    {c.verified ? "검증 취소" : "검증"}
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 최근 배정 ── */}
        <section>
          <SectionTitle>최근 배정 ({data.assignments.length}건)</SectionTitle>
          {data.assignments.length === 0 ? (
            <div style={{ marginTop: 12 }}>
              <Empty icon="inbox" title="배정 기록이 없습니다" />
            </div>
          ) : (
            <div className="ad-panel" style={{ marginTop: 12, padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--ink-mute)" }}>
                    <Th>역할</Th>
                    <Th>상태</Th>
                    <Th>배정일</Th>
                    <Th>메모</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.assignments.map((a) => (
                    <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <Td strong>{a.role}</Td>
                      <Td>
                        <Badge tone={a.statusTone}>{a.statusLabel}</Badge>
                      </Td>
                      <Td muted>{a.assignedAt}</Td>
                      <Td muted>{a.memo ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 최근 정산 ── */}
        <section>
          <SectionTitle>최근 정산 ({data.settlements.length}건)</SectionTitle>
          {data.settlements.length === 0 ? (
            <div style={{ marginTop: 12 }}>
              <Empty icon="inbox" title="정산 기록이 없습니다" />
            </div>
          ) : (
            <div className="ad-panel" style={{ marginTop: 12, padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--ink-mute)" }}>
                    <Th>금액</Th>
                    <Th>상태</Th>
                    <Th>지급일</Th>
                    <Th>메모</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.settlements.map((s) => (
                    <tr key={s.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <Td strong mono>{s.amount}</Td>
                      <Td>
                        <Badge tone={s.statusTone}>{s.statusLabel}</Badge>
                      </Td>
                      <Td muted>{s.date}</Td>
                      <Td muted>{s.memo ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── 하위 표시 컴포넌트 ──

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.04em", color: "var(--ink-mute)", textTransform: "uppercase" }}>
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{ width: 76, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
        {value == null || value === "" ? "—" : value}
      </span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700 }}>
      {children}
    </th>
  );
}

function Td({
  children,
  strong,
  muted,
  mono,
}: {
  children: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: "10px 14px",
        color: muted ? "var(--ink-mute)" : "var(--ink)",
        fontWeight: strong ? 700 : 400,
        fontFamily: mono ? "var(--ff-mono)" : "var(--ff)",
      }}
    >
      {children}
    </td>
  );
}
