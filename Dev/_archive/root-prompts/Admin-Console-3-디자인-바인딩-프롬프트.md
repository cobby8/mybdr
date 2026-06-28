# 디자인 클로드용 프롬프트 ③ — S2 라이브 → 목업을 fetch로 바인딩

> S2 두 API가 main 반영 완료(운영 라이브). 콘솔 `data.js` 목업을 아래 **실측 응답 형태**로 교체하세요.
> ⚠️ 구현 응답이 스펙 §1 계약과 **형태가 다릅니다**(아래가 정답).

## 엔드포인트 (super_admin 인증 필요)
- `GET /api/web/admin/overview`
- `GET /api/web/admin/inbox?domain=&severity=&sort=priority|age&cursor=`

## 1) overview — 실측 형태 (스펙의 배열 ❌ → **객체**)
```jsonc
{
  "kpis": {
    "new_users":   { "value":142, "delta":12, "trend":[40,52,48,61,70,58,84] },
    "active_games":{ "value":37,  "delta":null },
    "month_revenue":{ "value":8420000, "delta":null },
    "recruiting_tournaments":{ "value":9, "delta":null }
  },
  "queue": { "game_reports":12, "community_posts":9, "teams":0,
             "payments":5, "court_submissions":4, "organizations":3 }
}
```
**바인딩 주의**:
- `kpis`/`queue` = **키 객체**(배열 아님). `KPIS`/`QUEUE` 매핑 시 `Object.entries` 로 순회.
- KPI에 **`unit`·`up` 없음** → `unit`/라벨은 콘솔 로컬 유지, **`up = (delta ?? 0) > 0`** 파생. `delta:null` 이면 증감 뱃지 숨김.
- `active_games` = games.status∈[1,2](모집중+확정). `month_revenue` = paid 합계(원). `recruiting_tournaments` = 모집군.
- **`queue.teams` 는 0 고정**(팀 승인 큐 모델 부재) → 'teams' 칩은 S1까지 0/숨김 처리.

## 2) inbox — 실측 형태
```jsonc
{
  "items": [
    { "id":"game_reports:8821", "domain":"game_reports", "route":"...",
      "severity":"err", "priority":1, "title":"...", "sub":"...",
      "created_at":"2026-06-15T08:20:00+09:00", "snoozed_until":null }
  ],
  "next_cursor": null
}
```
**바인딩 주의**:
- **`total` 없음** → 인박스 총건수는 `overview.queue` 합 또는 `items.length` 로 표시.
- `domain` 값 = `game_reports|community_posts|court_submissions|organizations|payments` (teams는 union 제외, 0).
- 페이지 50건 + `next_cursor`(없으면 null). 정렬 `priority`(err>warn>blue→오래된순)/`age`.
- `snoozed_until` 은 항상 null(S3 `AdminInboxState` 후 활성).

## 3) 갱신 후
- `data.js` KPIS/QUEUE/INBOX/INBOX_TOTAL 을 위 fetch 결과로 교체. `GAME_STATUS_MAP`(이미 반영)은 경기 화면에서 사용.
- 처리/넘기기 버튼은 **S1·S3 대기**(현재 읽기 전용) → ‘보류 라벨’ 대체 유지.
