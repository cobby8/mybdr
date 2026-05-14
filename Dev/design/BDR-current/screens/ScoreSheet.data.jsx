// ============================================================
// ScoreSheet — Phase 23 FIBA-paper pixel-perfect 정합
// route group `(score-sheet)` 격리 — AppNav 미포함
// 시각 박제 only — 비즈니스 로직 / API / 모달 X
// ============================================================

const SCORESHEET_MOCK = {
  teamAName: "BDR Tigers",
  teamBName: "Seoul Stallions",
  competitionName: "2026 BDR 챔피언십",
  date: "2026-05-14",
  time: "19:00",
  gameNo: "A12",
  place: "1번 코트",
  referee: "김원영",
  umpire1: "김수빈",
  umpire2: "박지훈",

  teamAPlayers: [
    { licenceNo: "A001", name: "이민준", no: "4",  playerIn: "Q1", fouls: ["P","","","",""] },
    { licenceNo: "A002", name: "정현우", no: "7",  playerIn: "Q1", fouls: ["","T","","",""] },
    { licenceNo: "A003", name: "박지호", no: "10", playerIn: "Q1", fouls: ["P","P","","",""] },
    { licenceNo: "A004", name: "최태양", no: "12", playerIn: "Q1", fouls: ["","","","",""] },
    { licenceNo: "A005", name: "강서진", no: "15", playerIn: "Q1", fouls: ["P","","","",""] },
    { licenceNo: "A006", name: "윤도현", no: "21", playerIn: "Q2", fouls: ["","","","",""] },
    { licenceNo: "A007", name: "신영재", no: "24", playerIn: "Q2", fouls: ["","P","","",""] },
    { licenceNo: "A008", name: "오성민", no: "33", playerIn: "Q3", fouls: ["","","","",""] },
    { licenceNo: "A009", name: "한지웅", no: "44", playerIn: "",   fouls: ["","","","",""] },
    { licenceNo: "A010", name: "조민혁", no: "55", playerIn: "",   fouls: ["","","","",""] },
    { licenceNo: "A011", name: "백수현", no: "66", playerIn: "",   fouls: ["","","","",""] },
    { licenceNo: "A012", name: "남궁훈", no: "77", playerIn: "",   fouls: ["","","","",""] },
  ],
  teamACoach: "이재훈",
  teamAAssistant: "김도윤",
  teamATimeoutsUsed: 1,
  teamATeamFouls: { Q1: 3, Q2: 4, Q3: 2, Q4: 0, extra: 0 },

  teamBPlayers: [
    { licenceNo: "B001", name: "권유진", no: "5",  playerIn: "Q1", fouls: ["P","","","",""] },
    { licenceNo: "B002", name: "류상호", no: "8",  playerIn: "Q1", fouls: ["","","","",""] },
    { licenceNo: "B003", name: "송재민", no: "11", playerIn: "Q1", fouls: ["P","T","","",""] },
    { licenceNo: "B004", name: "임태규", no: "13", playerIn: "Q1", fouls: ["","P","","",""] },
    { licenceNo: "B005", name: "장현수", no: "17", playerIn: "Q1", fouls: ["P","P","P","P","P"] }, // 5반칙 도달
    { licenceNo: "B006", name: "전우빈", no: "22", playerIn: "Q2", fouls: ["","","","",""] },
    { licenceNo: "B007", name: "황민석", no: "27", playerIn: "Q2", fouls: ["P","","","",""] },
    { licenceNo: "B008", name: "구본혁", no: "31", playerIn: "Q3", fouls: ["","","","",""] },
    { licenceNo: "B009", name: "유시현", no: "42", playerIn: "",   fouls: ["","","","",""] },
    { licenceNo: "B010", name: "노건호", no: "51", playerIn: "",   fouls: ["","","","",""] },
    { licenceNo: "B011", name: "안재훈", no: "63", playerIn: "",   fouls: ["","","","",""] },
    { licenceNo: "B012", name: "표성준", no: "88", playerIn: "",   fouls: ["","","","",""] },
  ],
  teamBCoach: "이준영",
  teamBAssistant: "박서준",
  teamBTimeoutsUsed: 0,
  teamBTeamFouls: { Q1: 2, Q2: 5, Q3: 1, Q4: 0, extra: 0 }, // Q2=5 보너스 진입

  // 누적 도달 점수 — Q1 end / Q2 end / Q3 progress / Q4 end
  // null = 미진행
  periodScores: {
    A: { Q1: 20, Q2: 35, Q3: 47, Q4: null, extra: null },
    B: { Q1: 15, Q2: 30, Q3: 42, Q4: null, extra: null },
  },
  currentPeriod: 3,

  scorer: "박지수",
  assistantScorer: "이수민",
  timer: "정현지",
  shotClockOperator: "김민재",
};

Object.assign(window, { SCORESHEET_MOCK });
