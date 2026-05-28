"use client";

/**
 * UA2 시안 — 운영자 화면 전환 미리보기 (B7 갭 해소)
 *
 * 시안: Dev/design/BDR-current/screens/TournamentDetail.jsx L364~404 (Sidebar 내부 B7 블록)
 *
 * 노출 조건:
 *  - isInsider === true (organizer / tournament_admin_member(active) / super_admin)
 *  - 일반 참가자에게는 미노출 (page.tsx 가드)
 *
 * 동작:
 *  - "관리자" / "사용자 (미리보기)" 토글 — 현재 publish 상태로 사용자가 보는 화면을 운영자가 확인
 *  - 본 PR 에서는 토글 UI 만 박제 (실제 미리보기 모드 전환은 후속 PR 에서 url query 결합 가능)
 *
 * 시안 css: tournament-detail.css `.td-side__preview*` 박제
 */

import { useState } from "react";

interface Props {
  /** 초기 미리보기 모드 (true = 사용자 미리보기, false = 관리자 기본) */
  initialPreview?: boolean;

  /** 토글 변경 콜백 — 부모가 url 쿼리/state 연동 시 사용 */
  onToggle?: (preview: boolean) => void;
}

export function TournamentOperatorPreview({
  initialPreview = false,
  onToggle,
}: Props) {
  // 시안 L409: previewMode state (default false = 관리자)
  const [previewMode, setPreviewMode] = useState<boolean>(initialPreview);

  // 토글 핸들러 — state + 외부 콜백 동시 호출
  const handleToggle = (preview: boolean) => {
    setPreviewMode(preview);
    onToggle?.(preview);
  };

  return (
    <div className="td-side__preview">
      {/* 헤더: 아이콘 + 제목 */}
      <div className="td-side__preview-h">
        <span className="ico material-symbols-outlined">visibility</span>
        <span className="td-side__preview-title">운영자 화면 전환</span>
      </div>
      {/* 설명 */}
      <p className="td-side__preview-desc">
        현재 publish 상태로 사용자가 어떻게 보는지 미리 확인합니다.
      </p>
      {/* 토글 버튼 2개 — 관리자 / 사용자 (미리보기) */}
      <div className="td-side__preview-toggle">
        <button
          type="button"
          className={
            "td-side__preview-btn" + (!previewMode ? " is-on" : "")
          }
          onClick={() => handleToggle(false)}
        >
          관리자
        </button>
        <button
          type="button"
          className={
            "td-side__preview-btn" + (previewMode ? " is-on" : "")
          }
          onClick={() => handleToggle(true)}
        >
          사용자 (미리보기)
        </button>
      </div>
    </div>
  );
}
