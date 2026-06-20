# DATA-BINDING — 관리자 Toss 모듈 (P0)

> 시안: `design-files/AdminToss.html` · 레퍼런스 BDR-join-v1
> CLI 박제 기준 계약.

---

## 1. 종별 마스터 (admin_categories)

```
admin_categories {
  id, name (종별명),
  divisions: string[],   // 태그
  ages: string[]         // 태그 (연령/옵션, 없을 수 있음)
}
```
4종 시드 (사용자 실데이터 복원):
| 종별 | divisions | ages |
|------|-----------|------|
| 일반부 | D3 D4 D5 D6 D7 D8 | — |
| 유청소년 | 하모니 i1 i2 i3 i4 | U8~U18 |
| 대학부 | U1 U2 U3 | — |
| 시니어 | S1 S2 S3 | +40 +45 +50 +55 +60 +65 +70 |

- ⚠ BDR-join-v1의 `tournament_presets`/PresetManager는 **미연결 고아** → 베끼지 말 것. 종별 프리셋의 실체 = admin_categories.

---

## 2. 대회 생성 시 자동화 (Phase 2 연계)
- `DivisionGeneratorModal` 이 admin_categories 읽어 종별 생성(성별→종별→디비전).
- 종별 확정 시 `TournamentDivisionRule` 자동 생성(code/label/format/settings/정원/참가비).
- 이전 대회 복사 — format/settings 포함 프리필.

---

## 3. 참가신청 = 팀 로스터 조인 (명단 입력 폐지 — 핵심)

```
1. 로그인 사용자의 가입 팀 목록 조회 (teams where 사용자 ∈ members)
2. 팀 선택 → 팀 정보 + roster(players) 표시
3. 종별/디비전 선택 → div_caps + 현재 집계로 WAITING 판정
4. 출전 선수 = 팀 roster 에서 선택 (players 직접 입력 X)
   → tournament_team_players (team_player_id 조인) 신규
5. 제출: 서버 정원 재판정 → status APPLIED | WAITING
```
- 유니폼 = 팀 설정값 사용 (신청 시 입력 없음).
- ⏳ 출전 최소인원 / 게스트 = 추후 결정 (시안 토글 off).

---

## 4. 상태 머신 (TournamentTeam)
- status: APPLIED(접수완료) | WAITING(대기접수) | CONFIRMED(참가확정) | CANCELED(취소)
- payment_status: pending(미입금) | paid(입금완료) | refunded(환불완료)
- **입금완료(paid) → 자동 CONFIRMED** (Phase 2 참가팀 관리).
- mybdr 매핑: `TournamentTeam.status`(pending/approved/rejected/paid).

---

## 5. 호환 (기존 mybdr 모델)
`Tournament.categories(=divs)/div_caps/div_fees/places/entry_fee/bank_*/gender/gameTime/gameBall/gameMethod`, `TournamentTeam.status/payment_status`, players(보유 — 선택만).

## 6. 추가 필요
- `admin_categories` 마스터 테이블 + 4종 시드
- 종별 확정 시 `TournamentDivisionRule` 자동 생성
- 정원 집계 WAITING 판정
- 참가신청 팀 로스터 조인 테이블 (출전 선수 선택)
