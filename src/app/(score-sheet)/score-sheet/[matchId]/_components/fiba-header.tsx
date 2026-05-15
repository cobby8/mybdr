/**
 * FIBA SCORESHEET 상단 헤더 컴포넌트 (1/5 영역).
 *
 * 2026-05-11 — Phase 1 신규.
 * 2026-05-14 — Phase 19 PR-S4 시안 시각 정합 재구성 (사용자 핵심 제약: 운영 데이터 로직 100% 보존).
 *
 * 왜 (이유):
 *   BDR v2.5 시안 (Dev/design/BDR-current/screens/ScoreSheet.parts.jsx SSHeader / SSNames / SSMeta)
 *   의 FIBA 종이 정합 마크업을 운영에 도입. PR-S1 토큰 + PR-S2/S3 toolbar 박제와 정합.
 *
 *   시안 = 3 섹션 구조:
 *     Section A (.ss-h)      — BDR 로고 + 3줄 타이틀 (Basketball Daily Routine / MyBDR 공식 기록지 / SCORESHEET)
 *     Section B (.ss-names)  — Team A / Team B 1줄 strip
 *     Section C (.ss-meta)   — 좌(Competition/Date/Time + Game No/Place) 우(Referee + Umpire 1/2)
 *
 * 사용자 핵심 제약 (절대 위반 금지 — PR-S4):
 *   - 운영 함수 호출 / 데이터 매핑 / props interface 변경 0
 *   - splitDateTime (Phase 16 Asia/Seoul) + teamA/B + competition + gameNo + place + referee/umpire 1/2 매핑 100% 보존
 *   - FibaHeader 외부 컴포넌트 (TeamSection / RunningScoreGrid 등) 영향 0
 *   - ss-shell 스코프 = FibaHeader outermost wrapper 한정 (frame 본체 wrapper 변경 ❌ — PR-S6 검토)
 *
 * 사용자 결재 (Phase 19):
 *   - D3: 색상 = .ss-shell 토큰 (PR-S1 + PR-S7 박제) — var(--pap-*)
 *   - D4: FIBA 종이 정합 = 직각 (border-radius 0)
 *   - D6: max-width 794px / 모바일 가로 스크롤 (부모 layout 처리)
 *
 * 방법 (어떻게):
 *   - outermost wrapper = `<section className="ss-shell ss-header">` → .ss-shell 자손 .ss-h / .ss-names / .ss-meta 룰 매칭
 *   - 자동 fill 변수 (props) 그대로 wiring: teamAName / teamBName / competitionName / scheduledAtLabel → splitDateTime / gameNo / placeLabel
 *   - 입력 변수 (FibaHeaderInputs) 그대로 wiring: values.referee / values.umpire1 / values.umpire2 + update(key)
 *   - splitDateTime export 유지 (test 회귀 0)
 *   - frameless prop = 호환성 위해 시그니처 유지하되 동작 흡수 (시안 마크업이 단일 wrapper 정합)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌
 *   - 시안 클래스명 (.ss-h__* / .ss-names__* / .ss-meta__* / .ss-field*) 그대로 — CSS 매칭 정합
 */

"use client";

import Image from "next/image";
import type { ChangeEvent } from "react";

export interface FibaHeaderInputs {
  referee: string;
  umpire1: string;
  umpire2: string;
}

interface FibaHeaderProps {
  // 자동 fill (server prop) — 운영 매핑 (변경 0)
  teamAName: string;
  teamBName: string;
  competitionName: string;
  scheduledAtLabel: string | null; // "2026-05-11 14:00" 류 (Phase 16 Asia/Seoul timezone)
  gameNo: string | null; // match.match_code 또는 fallback match.id
  placeLabel: string | null; // court_number 또는 venue name
  // 입력 상태 — 운영 매핑 (변경 0)
  values: FibaHeaderInputs;
  onChange: (next: FibaHeaderInputs) => void;
  disabled?: boolean;
  // Phase 23 PR-RO1 (2026-05-15) — read-only 차단 (사용자 결재 Q2 — 종료 매치 input 차단).
  //   왜: disabled 와 분리 = 시각 회색 처리 없이 readOnly 만 적용 (UX 우호적 / 포커스 + 선택 허용).
  //   호출자 미전달 (= undefined) 시 동작 변경 0 (운영 보존).
  readOnly?: boolean;
  // Phase 8 — frameless 모드. PR-S4 시안 정합 후 시각 효과 흡수.
  //   호출자 호환성 위해 prop 시그니처는 보존 (page.tsx / form.tsx 변경 0).
  frameless?: boolean;
  // 2026-05-16 (PR-Quarter-Badge) — 현재 쿼터 뱃지 (사용자 보고 이미지 #130).
  //   .ss-h 우측 상단 빈 영역에 노출. 미전달 시 미노출 (운영 호환).
  //   currentPeriod: 1~4 = Q1~Q4 / 5~ = OT1~ / matchEnded=true 면 "경기 종료" 표시.
  currentPeriod?: number;
  matchEnded?: boolean;
  // 2026-05-16 (PR-Quarter-Badge-v3) — 사용자 보고 이미지 #157 fix.
  //   뱃지 하단 매치 상태 라벨 (경기 전 / 경기 중 / 경기 종료) 산출용.
  //   marksCount = runningScore.home.length + runningScore.away.length (호출자 합산).
  //   0 = 경기 전 / 1+ = 경기 중 / matchEnded=true 가 우선 = 경기 종료.
  //   미전달 시 라벨 미노출 (운영 호환).
  marksCount?: number;
  // 2026-05-16 (PR-Possession-2) — 공격권 화살표 (FIBA Article 12 Alternating Possession).
  //   "home" = home 방향 (오른쪽 forward) / "away" = away 방향 (왼쪽 back) / null = 미박제 (Opening Jump Ball 전).
  //   사용자 결재 위치 = 쿼터 뱃지 좌측 (.ss-h grid 3번째 cell wrapper 안).
  //   null 시 화살표 미노출 (운영 호환 / 기존 paper 매치 영향 0).
  possessionArrow?: "home" | "away" | null;
  // 화살표 클릭 콜백 (헬드볼 confirm 모달 trigger). 미전달 시 = read-only 클릭 비활성.
  //   isReadOnly 매치 또는 첫 점프볼 미완료 시 caller 가 undefined 전달 → 본 컴포넌트가 자동 비활성.
  onArrowClick?: () => void;
  // 2026-05-16 (긴급 박제 — 전후반 모드 / 강남구 i3 종별)
  //   "halves" 시 = 쿼터 뱃지 라벨 = "전반" / "후반" / "OT{N}". 기본 (= "quarters" 또는 미전달) = Q{N} / OT{N}.
  //   form.tsx 가 periodFormat state 를 prop drilling. 운영 호환 = 미전달 시 기본 동작 유지.
  periodFormat?: "halves" | "quarters";
}

export function FibaHeader({
  teamAName,
  teamBName,
  competitionName,
  scheduledAtLabel,
  gameNo,
  placeLabel,
  values,
  onChange,
  disabled,
  readOnly, // Phase 23 PR-RO1 (2026-05-15) — input readOnly wiring (종료 매치 차단)
  frameless: _frameless, // PR-S4 — 시안 정합으로 시각 흡수 (호출자 호환성 위해 시그니처만 유지)
  currentPeriod, // 2026-05-16 (PR-Quarter-Badge) — 우상단 쿼터 뱃지 (이미지 #130)
  matchEnded, // 2026-05-16 (PR-Quarter-Badge) — 경기 종료 시 "경기 종료" 표시
  marksCount, // 2026-05-16 (PR-Quarter-Badge-v3) — 뱃지 하단 상태 라벨 산출 (이미지 #157)
  possessionArrow, // 2026-05-16 (PR-Possession-2) — 공격권 화살표 (home/away/null)
  onArrowClick, // 2026-05-16 (PR-Possession-2) — 화살표 클릭 = 헬드볼 confirm 모달 trigger
  periodFormat, // 2026-05-16 (긴급 박제 — 전후반 모드)
}: FibaHeaderProps) {
  // 2026-05-16 (PR-Quarter-Badge) — 쿼터 라벨 산출.
  //   matchEnded=true → "경기 종료" / currentPeriod 1~4 → "Q{N}" / 5~ → "OT{N-4}" / 미전달 → null.
  //
  // 2026-05-16 (긴급 박제 — 전후반 모드 / 강남구 i3 종별):
  //   periodFormat === "halves" 시:
  //     - currentPeriod 1 → "전반"
  //     - currentPeriod 2 → "후반"
  //     - currentPeriod 3+ → "OT{N-2}" (전후반 모드 OT = period 3 부터 시작 = OT1)
  //   그 외 (= quarters 또는 미전달) = 기존 4쿼터 룰 (운영 호환).
  const quarterLabel: string | null = (() => {
    if (matchEnded) return "경기 종료";
    if (currentPeriod == null) return null;
    // 전후반 모드 분기
    if (periodFormat === "halves") {
      if (currentPeriod === 1) return "전반";
      if (currentPeriod === 2) return "후반";
      if (currentPeriod >= 3) return `OT${currentPeriod - 2}`;
      return null;
    }
    // 기본 (4쿼터)
    if (currentPeriod >= 1 && currentPeriod <= 4) return `Q${currentPeriod}`;
    if (currentPeriod >= 5) return `OT${currentPeriod - 4}`;
    return null;
  })();
  const isEndedBadge = Boolean(matchEnded);
  // 2026-05-16 (PR-Quarter-Badge-v3) — 매치 상태 라벨 산출 (사용자 보고 이미지 #157 fix).
  //   matchEnded=true → "경기 종료" (우선) / marksCount === 0 → "경기 전" / 그 외 → "경기 중".
  //   marksCount 미전달(undefined) 시 null → 라벨 미노출 (운영 호환).
  const matchPhaseLabel: string | null =
    matchEnded
      ? "경기 종료"
      : marksCount == null
      ? null
      : marksCount === 0
      ? "경기 전"
      : "경기 중";
  // 단일 update 패턴 — values 전체 spread + key 갱신 (운영 매핑 변경 0)
  const update =
    (key: keyof FibaHeaderInputs) => (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, [key]: e.target.value });
    };

  // 날짜/시각 분리 — Phase 16 Asia/Seoul timezone 적용된 라벨을 마지막 공백 split
  // (운영 매핑 변경 0 — splitDateTime 호출 / 인자 동일)
  const { dateLabel, timeLabel } = splitDateTime(scheduledAtLabel);

  return (
    // outermost wrapper = ss-shell + ss-header — PR-S1 토큰 활성화 + PR-S4 .ss-h/.ss-names/.ss-meta 룰 매칭
    // 시안 출처: ScoreSheet.parts.jsx SSHeader / SSNames / SSMeta (3 섹션 직렬)
    <section className="ss-shell ss-header" data-ss-section="header">
      {/* Section A — BDR 로고 + 3줄 타이틀 (시안 .ss-h).
          PR-S8 (2026-05-15 rev2) — 로고 두 줄 분리 (시안 ScoreSheet.parts.jsx L28~29 정합):
            - <div.ss-h__logo-brand>BDR</div>
            - <div.ss-h__logo-tag>We Play Basketball</div>
          이미지(/images/logo.png)는 .ss-h__logo-mark 원형 마크 안에 그대로 박제. */}
      <section
        className="ss-h"
        // 2026-05-16 (PR-Quarter-Badge) — 뱃지 박제 시 grid 3 col (logo + title + badge).
        //   미박제 시 기본 2 col (logo + title) — _score-sheet-styles.css L161 정합.
        style={
          quarterLabel
            ? { gridTemplateColumns: "92px 1fr auto" }
            : undefined
        }
      >
        <div className="ss-h__logo">
          <div className="ss-h__logo-mark">
            {/* 운영 BDR 로고 박제 — next/image 사용 (Phase 1 시점부터 보존) */}
            <Image
              src="/images/logo.png"
              alt="BDR"
              width={36}
              height={36}
              priority
            />
          </div>
          {/* PR-S8 — 로고 두 줄 분리 (시안 rev2 정합) */}
          <div className="ss-h__logo-brand">BDR</div>
          <div className="ss-h__logo-tag">We Play Basketball</div>
        </div>
        <div className="ss-h__title">
          <div className="ss-h__t1">BASKETBALL DAILY ROUTINE</div>
          <div className="ss-h__t2">MyBDR 공식 기록지</div>
          <div className="ss-h__t3">SCORESHEET</div>
        </div>
        {/* 2026-05-16 (PR-Quarter-Badge) — 사용자 보고 이미지 #130 fix.
            .ss-h grid 의 3번째 cell 로 뱃지 박제. grid-template-columns 인라인 강제 = "92px 1fr auto"
            (.ss-h__logo 92px / .ss-h__title 1fr / 뱃지 자연 폭). Q1~Q4 / OT1+ / 경기 종료 표시.

            2026-05-16 (PR-Possession-2) — 쿼터 뱃지 좌측에 공격권 화살표 추가.
            possessionArrow != null 시 화살표 노출 (회색 / 56px / Material Symbols).
            possessionArrow == null 시 자리만 차지 (운영 호환 / 기존 paper 매치 영향 0). */}
        {quarterLabel && (
          // 2026-05-16 (PR-Quarter-Badge-v4) — 사용자 보고 이미지 #158 fix.
          //   v3 의 alignSelf: flex-start + marginTop: -4px → 너무 위로 이동 사고.
          //   원복 = alignSelf: center (기존 v2 위치) + 라벨만 아래 추가 유지.
          //
          //   2026-05-16 (PR-Possession-2) — flex row 컨테이너로 변경 (화살표 좌측 + 뱃지 우측).
          //   기존 column flex 박제 = 뱃지 + 상태 라벨 세로 누적 → wrapper 1단 추가해 row + column 중첩.
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginRight: 8,
              alignSelf: "center",
            }}
          >
            {/* 2026-05-16 (PR-Possession-2) — 공격권 화살표 (쿼터 뱃지 좌측).
                possessionArrow=null 시 = 미박제 = 미노출 (운영 호환).
                "home" = arrow_forward (오른쪽 향 / home 방향) / "away" = arrow_back (왼쪽 향 / away 방향).
                색상 = var(--color-text-primary) 회색 (사용자 결재 — 빨강 본문 텍스트 룰 ❌).
                onArrowClick 미전달 시 = read-only (cursor: default + 클릭 비활성). */}
            {possessionArrow !== null && possessionArrow !== undefined && (
              <button
                type="button"
                onClick={onArrowClick}
                disabled={!onArrowClick}
                aria-label={
                  possessionArrow === "home"
                    ? "공격권 = home — 헬드볼 발생 시 공격권 토글"
                    : "공격권 = away — 헬드볼 발생 시 공격권 토글"
                }
                title={
                  onArrowClick
                    ? "헬드볼 발생 시 클릭 — 공격권 토글"
                    : "공격권 화살표 (read-only)"
                }
                style={{
                  // 화살표 자체 크기 = 56px (사용자 결재)
                  fontSize: 0, // material-symbols 자체 폰트 크기는 inline span 으로 분리
                  border: "none",
                  background: "transparent",
                  padding: 4,
                  cursor: onArrowClick ? "pointer" : "default",
                  color: "var(--color-text-primary)",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  // 터치 영역 = 56px (사용자 결재)
                  minWidth: 56,
                  minHeight: 56,
                  touchAction: "manipulation",
                }}
              >
                {/* Material Symbols Outlined — arrow_forward (home 방향) / arrow_back (away 방향).
                    크기 = 56px (사용자 결재) — 회색 (var(--color-text-primary)). */}
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 56, fontWeight: 500 }}
                  aria-hidden="true"
                >
                  {possessionArrow === "home" ? "arrow_forward" : "arrow_back"}
                </span>
              </button>
            )}
            {/* 뱃지 + 상태 라벨 = 기존 column flex (위로 옮김). */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
            {/* 2026-05-16 (PR-Quarter-Badge-v2) — "PERIOD"/"STATUS" 라벨 제거 (이미지 #134 fix).
                v3: 부모 wrapper 에서 marginRight/alignSelf 흡수 → 본 div 는 박스 시각만. */}
            <div
              className="flex items-center justify-center px-4 py-2"
              style={{
                border: isEndedBadge
                  ? "2px solid #6B7280"
                  : "2px solid #E31B23",
                borderRadius: 6,
                backgroundColor: isEndedBadge ? "#F3F4F6" : "#FEF2F2",
                color: isEndedBadge ? "#6B7280" : "#E31B23",
                minWidth: 88,
                fontSize: isEndedBadge ? 16 : 22,
                fontWeight: 800,
                lineHeight: 1,
              }}
              aria-live="polite"
              aria-label={isEndedBadge ? "경기 종료" : `현재 쿼터 ${quarterLabel}`}
            >
              {quarterLabel}
            </div>
            {/* 2026-05-16 (PR-Quarter-Badge-v3) — 매치 상태 라벨 (이미지 #157 fix).
                작은 글씨 (10px) / 회색 (var(--color-text-secondary)) / 가운데 정렬.
                marksCount 미전달 시 matchPhaseLabel === null → 미노출 (운영 호환). */}
            {matchPhaseLabel && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-text-secondary, #6B7280)",
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                }}
              >
                {matchPhaseLabel}
              </div>
            )}
            </div>
            {/* 2026-05-16 (PR-Possession-2) — 외부 row flex wrapper 닫기 (화살표 + 뱃지column 묶음). */}
          </div>
        )}
      </section>

      {/* Section B — Team A / Team B 1줄 strip (시안 .ss-names)
          운영 매핑: teamAName / teamBName props 그대로 wiring. */}
      <section className="ss-names">
        <div className="ss-names__cell">
          <label className="pap-lbl">Team A</label>
          <span className="pap-u">{teamAName || " "}</span>
        </div>
        <div className="ss-names__cell">
          <label className="pap-lbl">Team B</label>
          <span className="pap-u">{teamBName || " "}</span>
        </div>
      </section>

      {/* Section C — Meta (시안 .ss-meta)
          좌: Competition / Date / Time + Game No / Place
          우: Referee + Umpire 1 / Umpire 2

          운영 매핑 변경 0:
            - competitionName / dateLabel / timeLabel / gameNo / placeLabel — 시안 SSField (display)
            - values.referee / values.umpire1 / values.umpire2 + update(key) — 시안 SSField input 형 */}
      <section
        className="ss-meta"
        // 2026-05-16 (PR-Overflow-Fix-meta) — 사용자 보고 이미지 #124 "너무 줄어들었어" fix.
        //   이전 비율 5fr 1fr (= 우측 16.7%) → Umpire 1/Umpire 2 underline 시각 cut.
        //   새 비율 2fr 1fr (= 우측 33.3%) — Referee + Umpire 1+2 라벨/underline 충분히 들어감.
        style={{ gridTemplateColumns: "2fr 1fr" }}
      >
        <div className="ss-meta__l" data-ss-section="header-meta">
          {/* 2026-05-15 (PR-SS-meta-Layout) — 사용자 요청 재배치:
              1행: Competition (가장 넓게) + Game No.
              2행: Date + Time + Place
              이전 박제: 1행 Competition+Date+Time / 2행 Game No.+Place. */}
          <div className="ss-meta__row">
            <SSFieldDisplay
              label="Competition"
              value={competitionName}
              grow={3}
              allowWrap
            />
            <SSFieldDisplay label="Game No." value={gameNo ?? ""} />
          </div>
          <div className="ss-meta__row">
            <SSFieldDisplay label="Date" value={dateLabel ?? ""} />
            <SSFieldDisplay label="Time" value={timeLabel ?? ""} />
            <SSFieldDisplay label="Place" value={placeLabel ?? ""} grow={3} />
          </div>
        </div>
        <div className="ss-meta__r" data-ss-section="header-officials">
          <div className="ss-meta__row">
            <SSFieldInput
              label="Referee"
              value={values.referee}
              onChange={update("referee")}
              disabled={disabled}
              readOnly={readOnly}
              grow={2}
            />
          </div>
          <div className="ss-meta__row">
            <SSFieldInput
              label="Umpire 1"
              value={values.umpire1}
              onChange={update("umpire1")}
              disabled={disabled}
              readOnly={readOnly}
            />
            <SSFieldInput
              label="Umpire 2"
              value={values.umpire2}
              onChange={update("umpire2")}
              disabled={disabled}
              readOnly={readOnly}
            />
          </div>
        </div>
      </section>
    </section>
  );
}

/**
 * 시안 SSField (display 전용) — label + value (border-bottom underscore).
 *
 * 운영 매핑 박제 위해 React 함수 컴포넌트로 분리 — JSX 트리 가독성 향상.
 * data-grow 속성으로 시안 .ss-field[data-grow="2"] / [data-grow="3"] flex 룰 매칭.
 */
function SSFieldDisplay({
  label,
  value,
  grow = 1,
  allowWrap = false,
}: {
  label: string;
  value: string;
  grow?: 1 | 2 | 3;
  /**
   * 2026-05-15 (PR-Score-Sheet-Cleanup #49) — 긴 텍스트 wrap 허용.
   *   default false = FIBA 종이 정합 (1줄 + ellipsis).
   *   true = Competition 등 긴 대회명 wrap (2줄까지 확장, height auto).
   */
  allowWrap?: boolean;
}) {
  // 2026-05-15 — allowWrap 시 .ss-field__v 기본 룰 (nowrap + ellipsis) 우회.
  //   inline style 로 white-space/height/line-height override (CSS 추가 없이 단일 컴포넌트).
  const valueStyle: React.CSSProperties | undefined = allowWrap
    ? {
        whiteSpace: "normal",
        textOverflow: "clip",
        height: "auto",
        minHeight: 16,
        lineHeight: "13px",
        wordBreak: "keep-all",
      }
    : undefined;
  return (
    <div className="ss-field" data-grow={grow}>
      {/* PR-S8 — .pap-lbl 클래스 병행 (시안 rev2 정합 / 기존 .ss-field>label 룰 호환 유지) */}
      <label className="pap-lbl">{label}</label>
      {/* 빈 값은 nbsp 박제 — underscore 가 빈 줄로 보존 (FIBA 종이 정합).
          PR-S8 — .pap-u 클래스 병행 (시안 rev2 정합). */}
      <div className="ss-field__v pap-u" style={valueStyle}>{value || " "}</div>
    </div>
  );
}

/**
 * 시안 SSField 의 입력 변형 — display div → input 교체.
 *
 * 시안은 모든 field 를 display 로 박제했으나, 운영 = Referee/Umpire 1/2 = 입력.
 * CSS .ss-shell .ss-field > input.ss-field__input 룰로 underscore + 폰트 정합.
 */
function SSFieldInput({
  label,
  value,
  onChange,
  disabled,
  readOnly, // Phase 23 PR-RO1 (2026-05-15) — 종료 매치 input 차단 wiring
  grow = 1,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  grow?: 1 | 2 | 3;
}) {
  // 시안 CSS selector `.ss-shell .ss-field > label` + `.ss-shell .ss-field > input.ss-field__input`
  // 매칭 위해 outer = div, sibling = label + input.
  // 접근성 — htmlFor 미사용 (multiple input 시 id 충돌 위험) / 대신 input 의 aria-label 박제.
  return (
    <div className="ss-field" data-grow={grow}>
      {/* PR-S8 — .pap-lbl 클래스 병행 (시안 rev2 정합) */}
      <label className="pap-lbl">{label}</label>
      <input
        type="text"
        className="ss-field__input pap-u"
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={40}
        aria-label={label}
      />
    </div>
  );
}

/**
 * "2026-05-11 14:00" → { dateLabel: "2026-05-11", timeLabel: "14:00" }.
 *
 * Phase 16 — Asia/Seoul timezone 적용된 라벨을 page.tsx 에서 toLocaleString 으로 생성 후 전달.
 * 본 함수는 마지막 공백 기준 split — 한국어 toLocaleString 출력 ("2026. 05. 11. 14:00") 도 정합.
 *
 * 빈 입력 / "—" placeholder 는 null 반환 — UI 가 빈 값으로 fallback.
 *
 * 절대 룰: export 유지 (vitest fiba-header-split-datetime.test.ts 가 import — 변경 0).
 */
export function splitDateTime(
  label: string | null
): { dateLabel: string | null; timeLabel: string | null } {
  if (!label || label === "—") {
    return { dateLabel: null, timeLabel: null };
  }
  // "2026. 05. 11. 14:00" 또는 "2026-05-11 14:00" — 마지막 공백 split
  const lastSpace = label.lastIndexOf(" ");
  if (lastSpace < 0) {
    return { dateLabel: label, timeLabel: null };
  }
  return {
    dateLabel: label.slice(0, lastSpace).trim(),
    timeLabel: label.slice(lastSpace + 1).trim(),
  };
}
