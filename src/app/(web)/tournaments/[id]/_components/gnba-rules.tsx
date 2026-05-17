/**
 * 강남구협회장배 규정 박제 컴포넌트 (이미지 #183 기준)
 *
 * 왜 컴포넌트로 분리:
 *  - tournament.rules (자유텍스트) 와 별개로 강남구 한정 4 섹션 박제 (i2/i3/i3w 종별별 시간/타임아웃/승점/시상)
 *  - settings.points_rule === "gnba" 박제 시만 렌더 → 다른 대회 회귀 0
 *  - DB schema 변경 0 — 본 컴포넌트 = 강남구 한정 하드코딩 시안 (이미 standings-points.ts 의 분기 키와 동일 source)
 *
 * 시안 정합 (Dev/design/claude-project-knowledge §13 룰):
 *  - 모든 색상 var(--color-*) 토큰 사용 (하드코딩 ❌ / 핑크·살몬·코랄 ❌)
 *  - Material Symbols Outlined 아이콘 (lucide-react ❌)
 *  - radius 4px 기본 (rounded-md)
 *  - line-height 1.6+ (text-sm leading-relaxed)
 *  - 데스크탑 = 4 column grid / 모바일 = column stack (md 분기)
 */
export function GnbaRules() {
  return (
    <div className="space-y-4">
      {/* 헤더 — 4 섹션 진입점 */}
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-xl"
          style={{ color: "var(--color-primary)" }}
        >
          sports_basketball
        </span>
        <h2 className="text-lg font-bold sm:text-xl">강남구협회장배 대회 규정</h2>
      </div>

      {/* 4 섹션 그리드 — 데스크탑 2x2 / 모바일 column */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 1. 경기방식 — i2 / i3 U9 / i3 분기 */}
        <section
          className="rounded-md border p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              schedule
            </span>
            1. 경기방식
          </h3>
          <div
            className="space-y-3 text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {/* i2 — 5팀 풀리그 후 시상 */}
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                i2 (5팀 풀리그 후 시상)
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>6분 4쿼터</li>
                <li>작전타임 전·후반 각 1회</li>
                <li>Q1·Q2·Q3 30초 데드 / Q4 1분 데드</li>
              </ul>
            </div>
            {/* i3 U9 — 사각형 리그 */}
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                i3 U9 (사각형 리그 후 순위결정전)
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>10분 전·후반</li>
                <li>작전타임 전·후반 각 1회</li>
                <li>전·후반 데드타임 1분</li>
              </ul>
            </div>
            {/* i3 — 조별예선 후 순위결정전 */}
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                i3 (조별예선 후 순위결정전)
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>10분 전·후반</li>
                <li>작전타임 전·후반 각 1회</li>
                <li>전·후반 데드타임 1분</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. 로컬룰 — 공통 / 승점 / 동률 */}
        <section
          className="rounded-md border p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              rule
            </span>
            2. 로컬룰
          </h3>
          <div
            className="space-y-3 text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {/* 공통 룰 */}
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                공통
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>지역방어 금지 (맨투맨만 허용)</li>
                <li>페인트존 공격/수비 3초 룰 적용</li>
              </ul>
            </div>
            {/* 승점 기준 */}
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                승점 기준
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>승리 = 3점</li>
                <li>i2: 20점차 이상 = 2점 / 30점차 이상 = 1점</li>
                <li>i3: 10점차 이상 = 2점 / 15점차 이상 = 1점</li>
              </ul>
            </div>
            {/* 동률 기준 */}
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                동률 기준
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>득실차 → 득점순</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. 경기메뉴얼 */}
        <section
          className="rounded-md border p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              menu_book
            </span>
            3. 경기메뉴얼
          </h3>
          <ul
            className="ml-4 list-disc space-y-1.5 text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <li>참가 레벨 기준 (참고용 / 일부 편차 발생 가능)</li>
            <li>공정성 확보 (승점제 기반 로컬룰 적용)</li>
            <li>수비 방식 (맨투맨만 허용 / 헬프 가능)</li>
            <li>모든 경기 동일 기준 (대회 기간 내 동일 기준 운영)</li>
          </ul>
        </section>

        {/* 4. 시상 — i2 / i3 */}
        <section
          className="rounded-md border p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              emoji_events
            </span>
            4. 시상
          </h3>
          <div
            className="space-y-3 text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                i2
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>우승 / 준우승 트로피 증정</li>
              </ul>
            </div>
            <div>
              <p
                className="mb-1 text-xs font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                i3
              </p>
              <ul className="ml-4 list-disc space-y-0.5">
                <li>전원 메달 증정 + 기념티 전달</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* 출처 footer — 운영자 임의 변경 시 본 컴포넌트 갱신 필요 안내 */}
      <p
        className="text-xs"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        본 규정은 강남구청 농구협회 공식 안내 기준 (이미지 #183) 입니다. 일부 세부 사항은 대회 운영 본부의 판단에 따라 조정될 수 있습니다.
      </p>
    </div>
  );
}
