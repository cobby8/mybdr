"use client";

/* ============================================================
 * HeroBento — 히어로 벤토 그리드
 * 좌측(col-span-2): LIVE NOW 비디오 플레이어 스타일 메인 배너
 * 우측(col-span-1): 오늘의 주요 경기 카드 + 나의 통계(로그인) / 서비스 소개(비로그인)
 *
 * 왜 벤토 그리드인가: 첫 화면에서 핵심 콘텐츠(라이브 경기)를 크게 보여주고,
 * 부가 정보를 작은 카드로 배치해 시각적 계층을 만든다.
 * ============================================================ */

export function HeroBento() {
  return (
    /* 히어로 배너: 전체 너비 */
    <div>

      {/* ===== 메인 배너: LIVE NOW 비디오 플레이어 스타일 ===== */}
      <div className="relative h-[420px] rounded-xl overflow-hidden bg-card group border border-border">
        {/* 배경 이미지 + 호버 시 확대 효과 */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            alt="2024 서울 챔피언십 결승"
            className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"
          />
          {/* play_circle 오버레이: 영상처럼 보이게 하는 장치 */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <span className="material-symbols-outlined text-white text-7xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              play_circle
            </span>
          </div>
        </div>

        {/* 하단 그라디언트: 텍스트가 잘 보이도록 어둡게 처리 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* 텍스트 오버레이 */}
        <div className="absolute bottom-0 left-0 p-8 w-full pointer-events-none">
          {/* LIVE NOW 뱃지 */}
          <span className="inline-block px-3 py-1 bg-primary text-on-primary text-[10px] font-bold tracking-widest uppercase rounded mb-4">
            LIVE NOW
          </span>
          {/* 제목: Space Grotesk 폰트 */}
          <h2 className="text-4xl font-heading font-bold text-white mb-2 leading-tight">
            2024 서울 챔피언십
            <br />
            결승 토너먼트
          </h2>
          <p className="text-text-secondary max-w-lg mb-6">
            현재 최고의 랭킹을 자랑하는 두 팀의 치열한 대결이 시작되었습니다.
            실시간 스코어를 확인하세요.
          </p>
          {/* CTA 버튼 */}
          <button className="bg-primary hover:bg-primary-hover text-on-primary px-6 py-3 rounded font-bold flex items-center gap-2 transition-colors active:scale-95 pointer-events-auto">
            실시간 중계 보기
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

    </div>
  );
}
