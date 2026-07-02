/* global window */
// ============================================================
// org-data.jsx — 단체 Self-Serve 운영 콘솔 (/org-console) 데이터
//   ⚠ 백엔드 경계 3단계 (브리프 §2)
//     [DB]  기존 컬럼 → 실동작 목표 (조회/편집/저장 시연)
//     [ADD] 무중단 추가 → "컨셉(준비중)" 라벨/톤
//     [NEW] 신규 테이블 → "컨셉(준비중)" 라벨/톤
//   ❌ 금지 mock: 설립연도 · 본부주소 · 운영원칙 · 스폰서 · 브랜드색상 (DB 컬럼 없음)
//   색상은 orgColor(id) 해시 팔레트만 — 직접 지정 UI 없음.
// ============================================================

// ── org-color 해시 팔레트 (extras-data.jsx 미러 · Toss 톤 조정) ──
window.ORG_PALETTE = ['#0F5FCC', '#1B3C87', '#2563EB', '#0E7490', '#0D9488', '#15803D', '#4F46E5', '#6D28D9', '#0369A1'];
window.orgColor = function orgColor(id) {
  let h = 0; const s = String(id || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const base = window.ORG_PALETTE[h % window.ORG_PALETTE.length];
  return { base, deep: `color-mix(in srgb, ${base} 72%, #0B0D10)`, soft: `color-mix(in srgb, ${base} 12%, #fff)` };
};

// 인증 상태 (§ deferred 컨셉) — 미인증도 중립 톤("기본 단체")
window.ORG_VERIFY = {
  basic:     { key: 'basic',     label: '기본 단체',  tone: 'grey', desc: '서류 인증 전 · 기본 기능은 바로 사용할 수 있어요' },
  reviewing: { key: 'reviewing', label: '서류 검토중', tone: 'warn', desc: '제출한 서류를 검토하고 있어요 (영업일 기준 2~3일)' },
  verified:  { key: 'verified',  label: '인증 완료',  tone: 'ok',   desc: '대표자·서류 인증을 마친 단체예요' },
};

// ── 로그인 단체 (self-serve 자기 데이터) ─────────────────────
//   [DB] id/name/type/region/intro/email/phone · [ADD] logo_url/banner_url · [NEW] verify/docs
window.ORG = {
  id: 'org_seoulbba',
  name: '서울농구협회',
  type: '협회',              // 협회 / 연맹 / 클럽 / 동호회 (enum, [DB])
  region: '서울',            // 활동 지역 (category, [DB]) — 본부주소 아님
  intro: '아마추어 농구 리그와 3x3 대회를 운영하는 단체입니다.',
  email: 'contact@seoul-bba.example',
  phone: '02-000-0000',
  role: '단체 관리자',        // 진입 = owner/admin 만
  ownerName: '김운영',
  logo_url: null,            // [ADD] 컨셉 — 미업로드 시 이니셜 폴백
  banner_url: null,          // [NEW] 컨셉 — 미업로드 시 그라데이션 폴백
  verify: 'basic',           // [NEW] basic | reviewing | verified
};

// ── 대시보드 KPI (멤버수 · 시리즈수 · 진행중 대회 · 인증 진행률) ──
window.ORG_KPI = [
  { key: 'members',  label: '전체 멤버',    value: '128',  delta: 6,  icon: 'users',         tone: 'primary', db: 'DB' },
  { key: 'series',   label: '운영 시리즈',   value: '4',    delta: 0,  icon: 'layers',        tone: 'violet',  db: 'DB' },
  { key: 'ongoing',  label: '진행중 대회',   value: '2',    delta: 1,  icon: 'trophy',        tone: 'ok',      db: 'DB' },
  { key: 'verify',   label: '인증 진행률',   value: '40%',  delta: null, icon: 'shield-check', tone: 'warn',    db: 'NEW' },
];

// ── 최근 활동 (활동 로그 — [DB] 파생) ────────────────────────
window.ORG_RECENT = [
  { id: 1, icon: 'user-plus',    tone: 'primary', t: '새 멤버 3명이 가입했어요',           s: '회원 신청 승인 · 김·이·박', time: '방금' },
  { id: 2, icon: 'trophy',       tone: 'ok',      t: '‘서울 봄 리그 5차’ 대회가 시작됐어요', s: '오픈부 16팀 · 진행중',       time: '2시간 전' },
  { id: 3, icon: 'layers',       tone: 'violet',  t: '‘주말 3x3 시리즈’에 3라운드 추가',    s: '시리즈 편성 업데이트',       time: '어제' },
  { id: 4, icon: 'megaphone',    tone: 'primary', t: '공지 ‘동절기 실내코트 안내’ 발행',     s: '멤버 128명에게 노출',        time: '2일 전' },
  { id: 5, icon: 'file-check-2', tone: 'warn',    t: '단체 인증 서류 1건 업로드',           s: '사업자등록증 · 검토 대기',    time: '3일 전' },
];

// ── 온보딩 체크리스트 (점진적 온보딩 · 장벽0 즉시 시작) ─────────
//   done=완료 / now=지금 추천 / soon=필요시점 deferred(잠금 아님)
window.ORG_ONBOARD = [
  { id: 'ob1', label: '단체 기본 정보 입력',  desc: '단체명·유형·활동 지역', state: 'done', to: 'profile' },
  { id: 'ob2', label: '멤버 초대하기',        desc: '링크로 바로 초대 (인증 불필요)', state: 'now',  to: 'members' },
  { id: 'ob3', label: '로고·배너 등록',       desc: '단체 브랜딩 꾸미기', state: 'now',  to: 'profile', concept: true },
  { id: 'ob4', label: '단체 인증 신청',       desc: '공식 대회 개최·회비 출금에 필요', state: 'soon', to: 'profile', concept: true },
];

// ── 인증·서류 현황 (단체 정보 우측 · [NEW] 컨셉) ─────────────
window.ORG_DOCS = [
  { id: 'd1', label: '사업자등록증',       req: true,  status: '검토중',  tone: 'warn' },
  { id: 'd2', label: '대표자 신분 확인',    req: true,  status: '제출 전', tone: 'grey' },
  { id: 'd3', label: '단체 규약/정관',      req: false, status: '제출 전', tone: 'grey' },
];

// ── 기본 정보 편집 필드 (조회 ↔ 편집 · [DB] 실동작 목표) ───────
window.ORG_FIELDS = [
  { k: 'name',   label: '단체명',      type: 'text',   required: true },
  { k: 'type',   label: '단체 유형',    type: 'select', options: ['협회', '연맹', '클럽', '동호회'] },
  { k: 'region', label: '활동 지역',    type: 'select', options: ['서울', '경기·인천', '강원', '충청', '전라', '경상', '제주', '전국'] },
  { k: 'intro',  label: '한줄 소개',    type: 'textarea', hint: '단체 페이지 상단에 노출돼요' },
  { k: 'email',  label: '대표 이메일',  type: 'text' },
  { k: 'phone',  label: '대표 연락처',  type: 'text' },
];
