"use client";

/**
 * 2026-05-09 PR4+PR5 — 매치 라이브 YouTube 영상 운영자 모달.
 *
 * 도메인 컨텍스트 (Dev/live-youtube-embed-2026-05-09.md §4, §6):
 *   - 라이브 페이지 `/live/[id]` 우상단 운영자 edit 버튼 → 본 모달.
 *   - 운영자 (super_admin / organizer / tournamentAdminMember.is_active=true) 만 진입 — API 가 단일 source.
 *
 * 탭 구조 (PR4 + PR5 통합):
 *   1) "수동 입력" — URL 또는 video_id 11자 직접 입력 (PR4)
 *      - "검증" 버튼 → POST /youtube-stream (skipVerify=false) → 미리보기 후 자동 저장
 *      - 현재 등록 영상 있을 시 상단 "삭제" 영역 노출 (DELETE)
 *   2) "자동 검색" — BDR 채널에서 매치 키워드 + 시간 매칭 후보 N건 (PR5)
 *      - 진입 시 GET /youtube-stream/search 자동 호출
 *      - 신뢰도 80점 이상 = 강조(accent border) / 80미만 = dim (사용 가능하지만 약한 시그널)
 *      - "이 영상 사용" 버튼 → POST /youtube-stream (status=auto_verified, skipVerify=true)
 *      - 후보 0건 시 "BDR 채널 매칭 영상 없음" + "수동 입력으로 전환" 버튼
 *
 * 패턴 재사용: MatchJerseyOverrideModal (5/5 PR4) — 백드롭 + 가운데 카드 + ESC + 배경 클릭 + iOS 16px input.
 *
 * 토큰: BDR-current/tokens.css var(--*) 100% / 핑크·살몬·코랄 ❌ / Material Symbols Outlined ✅.
 *
 * 모바일 4 분기점 (5/9 conventions.md):
 *   - 360px : 모달 폭 100% / padding 축소
 *   - 720px : 모달 폭 90% / 카드 폭 자동
 *   - 900px+: 카드 폭 480~520px 고정
 */

import { useCallback, useEffect, useState } from "react";

// 자동 검색 API 응답 — search/route.ts 의 ScoredCandidate 와 1:1 매칭.
// apiSuccess 자동 snake_case 변환 후 클라 수신.
interface SearchCandidate {
  video_id: string;
  title: string;
  thumbnail: string;
  score: number;
  is_live: boolean;
  published_at: string;
  view_count: number;
  score_breakdown: {
    time: number;
    home_team: number;
    away_team: number;
    tournament: number;
    match_code: number;
    round: number;
  };
}

// Q8 결재 — 80점 = 자동 채택 강조 / 50~79 = 후보 dim
const AUTO_THRESHOLD = 80;

export interface MatchYouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  // matchId: number (jersey 모달과 동일 시그니처 — page.tsx 호출부 호환)
  matchId: number;
  // 현재 등록 영상 — 있으면 "삭제" 옵션 노출
  currentVideoId?: string | null;
  currentStatus?: "manual" | "auto_verified" | "auto_pending" | null;
  // 저장/삭제 성공 시 부모 호출 — 라이브 페이지 fetchMatch refetch
  onSave?: () => void;
}

type TabKey = "manual" | "auto";

export function MatchYouTubeModal({
  isOpen,
  onClose,
  tournamentId,
  matchId,
  currentVideoId,
  currentStatus,
  onSave,
}: MatchYouTubeModalProps) {
  // 탭 상태 — 기본 "수동 입력" (PR4 결재)
  const [activeTab, setActiveTab] = useState<TabKey>("manual");

  // 수동 입력 상태
  const [urlInput, setUrlInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 자동 검색 상태 — 진입 시 1회 fetch, cache 5분 (서버측)
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<SearchCandidate[] | null>(null);
  // 사용자가 "이 영상 사용" 클릭 시 적용 중 표시 (POST 진행 중인 video_id)
  const [applyingVideoId, setApplyingVideoId] = useState<string | null>(null);

  // 모달 닫힐 때 폼/검색 결과 reset (재오픈 시 클린 상태)
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("manual");
      setUrlInput("");
      setErrorMsg(null);
      setSuccessMsg(null);
      setSearchError(null);
      setCandidates(null);
      setApplyingVideoId(null);
      setSubmitting(false);
      setSearchLoading(false);
    }
  }, [isOpen]);

  // ESC 키 close — body 키 리스너 (jersey 모달은 백드롭 클릭만 처리, 본 모달은 ESC 추가)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // 자동 검색 — 탭 전환 시 1회 fetch (cache 5분 — 서버에서 보호)
  // 사유: 모달 진입 직후 자동 시작 X (사용자 수동 탭 클릭 시 시작 — quota 절약)
  const fetchCandidates = useCallback(async () => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/matches/${matchId}/youtube-stream/search`,
        { method: "GET", cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) {
        // 503 = YouTube API 미설정 / 429 = rate limit / 403 = 권한
        const msg = typeof data?.error === "string" ? data.error : "자동 검색에 실패했습니다.";
        setSearchError(msg);
        setCandidates([]);
        return;
      }
      // apiSuccess envelope: { success: true, data: { videos, cached } }
      const list = (data?.data?.videos ?? data?.videos ?? []) as SearchCandidate[];
      setCandidates(list);
    } catch {
      setSearchError("네트워크 오류입니다. 잠시 후 다시 시도하세요.");
      setCandidates([]);
    } finally {
      setSearchLoading(false);
    }
  }, [tournamentId, matchId]);

  // 자동 검색 탭 진입 시 후보 fetch (한 번만 — candidates===null 이면 호출)
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab !== "auto") return;
    if (candidates !== null) return; // 이미 한 번 fetch 됨
    void fetchCandidates();
  }, [isOpen, activeTab, candidates, fetchCandidates]);

  if (!isOpen) return null;

  // 수동 입력 — 검증 + 저장 한 번에 (POST skipVerify=false)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMsg("YouTube URL 또는 영상 ID 를 입력하세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/matches/${matchId}/youtube-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtubeUrl: trimmed,
            status: "manual",
            skipVerify: false, // 수동 입력은 실존 검증 필수 (악의적 입력 차단)
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "저장에 실패했습니다.";
        setErrorMsg(msg);
        return;
      }

      setSuccessMsg("영상이 등록되었습니다.");
      // 부모에 알림 → 라이브 페이지 fetchMatch refetch
      onSave?.();
      // 0.6초 뒤 자동 close (사용자가 success 메시지 인지)
      setTimeout(() => onClose(), 600);
    } catch {
      setErrorMsg("네트워크 오류입니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // 자동 검색 후보 적용 — 이미 BDR 채널에서 검증된 영상이라 skipVerify=true
  const handleApplyCandidate = async (candidate: SearchCandidate) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setApplyingVideoId(candidate.video_id);
    try {
      // 80점 이상 = auto_verified / 미만 = auto_pending (운영자 확인 후 채택 의미)
      const status = candidate.score >= AUTO_THRESHOLD ? "auto_verified" : "auto_pending";
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/matches/${matchId}/youtube-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // video_id 11자만 입력 — 서버 extractVideoId 가 직접 입력도 지원
            youtubeUrl: candidate.video_id,
            status,
            skipVerify: true, // 이미 BDR 채널 검증된 영상 — 쿼터 절약
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "저장에 실패했습니다.";
        setErrorMsg(msg);
        return;
      }

      setSuccessMsg("영상이 등록되었습니다.");
      onSave?.();
      setTimeout(() => onClose(), 600);
    } catch {
      setErrorMsg("네트워크 오류입니다. 잠시 후 다시 시도하세요.");
    } finally {
      setApplyingVideoId(null);
    }
  };

  // 등록된 영상 제거 — DELETE
  const handleDelete = async () => {
    // 운영자 실수 방지 — 1회 confirm
    if (!window.confirm("등록된 YouTube 영상을 제거하시겠습니까?")) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/matches/${matchId}/youtube-stream`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "제거에 실패했습니다.";
        setErrorMsg(msg);
        return;
      }
      setSuccessMsg("영상이 제거되었습니다.");
      onSave?.();
      setTimeout(() => onClose(), 600);
    } catch {
      setErrorMsg("네트워크 오류입니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="YouTube 영상 연결"
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        // 백드롭 클릭 시 닫기 (모달 본체 클릭은 stopPropagation)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-md p-5 shadow-lg max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 제목 + 닫기 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">YouTube 영상 연결</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="px-2 py-1 rounded-md hover:opacity-80"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* 현재 등록된 영상 — 있을 때만 노출 (삭제 영역) */}
        {currentVideoId && (
          <div
            className="mb-4 px-3 py-2.5 rounded-md flex items-center justify-between gap-3"
            style={{
              backgroundColor: "var(--color-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium mb-0.5">현재 등록 영상</p>
              <p
                className="text-[11px] truncate"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {currentVideoId} · {currentStatus === "manual" ? "수동" : currentStatus === "auto_verified" ? "자동 채택" : currentStatus === "auto_pending" ? "자동 후보" : "-"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              aria-label="등록 영상 제거"
              className="px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1"
              style={{
                backgroundColor: "var(--color-error, #ef4444)",
                color: "#fff",
                borderRadius: "4px",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              제거
            </button>
          </div>
        )}

        {/* 탭 — 수동 입력 / 자동 검색 (BDR 디자인 토큰 기반 underline 스타일) */}
        <div
          className="flex border-b mb-4"
          style={{ borderColor: "var(--color-border)" }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "manual"}
            onClick={() => setActiveTab("manual")}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color:
                activeTab === "manual"
                  ? "var(--color-primary, #E31B23)"
                  : "var(--color-text-secondary)",
              borderBottom:
                activeTab === "manual"
                  ? "2px solid var(--color-primary, #E31B23)"
                  : "2px solid transparent",
              marginBottom: "-1px", // 하단 border 와 겹치게
            }}
          >
            수동 입력
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "auto"}
            onClick={() => setActiveTab("auto")}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color:
                activeTab === "auto"
                  ? "var(--color-primary, #E31B23)"
                  : "var(--color-text-secondary)",
              borderBottom:
                activeTab === "auto"
                  ? "2px solid var(--color-primary, #E31B23)"
                  : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            자동 검색
          </button>
        </div>

        {/* === PR4: 수동 입력 탭 === */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* URL/ID input — iOS 16px 룰 (자동 줌 회피) */}
            <div>
              <label
                htmlFor="youtube-url-input"
                className="block text-xs font-medium mb-1.5"
              >
                YouTube URL 또는 영상 ID
              </label>
              <input
                id="youtube-url-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://youtu.be/XXXXX"
                autoComplete="off"
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  // iOS 16px 룰 — 자동 줌 회피 (BDR conventions.md)
                  fontSize: "16px",
                }}
              />
              <p
                className="text-[11px] mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                예: https://youtu.be/abc123XYZ45 또는 https://www.youtube.com/watch?v=abc123XYZ45
              </p>
            </div>

            {/* 에러 / 성공 메시지 */}
            {errorMsg && (
              <div
                role="alert"
                className="text-xs px-3 py-2 rounded-md"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent)",
                  color: "var(--color-error, #ef4444)",
                }}
              >
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div
                role="status"
                className="text-xs px-3 py-2 rounded-md"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-success, #10b981) 15%, transparent)",
                  color: "var(--color-success, #10b981)",
                }}
              >
                {successMsg}
              </div>
            )}

            {/* 액션 버튼 — 취소 / 저장 */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !urlInput.trim()}
                className="px-4 py-2 text-sm rounded font-medium"
                style={{
                  backgroundColor: "var(--color-primary, #E31B23)",
                  color: "#fff",
                  borderRadius: "4px",
                  opacity: submitting || !urlInput.trim() ? 0.6 : 1,
                }}
              >
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        )}

        {/* === PR5: 자동 검색 탭 === */}
        {activeTab === "auto" && (
          <div className="space-y-3">
            {/* Loading skeleton — 카드 3개 */}
            {searchLoading && (
              <div className="space-y-3" aria-busy="true" aria-label="자동 검색 중">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-2 rounded-md animate-pulse"
                    style={{
                      backgroundColor: "var(--color-elevated)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      className="rounded"
                      style={{
                        width: "120px",
                        aspectRatio: "16 / 9",
                        backgroundColor: "var(--color-border)",
                      }}
                    />
                    <div className="flex-1 space-y-2 py-1">
                      <div
                        className="h-3 rounded w-4/5"
                        style={{ backgroundColor: "var(--color-border)" }}
                      />
                      <div
                        className="h-3 rounded w-1/2"
                        style={{ backgroundColor: "var(--color-border)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 검색 에러 */}
            {!searchLoading && searchError && (
              <div
                role="alert"
                className="text-xs px-3 py-2 rounded-md"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent)",
                  color: "var(--color-error, #ef4444)",
                }}
              >
                {searchError}
              </div>
            )}

            {/* 후보 0건 — fallback to 수동 입력 */}
            {!searchLoading && !searchError && candidates && candidates.length === 0 && (
              <div className="text-center py-6">
                <span
                  className="material-symbols-outlined text-3xl mb-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  search_off
                </span>
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  BDR 채널에 매칭되는 영상이 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className="px-4 py-2 text-sm rounded font-medium"
                  style={{
                    backgroundColor: "var(--color-primary, #E31B23)",
                    color: "#fff",
                    borderRadius: "4px",
                  }}
                >
                  수동 입력으로 전환
                </button>
              </div>
            )}

            {/* 후보 카드 N건 — score desc 정렬 (서버에서 이미 sort) */}
            {!searchLoading && !searchError && candidates && candidates.length > 0 && (
              <>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  BDR 채널에서 매칭된 후보 {candidates.length}건. 신뢰도 점수가 높을수록 정확합니다.
                </p>
                <div className="space-y-2.5">
                  {candidates.map((c) => {
                    const isHigh = c.score >= AUTO_THRESHOLD;
                    const isApplying = applyingVideoId === c.video_id;
                    return (
                      <div
                        key={c.video_id}
                        className="flex gap-3 p-2.5 rounded-md transition-opacity"
                        style={{
                          backgroundColor: "var(--color-elevated)",
                          // 80점 이상 = accent border (var(--color-primary)) / 미만 = 기본 border + dim opacity
                          border: isHigh
                            ? "2px solid var(--color-primary, #E31B23)"
                            : "1px solid var(--color-border)",
                          opacity: isHigh ? 1 : 0.75,
                        }}
                      >
                        {/* 썸네일 16:9 (유튜브 mqdefault 기본 320×180) */}
                        <div
                          className="relative flex-shrink-0 rounded overflow-hidden"
                          style={{
                            width: "120px",
                            aspectRatio: "16 / 9",
                            backgroundColor: "var(--color-border)",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={c.thumbnail}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          {/* LIVE 뱃지 — 라이브 영상이면 좌상단 빨간 마크 */}
                          {c.is_live && (
                            <span
                              className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                              style={{
                                backgroundColor: "var(--color-status-live, #E31B23)",
                                color: "#fff",
                              }}
                            >
                              LIVE
                            </span>
                          )}
                        </div>

                        {/* 메타 + 액션 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="min-w-0">
                            <p
                              className="text-xs font-medium leading-tight mb-1"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                              title={c.title}
                            >
                              {c.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* 신뢰도 점수 — 80점 이상 = accent / 미만 = muted */}
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                style={{
                                  backgroundColor: isHigh
                                    ? "var(--color-primary, #E31B23)"
                                    : "var(--color-border)",
                                  color: isHigh ? "#fff" : "var(--color-text-secondary)",
                                }}
                                title={`시간 ${c.score_breakdown.time} + 홈 ${c.score_breakdown.home_team} + 원정 ${c.score_breakdown.away_team} + 대회 ${c.score_breakdown.tournament} + 매치코드 ${c.score_breakdown.match_code} + 라운드 ${c.score_breakdown.round}`}
                              >
                                신뢰도 {c.score}점
                              </span>
                              {!isHigh && (
                                <span
                                  className="text-[10px]"
                                  style={{ color: "var(--color-text-muted)" }}
                                >
                                  낮음
                                </span>
                              )}
                            </div>
                          </div>
                          {/* 적용 버튼 — 진행 중이면 disabled */}
                          <button
                            type="button"
                            onClick={() => handleApplyCandidate(c)}
                            disabled={isApplying || applyingVideoId !== null}
                            className="self-end mt-1.5 px-3 py-1 text-xs rounded font-medium"
                            style={{
                              backgroundColor: isHigh
                                ? "var(--color-primary, #E31B23)"
                                : "var(--color-card)",
                              color: isHigh ? "#fff" : "var(--color-text-primary)",
                              border: isHigh
                                ? "none"
                                : "1px solid var(--color-border)",
                              borderRadius: "4px",
                              opacity: isApplying ? 0.6 : applyingVideoId !== null ? 0.4 : 1,
                            }}
                          >
                            {isApplying ? "적용 중..." : "이 영상 사용"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 자동 검색 탭에서도 에러/성공 메시지 노출 (적용 결과) */}
            {errorMsg && (
              <div
                role="alert"
                className="text-xs px-3 py-2 rounded-md mt-3"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent)",
                  color: "var(--color-error, #ef4444)",
                }}
              >
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div
                role="status"
                className="text-xs px-3 py-2 rounded-md mt-3"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-success, #10b981) 15%, transparent)",
                  color: "var(--color-success, #10b981)",
                }}
              >
                {successMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
