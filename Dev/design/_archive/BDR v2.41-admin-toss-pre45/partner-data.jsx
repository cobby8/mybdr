/* global window */
// ============================================================
// partner-data.jsx — 협력업체 콘솔 데이터 (self-serve)
// ============================================================
window.PT_KPI = [
  { label: "이번달 예약", value: "318", delta: 12, icon: "calendar-check", tone: "primary" },
  { label: "캠페인 노출", value: "84.2K", delta: 6, icon: "eye", tone: "violet" },
  { label: "평균 클릭률", value: "3.4%", delta: 8, icon: "mouse-pointer-click", tone: "ok" },
  { label: "정산 예정", value: "₩4.62M", delta: -3, icon: "wallet", tone: "warn" },
];

window.PT_BOOK = [
  { m: "1월", v: 210 }, { m: "2월", v: 248 }, { m: "3월", v: 262 },
  { m: "4월", v: 291 }, { m: "5월", v: 305 }, { m: "6월", v: 318 }, { m: "7월", v: 96, soft: true },
];

window.PT_RECENT = [
  { id: 1, icon: "calendar-check", tone: "primary", t: "강남 실내코트 A · 주말 정기대관", s: "BDR 클럽 · 토 09–12시", time: "방금" },
  { id: 2, icon: "calendar-check", tone: "ok", t: "송파 야외코트 · 단발 예약", s: "개인 · 일 18–20시", time: "12분 전" },
  { id: 3, icon: "megaphone", tone: "violet", t: "여름 시즌 배너 캠페인 노출 +2.1K", s: "홈 상단 슬롯", time: "1시간 전" },
  { id: 4, icon: "wallet", tone: "warn", t: "6월 정산 명세서 발행", s: "₩4.62M · 7/10 입금 예정", time: "어제" },
];

// 내 시설 (venue)
window.PT_VENUES = {
  head: "내 시설", sub: "등록한 코트·시설의 운영 상태와 예약 현황을 관리합니다.", addLabel: "시설 등록",
  cols: [
    { key: "court", label: "시설", w: "minmax(0,2fr)", type: "avatar" },
    { key: "type", label: "유형", w: "96px", align: "center", type: "badge" },
    { key: "hours", label: "운영 시간", w: "minmax(0,1.1fr)", type: "muted" },
    { key: "bookings", label: "월 예약", w: "84px", align: "center", type: "mono" },
    { key: "rate", label: "가동률", w: "84px", align: "center", type: "mono" },
    { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
    { key: "act", label: "", w: "60px", align: "right", type: "actions" },
  ],
  rows: [
    { id: "v1", name: "강남 실내코트 A", sub: "서울 강남구 · 풀코트 2면", color: "#3182F6", type: "badge", badge: "실내", tone: "blue", hours: "06:00–24:00", bookings: 142, rate: "78%", st: "운영중", sttone: "ok" },
    { id: "v2", name: "강남 실내코트 B", sub: "서울 강남구 · 하프코트 3면", color: "#1B3C87", type: "badge", badge: "실내", tone: "blue", hours: "06:00–24:00", bookings: 98, rate: "64%", st: "운영중", sttone: "ok" },
    { id: "v3", name: "송파 야외코트", sub: "서울 송파구 · 풀코트 1면", color: "#16a34a", type: "badge", badge: "야외", tone: "green", hours: "09:00–22:00", bookings: 61, rate: "52%", st: "운영중", sttone: "ok" },
    { id: "v4", name: "성수 루프탑코트", sub: "서울 성동구 · 하프코트 1면", color: "#E2A03F", type: "badge", badge: "야외", tone: "amber", hours: "11:00–21:00", bookings: 17, rate: "—", st: "점검중", sttone: "warn" },
  ],
};

// 캠페인 목록
window.PT_CAMPAIGNS = {
  head: "캠페인", sub: "운영 중인 프로모션·배너 캠페인의 성과를 확인합니다.", addLabel: "캠페인 생성",
  cols: [
    { key: "name", label: "캠페인", w: "minmax(0,2fr)", type: "title" },
    { key: "slot", label: "노출 영역", w: "minmax(0,1.2fr)", type: "muted" },
    { key: "period", label: "기간", w: "minmax(0,1.3fr)", type: "mono" },
    { key: "imp", label: "노출", w: "92px", align: "center", type: "mono" },
    { key: "ctr", label: "클릭률", w: "84px", align: "center", type: "mono" },
    { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
  ],
  rows: [
    { id: "c1", name: "여름 시즌 대관 할인", sub: "주말 대관 20% 할인", slot: "홈 상단 배너", period: "06.01–07.31", imp: "42.1K", ctr: "4.1%", type: "badge", badge: "진행중", tone: "ok" },
    { id: "c2", name: "신규 코트 오픈 프로모션", sub: "강남 B코트 첫 예약 무료", slot: "코트 검색 결과", period: "06.10–06.30", imp: "28.6K", ctr: "3.2%", type: "badge", badge: "진행중", tone: "ok" },
    { id: "c3", name: "평일 야간 타임 세일", sub: "21시 이후 30% 할인", slot: "지역 추천 슬롯", period: "05.01–05.31", imp: "13.5K", ctr: "2.6%", type: "badge", badge: "종료", tone: "grey" },
    { id: "c4", name: "루프탑코트 사전 예약", sub: "오픈 대기 등록", slot: "홈 하단 카드", period: "07.05–08.05", imp: "0", ctr: "—", type: "badge", badge: "대기", tone: "amber" },
  ],
};

// 캠페인 상세 (drill-in 예시)
window.PT_CAMPAIGN_DETAIL = {
  name: "여름 시즌 대관 할인",
  meta: "홈 상단 배너 · 06.01–07.31 · 진행중",
  kpi: [
    { label: "총 노출", value: "42.1K", delta: 9, icon: "eye", tone: "violet" },
    { label: "클릭", value: "1,726", delta: 14, icon: "mouse-pointer-click", tone: "primary" },
    { label: "클릭률", value: "4.1%", delta: 5, icon: "percent", tone: "ok" },
    { label: "전환(예약)", value: "212", delta: 11, icon: "calendar-check", tone: "ok" },
  ],
  daily: [
    { m: "1주", v: 4200 }, { m: "2주", v: 5100 }, { m: "3주", v: 6400 },
    { m: "4주", v: 7200 }, { m: "5주", v: 8800 }, { m: "6주", v: 9400 }, { m: "7주", v: 980, soft: true },
  ],
  slots: [
    { id: 1, icon: "layout-template", color: "#3182F6", t: "홈 상단 배너", v: "62%" },
    { id: 2, icon: "search", color: "#6D5AE6", t: "코트 검색 결과", v: "26%" },
    { id: 3, icon: "map-pin", color: "#16a34a", t: "지역 추천 슬롯", v: "12%" },
  ],
};

// 정산
window.PT_SETTLE = {
  head: "정산", sub: "시설 대관·캠페인 수익의 정산 내역을 확인합니다.", addLabel: null,
  cols: [
    { key: "month", label: "정산월", w: "minmax(0,1fr)", type: "title" },
    { key: "booking", label: "대관 수익", w: "minmax(0,1fr)", type: "money" },
    { key: "fee", label: "수수료", w: "minmax(0,1fr)", type: "mono" },
    { key: "net", label: "정산액", w: "minmax(0,1fr)", type: "money" },
    { key: "status", label: "상태", w: "100px", align: "center", type: "badge" },
  ],
  rows: [
    { id: "s1", name: "2026년 6월", sub: "318건 대관", booking: "₩5.14M", fee: "−₩0.52M", net: "₩4.62M", type: "badge", badge: "입금 예정", tone: "amber" },
    { id: "s2", name: "2026년 5월", sub: "305건 대관", booking: "₩4.88M", fee: "−₩0.49M", net: "₩4.39M", type: "badge", badge: "입금 완료", tone: "ok" },
    { id: "s3", name: "2026년 4월", sub: "291건 대관", booking: "₩4.51M", fee: "−₩0.45M", net: "₩4.06M", type: "badge", badge: "입금 완료", tone: "ok" },
  ],
};
