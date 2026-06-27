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
      series: "BDR 오픈 시리즈",
      org: "BDR 농구문화",
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
  };
})();
