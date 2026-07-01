# 작업 스크래치패드

> 2026-06-28 세션정리: 564줄→압축. 2026-07-01 재압축(221줄→). 완료·커밋 상세는 **git log** + `knowledge/` 참조.

## 현재 작업
- **★PUB-2+PUB-3 공개웹 DS v4 갭 교체 = 전 트랙 완료·전부 푸시**(2-3~2-10 + 3-1). PUB-2: courts/community/messages·noti·search/series·orgs/rankings·stats·profile·guest-apps·teams. PUB-3: games(3-1·c315208)·정적11p(about/help/privacy/terms/safety/referee-info/coaches/shop/gallery/awards/news)=이미 클린. calendar·saved·reviews·scrim=클린. **매핑(conventions.md 박제)**: color-text-disabled→ink-dim·navy/info/#0079B9→cafe-blue·bg-elev-2→bg-alt·유색배경 흰글자#fff→ink-on-brand / **유지**: text-primary(=ink)·text-secondary(=ink-soft) 유효별칭, 팀·유니폼 색상 데이터 hex. **PUB 갭교체 트랙 종료**. 다음=PUB 전면리뉴얼 박제(DualSideNav 셸·PUB-1 개별페이지) 또는 컷오버 잔여 결정.
- **요청**: 관리자 영역 **클린 슬레이트 그린필드 리빌딩**(2차 피벗 2026-06-28). 1차 그린필드(M1~M3)가 레거시 CSS/셸 재사용으로 시안 깔끔함 미달→전량 폐기. 시안 정본 1:1 충실 포팅·**백엔드 유지(0변경 원칙)**·DB 보전 절대.
- **★상태: 전 영역 그린필드 리빌딩 완료** (R1 토대→R2 백오피스→R3 대회관리자→R4 대회운영→R5 마법사→R6 협력/심판/평가·정산). 전부 정본 1:1·tsc+next build·회귀0·푸시·vercel 반영.
  - 신규 경로: 백오피스 `/v2`(`(admin-v2)/v2/(backoffice)`)·대회관리자 `/v2/ta`·대회운영 `/v2/operate/[id]`·마법사 `/v2/ta/tournaments/new·[id]/edit`·협력 `/partner`·심판 `/referee-console`. 디자인=`components/admin-v2`+`styles/admin-v2`+`lib/admin-v2/data`(adminFetch snake↔camel 1곳·rawBody 우회). READ=서버 Prisma직접(snake함정 차단)·mutation=adminFetch.
  - **유일 백엔드 추가**=R6-C 신규테이블 2개(`referee_evaluations`·`partner_settlements`·무중단 CREATE·db push 완료·사용자 승인). 그 외 전부 기존 API 리스킨.
- **★컷오버 진행 중**(R7·리다이렉트 점진·`/v2` 유지·사용자 결정): R7-A✅ 준비영역(대회관리자+백오피스 매칭제외) `next.config.ts` 308 redirect 17건. 레거시 무손상·롤백=규칙제거.
- **컷오버 종결 현황(2026-06-30 갱신·포팅 100%)**: 블로커 ①대회운영✅ ④협력✅(둘 다 redirect 봉인 8f99674) / ②매칭✅(목록 04ec318+상세 b75c12c·`/admin/games` 봉인은 프리뷰 검증대기) / ③-A 심판배정✅(e60b94b) — ③봉인⛔구조상불가(super전용 v2 vs 협회admin 레거시 공존)·③-B 신청관리=레거시無 신규기능(컷오버무관). **백오피스 미포팅 전부 v2 완료·푸시**: settings/logs/notifications/mypage(6c9fa39)·categories(a96dca9)·partner-console super(f06ae92)·news-console(4fe08e3). **남은 종결작업**: ①완성영역(매칭+위 백오피스) redirect 봉인 일괄(프리뷰 검증 후·next.config.ts) ②결정대기 game-reports(row0)·season-awards(버킷B) ③미포팅 잔여 analytics(지표축소 결정)·tournaments(타겟재지정)·agents(보조도구 제외).
- **미결 결정**: 매칭 deep-link vs 포팅 / **심판 봉인 불가 확정(2026-06-30)**: v2 referee-console=**super_admin 전용**(layout isSuperAdmin·주석 "협회 admin은 레거시 콘솔로")·레거시 referee/admin=**association_admin**용 → redirect 시 협회관리자 전원 마비. v2는 대체 아닌 **super 글로벌 레이어 공존**. 봉인하려면 v2 협회스코프 확장(권한재설계) 필요·별도 큰작업. 기능갭(pools/bulk-register/members상세/settlements하위 v2 부재)도 존재 / `/admin/analytics` redirect(보수적 제외 중).
- **운영**: 단독(dev 직접·subin폐지). dev→main 머지=수빈 단독. **동시 다세션** 빈번(git락·scratchpad·브랜치레이스 주의).

## 진행 현황표 (대기/후속만)
| 작업 | 상태 |
|------|------|
| 후원사 sponsors String→Json 마이그레이션 | ↩️ **커밋 bca1fb7 후 revert cee9700(운영 안정화)**. DB는 jsonb ALTER 상태 유지(백업 `_backup_sponsors_20260629`). 코드는 String 시절로 복귀 — 재추진 시 재검토 |
| gallery P2 (news_photo 실연결) | ⏸️ `stash@{0}` 보관·복원 시 `git stash pop` |
| 버킷B 관리자 잔여(시상/코치/갤러리/심판/샵/쪽지) | ⏸️ 결정 대기 `mock-data-absent-admin-plan-2026-06-14.md` |
| 대회상태 Phase2/3 후속 | ⏸️ 일부 백필 완료·잔여 대기 |
| **★컷오버 핵심 종결(2026-06-30·전부 푸시)** | ✅ **봉인**: ①④(8f99674)·매칭+백오피스7콘솔(68c1a89)·analytics(fe55267). **포팅**: ③-A 심판배정(e60b94b)·매칭 목록/상세(04ec318/b75c12c)·settings/logs/noti/mypage(6c9fa39)·categories(a96dca9)·partner-console super(f06ae92)·news-console(4fe08e3)·analytics 보강(a755a53). 전부 백엔드0변경·reviewer통과·tsc0. ⚠프리뷰 실클릭 검증=사용자 몫·롤백=규칙제거 |
| 컷오버 남은 결정/별도 트랙 | ⏸️ ③심판봉인(v2 super전용 vs 레거시 협회admin→스코프확장 권한재설계 큰작업)·③-B 신청관리(레거시無 신규기능)·game-reports(row0 빈화면)·season-awards(버킷B)·tournaments 직접봉인(상세/audit-log/transfer-organizer v2 매핑 미정)·news/compose(v2 미대응) |

## 보류 중 (재개 대기)
- **버킷 B 관리자** — 데이터부재 7기능 신규테이블·결정 5건.
- **7f28 #301 결선 슬롯** — "결승" 오생성 슬롯 잔존(예선 #291 OT1동점 미종료·#292 미기록).
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨.
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만).

## 수정 요청 (minor·후속)
- scrim PATCH 가드(captain only→isCaptain 통일) / apply-panel L510/536 raw rgba(룰10 경미) / completed-bracket L274 조내정렬 / stats·lineup 마크업·a11y.
- admin-v2 후속: 대회운영 일정저장·대진 드래그(엔드포인트 부재) / 심판 cross-assoc mutation 403(데이터~0 수용) / AdminCategory GET super전용 / payments·plans 상세·news/anonymous·BO-2매칭·court-partner(DB無) = 컷오버 블로커/후속.
- 보안 후속(점검 2026-06-29·errors.md 기록): **[즉시]** cron expire-pending-bookings CRON_SECRET 미설정 시 무인증 / jwt jti 블랙리스트 미구현(로그아웃 후 토큰 유효). **[권장]** CSP unsafe-inline·upload rate limit 미매핑·Upstash 미설정 fallback·.env.local.bak 삭제.

## 🔒 §0 공통 필드 대조표 (픽업/매칭 도메인 reference)
- 시간 `scheduled_at`/길이 `duration_hours`(분아님)/정원 `max_participants`/승인참가 `current_participants`/참가비 `fee_per_person`(0=무료)
- 좌표=games에 없음→courts 조인. 신청 `game_applications`·status **Int** 0신청·1승인·2거절·3대기
- **game status**: 1모집·2확정·3완료·4취소 / game_type **Int**: 0픽업·1게스트·2연습
- 출석=`game_applications.attended_at`/노쇼=`game_player_ratings.is_noshow`/매너=`users.manner_score`+`manner_count`
> 대회 도메인 필드 = `Dev/design/BDR v2.41-admin-toss/_PR0-CONTRACT-CONFIRMED.md §5`. snake↔camel = apiSuccess 자동변환(errors.md 다수).

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-07-01 | PUB-3 PR-PUB-3-1 games DS v4 갭 교체 | ✅ **[developer]** 11파일·20건 스왑(전부 `var(--ink-on-brand)`). **#fff→ink-on-brand**(유색/브랜드/danger/accent 배경 위 흰 전경색만, 18건): page×2(트로피 accent·댓글아바타 cafe-blue/ink-dim)·profile-banner(primary버튼)·summary-card×2(kind배지·ok상태)·apply-step×2(ok done·bdr-red rejected 마커)·guest-apply-form×2(accent포지션·cafe-blue아바타)·report-form×3(accent별·팀아바타 p.color배경·warn/err 플래그칩)·basic-info-section×4(cafe-blue 타임픽커3+참가비칩)·reg-row(날짜블록 accent/cafe-blue)·my-games-client(cafe-blue 체크아이콘). **color-on-accent(미정의)→ink-on-brand**(2건, Tailwind arbitrary): host-applications(GUEST배지)·upgrade-modal(플랜버튼). **⚠지시서 대비 차이=step-settings.tsx 0건**(지시서 2건 예상): 유일 hex L25 `#FFFFFF`=유니폼색 select 옵션 **데이터**→불변#5로 스왑금지. **문맥 제외(불변#4·#5)**: report-form L73 `#DC2626`/`#0F5FCC`=팀A/B 색상 파생데이터(파랑만 토큰화 시 빨강과 비대칭 손상)·step-settings L25 `#FFFFFF`·summary-card UniformChip `background:color`(유니폼 데이터). 흰 surface #fff 0건. API/fetch/로직 0변경·globals미터치·미정의토큰0(ink-on-brand=globals L7193 [data-pub]). tsc EXIT0·next build EXIT0·잔존 매핑대상갭 grep0(제외 데이터hex 2건만 정상 잔존). reviewer 통과(blocker0/major0/minor0·색상데이터 무손상)+PM 스팟체크. ✅ **커밋 c315208·푸시**. 정적11p(about/help/privacy/terms/safety/referee-info/coaches/shop/gallery/awards/news)=이미 클린 |
| 2026-07-01 | PUB-2 PR-PUB-2-9 teams DS v4 갭 교체 | ✅ **[developer]** 17파일·40건 스왑. **#fff/#FFFFFF→ink-on-brand**(유색·브랜드·accent·danger·ok·role.tone·ink-dim 배경 위 흰 텍스트만): teams-content-v2×2(cafe-blue/ok 필터칩)·team-card-v2 inkOnAccent·[id]/page hero ink·teams/manage accent박스·[id]/manage×3(배너·팀링크·탭배지)·step-activity·stepper·recent-tab(L badge)·step-emblem(홈엠블럼)·force-action-modal·ghost-candidates(toast)·team-ops-card(role배지)·team-side-card(W/L)·withdraw-modal. **color-info(+#0079B9)→cafe-blue**: [id]/manage×19(color-mix/typeColor/sideColor/position badge 등)·officer-permissions(텍스트, soft배경은 대체토큰 없어 유지)·transfer/dormant-modal border. **문맥 제외(불변#1)**: 팀컬러 판정로직 #fff/#ffffff(team-card L32·[id]/page L50-51·teams/manage L322-327)·폼상태/placeholder/setter #FFFFFF·#1B3C87([id]/manage 6건·[id]/page L52·teams/manage L329 resolveAccent fallback=팀브랜드 데이터)·step-emblem L167 장식 흰테두리(텍스트·아이콘 아님)·주석 3건. team-hero-v2=주석뿐 스킵. 신규fetch0·API0·로직0·globals미터치·미정의토큰0(cafe-blue/ink-on-brand=globals L7181~ [data-pub] 정의). tsc EXIT0·next build EXIT0·잔존 매핑대상갭 grep0. reviewer 통과(blocker0/major0/minor0·팀브랜드색 무손상)+PM 스팟체크. ✅ **커밋 a669a81** |
| 2026-07-01 | PUB-2 PR-PUB-2-10 guest-apps DS v4 갭 교체 | ✅ **[developer]** 1파일·5건: guest-apps/page.tsx `#fff`→`var(--ink-on-brand)` — teamInk×3(유색 팀 배지 위 흰 텍스트)·RDM 이니셜 박스 L291·'나' 아바타 L548(둘 다 `var(--bdr-red)` 브랜드 배경 위). teamColor 하드코딩 hex는 매핑 대상 아니라 유지·surface 흰카드 0. 구토큰(color-text-disabled/navy/info/bg-elev-2/on-accent) 이 파일에 부재. 신규fetch0·API0·로직0·globals미터치·미정의토큰0(ink-on-brand=globals L7193 [data-pub] 정의). tsc EXIT0·잔존갭 grep0. PM diff검수 통과. ✅ **커밋 9731ef4** |
| 2026-07-01 | PUB-2 PR-PUB-2-8 프로필 영역 DS v4 갭 교체 | ✅ **[developer]** 11파일·30건: basketball(color-text-disabled→ink-dim×3·color-info iconBg→cafe-blue×1)·transfer-progress-card(--info→cafe-blue×3)·teams-list-card(color-on-accent,#fff→ink-on-brand)·page(ink-on-accent,#fff미정의→ink-on-brand)·billing(유색배경 흰글자→ink-on-brand×9)·activity×3·growth×2·edit×2·weekly-report(#FFFFFF×2)·danger-section-v2×2·billing-section-v2×1. 전부 유색/브랜드/danger/그라디언트 배경 위 흰글자만 스왑(surface흰색 0). weekly-report `cafe-blue,#0079B9`×4=이미DS v4 유지. text-primary/secondary·ok/danger/warn/primary/accent·rgba오버레이·#FF6B35 보존. 신규fetch0·API0·로직0·globals미터치·미정의토큰0. tsc EXIT0·next build EXIT0·잔존갭0. reviewer 통과(blocker0/major0/minor0)+PM diff검수. ✅ **커밋 89710e7** |
| 2026-07-01 | PUB-2 PR-PUB-2-7 랭킹 DS v4 갭 교체 | ✅ 커밋 e2cc5b8. 2파일: bdr-ranking-table(구토큰 11건: color-text-disabled→ink-dim×9·color-navy→cafe-blue·color-info→cafe-blue)+v2-team-board(#fff→ink-on-brand). 신규fetch0·API0·로직0·globals미터치·tsc EXIT0·build OK. stats 갭0 |
| 2026-07-01 | PUB-2 PR-PUB-2-6 시리즈·단체 4라우트 DS v4 갭 교체 | ✅ 13파일: series/page·[slug]/page·series-detail-tabs + organizations/page·orgs-list-v2·org-card-v2·[slug]/page·org-hero·org-tabs·overview·events·members·teams. 구토큰→DS v4(ink/bg-elev/bg-alt/border/cafe-blue/accent/ff-display). 신규fetch0·API0·로직0·globals미터치·tsc EXIT0·next build OK |
| 2026-07-01 | 컷오버 4-5 ③-B 심판 신청관리(inbox 승인/거절·풀연동) | ✅ 커밋 a83ca27. 6파일: 신규 API 2개(applications GET목록+[id] PATCH approve/reject·풀 createMany skipDuplicates·R2풀비삭제·R3알림없음)+apps 콘솔(_apps/page)+_referee-shell·layout 신청배지. IDOR=announcement.association_id·스키마0변경·tsc EXIT0. PM검증/security 대기 |
| 2026-07-01 | PUB-2 PR-PUB-2-5 메시지·알림·검색 DS v4 갭 교체 | ✅ 4파일: messages/page.tsx(hex→token 5건·카피2건)·notifications-client(삭제버튼 50%)·search-client(bg-elev-2→bg-alt)·search/loading(스켈레톤원 50%). 신규fetch0·API0·읽음처리0·globals미터치·tsc EXIT0·build OK |
| 2026-07-01 | 컷오버 4-2 스코핑 + 4-3 권한개방(심판콘솔 협회admin 공존) | ✅ 커밋 c2757ce. 7파일: `_referee-data`(getRefereeScope 신규·전역먼저판정 sentinel회피)+6page READ필터(referee직접 1·관계경유 5·members[id] findFirst IDOR)+layout(super전용→ctx null차단·badge/role 스코프). 백엔드0변경·4-2→4-3 순서준수·tsc EXIT0. PM 검증/security-reviewer 대기 |
| 2026-07-01 | [security] 4-2 스코핑+4-3 권한개방 보안검증(심판콘솔 협회admin 개방) | ✅ **통과·데이터누출0**(blocker0/major0/minor1문서). 누출벡터7종 차단: 전역-먼저판정 sentinel회피 정확·6page+badge3 스코프완전(Referee직접/4모델 referee관계 schema대조)·members[id] findFirst IDOR·전수 prisma READ 스코프없는것0·raw SQL0. minor=stale주석. 커밋가능 |
| 2026-07-01 | [reviewer] 4-4e 심판 공고·일자별 선정풀 코드리뷰 | ✅ **통과**(blocker0/major0/minor2). 백엔드0변경·선정워크플로우 레거시1:1·jsonb 날짜키 보존(convert.ts 검증)·POST/DELETE/PATCH 계약 verbatim·에러5종 노출·nav 3곳동기 정합. minor: 흰색 2건(on-primary 선례)·shell 상단주석 stale |
| 2026-07-01 | 컷오버 4-4e 심판 공고·일자별 선정풀(announcements+[id]·pools) v2 포팅 | ✅ 커밋 ed83f3b. 신규6파일(page thin×3+_announcements·_detail 일자별선정·_pools)+_referee-shell nav 2건. 기존 6 API·백엔드0변경·required_count jsonb rawJsonKeys 보존·하드코딩색0·tsc 출력0 |
| 2026-06-30 | PUB-2 PR-PUB-2-3 코트 로딩+상세 DS v4 갭 교체 | ✅ 3파일: courts/loading·courts/[id]/loading·courts/[id]/page.tsx(구토큰 다수 교체). 신규fetch0·API0·로직0·globals 미터치. tsc EXIT0·next build EXIT0 |
