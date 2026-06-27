/* global window */
// ============================================================
// site-data.jsx — 공개 토너먼트 사이트 mock (bdr-summer-4.mybdr.kr)
//   대회: BDR 서머 오픈 #4 · Classic 템플릿(네이비 nav / 라이트 bg)
//   E등급 자체영역 — 디자인 토큰만 일치, AppNav 미적용(별도 서브도메인 사이트)
// ============================================================
(function () {
  window.SITE = {
    meta: {
      name: "BDR 서머 오픈 #4",
      slug: "bdr-summer-4",
      series: "BDR 오픈 정규대회",
      round: 4,
      org: "BDR 농구문화",
      orgSlug: "bdr-basketball",
      subdomain: "bdr-summer-4",
      navy: "#1B3C87",
      period: "2026.06.15 ~ 06.21",
      venue: "장충체육관",
      region: "서울 중구",
      status: "진행중",
      teams: 38,
      maxTeams: 44,
      divisions: 4,
      games: 31,
      tagline: "전국 농구 매칭 플랫폼 — 여름을 여는 3x3·5x5 오픈전",
      regOpen: true,
      regClose: "2026.06.10 18:00",
    },
    // 종별
    divisions: [
      { code: "open-m", label: "남자 오픈 3x3", teams: 12, format: "듀얼토너먼트", color: "#1B3C87" },
      { code: "open-w", label: "여자 오픈 3x3", teams: 8, format: "조별리그+토너먼트", color: "#E31B23" },
      { code: "u18", label: "유스 U18 5x5", teams: 10, format: "조별리그+토너먼트", color: "#16a34a" },
      { code: "vet", label: "베테랑 5x5", teams: 8, format: "풀리그", color: "#8B5CF6" },
    ],
    // 공지
    notices: [
      { id: "n1", tag: "중요", tone: "err", t: "결승 진출팀 유니폼 색상 확인 안내", d: "06.18", body: "결승 토너먼트 진출 8팀은 홈/원정 유니폼 색상을 06.19 12시까지 운영본부에 확정 제출 바랍니다." },
      { id: "n2", tag: "일정", tone: "primary", t: "8강 대진 추첨 결과 공지", d: "06.17", body: "조별 예선 종료에 따라 8강 대진이 확정되었습니다. 대진·결과 페이지에서 확인하세요." },
      { id: "n3", tag: "안내", tone: "ok", t: "주차장 운영 및 셔틀 안내", d: "06.15", body: "장충체육관 지하 주차장은 만차가 예상됩니다. 동대입구역 6번 출구 셔틀을 이용해 주세요." },
    ],
    // 참가팀 (대표 표기)
    teamList: [
      { id: "t1", name: "한강 불스", div: "남자 오픈 3x3", region: "서울 용산", seed: 1, w: 4, l: 0, status: "8강" },
      { id: "t2", name: "성남 스타스", div: "남자 오픈 3x3", region: "경기 성남", seed: 2, w: 3, l: 1, status: "8강" },
      { id: "t3", name: "부평 코어", div: "남자 오픈 3x3", region: "인천 부평", seed: 3, w: 3, l: 1, status: "8강" },
      { id: "t4", name: "송파 레인", div: "남자 오픈 3x3", region: "서울 송파", seed: 4, w: 2, l: 2, status: "8강" },
      { id: "t5", name: "마포 게이트", div: "남자 오픈 3x3", region: "서울 마포", seed: 5, w: 2, l: 2, status: "예선탈락" },
      { id: "t6", name: "분당 하이츠", div: "남자 오픈 3x3", region: "경기 분당", seed: 6, w: 1, l: 3, status: "예선탈락" },
      { id: "t7", name: "노원 윙스", div: "여자 오픈 3x3", region: "서울 노원", seed: 1, w: 3, l: 0, status: "4강" },
      { id: "t8", name: "수원 블룸", div: "여자 오픈 3x3", region: "경기 수원", seed: 2, w: 2, l: 1, status: "4강" },
      { id: "t9", name: "강서 플레임", div: "여자 오픈 3x3", region: "서울 강서", seed: 3, w: 2, l: 1, status: "예선탈락" },
      { id: "t10", name: "일산 라이트닝", div: "유스 U18 5x5", region: "경기 고양", seed: 1, w: 4, l: 0, status: "결승" },
      { id: "t11", name: "안양 베어스", div: "유스 U18 5x5", region: "경기 안양", seed: 2, w: 3, l: 1, status: "결승" },
      { id: "t12", name: "동작 하운즈", div: "베테랑 5x5", region: "서울 동작", seed: 1, w: 5, l: 1, status: "1위" },
    ],
    // 일정 (날짜별)
    schedule: [
      {
        date: "06.15 (월)", phase: "조별 예선 1일차",
        games: [
          { no: "JC-0615-01", time: "10:00", court: "A코트", div: "남자 오픈 3x3", home: "한강 불스", away: "마포 게이트", hs: 21, as: 14, status: "종료" },
          { no: "JC-0615-02", time: "10:40", court: "A코트", div: "남자 오픈 3x3", home: "성남 스타스", away: "분당 하이츠", hs: 21, as: 17, status: "종료" },
          { no: "JC-0615-03", time: "11:20", court: "B코트", div: "여자 오픈 3x3", home: "노원 윙스", away: "강서 플레임", hs: 21, as: 12, status: "종료" },
          { no: "JC-0615-04", time: "12:00", court: "B코트", div: "유스 U18 5x5", home: "일산 라이트닝", away: "안양 베어스", hs: 58, as: 41, status: "종료" },
        ],
      },
      {
        date: "06.18 (목)", phase: "조별 예선 최종일",
        games: [
          { no: "JC-0618-11", time: "14:00", court: "A코트", div: "남자 오픈 3x3", home: "부평 코어", away: "송파 레인", hs: 21, as: 19, status: "종료" },
          { no: "JC-0618-12", time: "14:40", court: "A코트", div: "베테랑 5x5", home: "동작 하운즈", away: "한강 베테랑", hs: 64, as: 55, status: "종료" },
        ],
      },
      {
        date: "06.20 (토)", phase: "8강 토너먼트",
        games: [
          { no: "JC-0620-21", time: "11:00", court: "메인코트", div: "남자 오픈 3x3", home: "한강 불스", away: "송파 레인", hs: null, as: null, status: "예정" },
          { no: "JC-0620-22", time: "11:40", court: "메인코트", div: "남자 오픈 3x3", home: "성남 스타스", away: "부평 코어", hs: null, as: null, status: "예정" },
          { no: "JC-0620-23", time: "13:00", court: "메인코트", div: "여자 오픈 3x3", home: "노원 윙스", away: "수원 블룸", hs: null, as: null, status: "예정" },
        ],
      },
      {
        date: "06.21 (일)", phase: "4강·결승",
        games: [
          { no: "JC-0621-31", time: "13:00", court: "메인코트", div: "유스 U18 5x5", home: "일산 라이트닝", away: "안양 베어스", hs: null, as: null, status: "예정" },
          { no: "JC-0621-32", time: "15:00", court: "메인코트", div: "남자 오픈 3x3", home: "8강 승자 1", away: "8강 승자 2", hs: null, as: null, status: "예정" },
        ],
      },
    ],
    // 8강 토너먼트 대진 (남자 오픈 3x3)
    bracket: {
      div: "남자 오픈 3x3",
      rounds: [
        {
          name: "8강", games: [
            { home: "한강 불스", away: "송파 레인", hs: null, as: null, st: "예정" },
            { home: "성남 스타스", away: "부평 코어", hs: null, as: null, st: "예정" },
            { home: "노원 게이트", away: "잠실 워리어스", hs: null, as: null, st: "예정" },
            { home: "용산 피닉스", away: "구로 샤크스", hs: null, as: null, st: "예정" },
          ],
        },
        {
          name: "4강", games: [
            { home: "8강 1 승자", away: "8강 2 승자", hs: null, as: null, st: "대기" },
            { home: "8강 3 승자", away: "8강 4 승자", hs: null, as: null, st: "대기" },
          ],
        },
        {
          name: "결승", games: [
            { home: "4강 1 승자", away: "4강 2 승자", hs: null, as: null, st: "대기" },
          ],
        },
      ],
    },
    // 후원/협력
    sponsors: ["BDR 농구문화", "장충체육관", "MyBDR", "코트메이트"],
    // 로그인 사용자 + 내가 만든 팀 (참가신청은 팀 단위 — 자유 팀명 입력 불가)
    me: {
      loggedIn: true,        // 데모 토글로 미로그인 상태 확인 가능
      name: "김도윤",
      phone: "010-2841-5573",
      teams: [
        { id: "my1", name: "용산 게이트", kind: "3x3", region: "서울 용산", members: 4, role: "대표", color: "#1B3C87", verified: true },
        { id: "my2", name: "용산 게이트 파이브", kind: "5x5", region: "서울 용산", members: 9, role: "대표", color: "#E31B23", verified: true },
        { id: "my3", name: "용산 주말 클럽", kind: "5x5", region: "서울 용산", members: 6, role: "총무", color: "#16a34a", verified: false },
      ],
    },
    // 주최 단체(단체 사이트) — 대회 사이트는 이 단체의 대회 페이지
    org: {
      name: "BDR 농구문화",
      slug: "bdr-basketball",
      verified: true,
      founded: "2019",
      region: "서울 · 전국",
      tagline: "전국 농구 동호인을 잇는 비영리 농구문화 단체",
      about: "코트 예약·픽업 게임·정규 리그·토너먼트를 운영하며 아마추어 농구 생태계를 만듭니다. 모든 대회는 단체 사이트의 대회 페이지로 게시됩니다.",
      mission: "농구를 사랑하는 누구나 정정당당하게 경기하고, 지역을 넘어 교류하는 농구 문화를 만듭니다.",
      history: [
        { y: "2019", t: "BDR 농구문화 설립 · 첫 동호인 리그 개최" },
        { y: "2021", t: "정규 시즌제 도입 · 연간 4개 정규대회 운영" },
        { y: "2023", t: "누적 참가 1,000팀 돌파 · 유스 부문 신설" },
        { y: "2026", t: "MyBDR 플랫폼 통합 운영 · 전국 단위로 확장" },
      ],
      staff: [
        { name: "한승우", role: "대표 (회장)", since: "2019", color: "#1B3C87" },
        { name: "정수민", role: "사무국장", since: "2020", color: "#E31B23" },
        { name: "오정환", role: "대회운영 팀장", since: "2021", color: "#16a34a" },
        { name: "김도윤", role: "심판·기록 팀장", since: "2022", color: "#8B5CF6" },
        { name: "이서준", role: "미디어·홍보", since: "2023", color: "#0EA5E9" },
        { name: "박지호", role: "총무·정산", since: "2022", color: "#FF9500" },
      ],
      notices: [
        { id: "on1", tag: "공지", tone: "navy", d: "2026.06.12", t: "2026 하반기 정규대회 일정 안내", body: "하반기 BDR 정규대회 및 토너먼트 일정이 확정되었습니다. 대회 카테고리에서 확인하세요." },
        { id: "on2", tag: "모집", tone: "red", d: "2026.05.28", t: "신규 운영 스태프 모집", body: "대회 운영·기록·미디어 분야에서 함께할 자원봉사 스태프를 모집합니다." },
        { id: "on3", tag: "안내", tone: "ok", d: "2026.05.10", t: "단체 회원 등급제 개편 안내", body: "정회원·준회원 혜택과 참가비 할인 정책이 개편되었습니다." },
      ],
      board: [
        { id: "b1", cat: "자유", t: "이번 서머오픈 8강 직관 같이 가실 분", author: "용산러버", date: "06.18", replies: 12 },
        { id: "b2", cat: "질문", t: "3x3 듀얼토너먼트 방식이 어떻게 되나요?", author: "농린이", date: "06.17", replies: 6 },
        { id: "b3", cat: "후기", t: "스프링 리그 우승 후기 (장문 주의)", author: "마포불스", date: "06.10", replies: 21 },
        { id: "b4", cat: "자유", t: "서울 동부 야외 코트 추천 받습니다", author: "성동썬더", date: "06.08", replies: 9 },
        { id: "b5", cat: "질문", t: "팀 창단하려면 최소 인원이 몇 명인가요?", author: "newbie", date: "06.05", replies: 4 },
      ],
      leagues: [
        {
          name: "BDR 오픈 정규대회", slug: "bdr-open", cadence: "분기 개최", since: "2024",
          editions: [
            { round: 4, name: "BDR 서머 오픈 #4", period: "2026.06.15 ~ 06.21", teams: 38, status: "진행중", current: true, slug: "bdr-summer-4" },
            { round: 3, name: "BDR 스프링 오픈 #3", period: "2025.04.05 ~ 04.13", teams: 40, status: "종료", champion: "한강 불스", runnerup: "성남 스타스" },
            { round: 2, name: "BDR 가을 오픈 #2", period: "2024.10.12 ~ 10.20", teams: 36, status: "종료", champion: "성남 스타스", runnerup: "부평 코어" },
            { round: 1, name: "BDR 봄 오픈 #1", period: "2024.04.06 ~ 04.14", teams: 32, status: "종료", champion: "한강 불스", runnerup: "송파 레인" },
          ],
        },
        {
          name: "BDR 정규리그", slug: "bdr-league", cadence: "연간 시즌제", since: "2023",
          editions: [
            { round: 3, name: "2026 스프링 시즌", period: "2026.03.07 ~ 05.16", teams: 44, status: "종료", champion: "송파 불스", runnerup: "마포 레이커스" },
            { round: 2, name: "2024 시즌", period: "2024.03.02 ~ 05.18", teams: 44, status: "종료", champion: "송파 불스", runnerup: "용산 워리어스" },
            { round: 1, name: "2023 창립 시즌", period: "2023.03.11 ~ 05.20", teams: 40, status: "종료", champion: "마포 레이커스", runnerup: "송파 불스" },
          ],
        },
      ],
      events: [
        { slug: "bdr-winter-u18", name: "BDR 윈터컵 U18", status: "예정", tone: "navy", period: "2026.12.20 ~ 12.21", teams: 16 },
        { slug: "bdr-charity", name: "한강 자선 농구대회", status: "종료", tone: "mute", period: "2025.09.21", teams: 24 },
      ],
    },
  };
})();
