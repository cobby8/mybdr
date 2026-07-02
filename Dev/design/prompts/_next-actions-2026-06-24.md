# 오늘의 액션 (2026-06-24) — Cowork 자동 루프

> v2.40 릴리스 완료 상태. 새 zip 없음. 다음 = 일관성 QA paste → STAGE E 착수.
> ⚠️ 본 세션 git 점검 중 `.git/config`·`.git/HEAD`·index 에서 NUL 손상 재발견 (§알림 참조).

---

## ☐ 액션 1 — Claude.ai paste · 일관성 QA v2.40 (2분)

QA 패키지는 6/23 작성 완료 상태. 아직 Claude.ai 전달 전이면 오늘 진행:

- 첨부 2건:
  1. `Dev/design/prompts/design-consistency-qa-brief-2026-06-23.md`
  2. `Dev/design/_zips/BDR-current-v2.40-QA-baseline-2026-06-23.zip`
- paste 본문: `design-consistency-qa-delivery-2026-06-23.md` §paste 본문 그대로

## ☐ 액션 2 — Claude.ai paste · STAGE E Home+Legal (2분 · QA와 병행 가능)

오늘 새로 작성됨: `stage-e-home-legal-brief-2026-06-24.md`

- 대상: `/` · `/privacy` · `/terms` · `/safety` · `/~offline` (전부 운영 존재)
- 신규 화면 ❌ — 기존 라우트 토큰/레이아웃/카피 정합만
- paste 본문: 의뢰서 §6 그대로

## ☐ 액션 3 — git 손상 확인 (Windows 터미널, 3분 · 중요)

본 Cowork 세션 bash 에서 `.git/config` line26·`.git/HEAD`·`.git/index` 에 NUL 바이트 손상 발견.
6/23 Codex 점검에선 정상이었는데 다시 손상 → **재발 패턴**. 네이티브 Windows 터미널에서 확인:

```powershell
cd "C:\0. Programing\mybdr"
git status
git log --oneline -3
git fsck
```

- 정상 동작하면: Cowork 마운트 뷰의 일시적 sync 아티팩트일 가능성 → 무시 가능
- `index file corrupt` 등 실제 손상 시 (working tree clean 확인 후):
  ```powershell
  del .git\index
  git reset    # HEAD 기준 인덱스 재생성 (커밋·작업파일 보존, staged 변경만 소실)
  ```

---

## 상태

- v2.40 Admin Console A0~A5: ✅ 운영 반영 + BDR-current 역박제 완료
- 일관성 QA: 패키지 준비 완료 / paste 대기
- STAGE E: 의뢰서 작성 완료 (오늘) / paste 대기
- STAGE F·G: 순서 정리됨 (E 이후)

## 알림

- ⚠️ **git NUL 손상 재발** — Cowork bash 점검 시 `.git/config`(line26)·HEAD·index 손상. 읽기용으로만 config/HEAD 최소 복구(.bak 백업 보존), index 미수정. push/commit/merge 일절 안 함. → **액션 3 으로 네이티브 확인 권장**.
- 새 디자인 zip 도착 없음 (uploads·_zips 최신 = 6/23 QA baseline, Cowork 자체 생성분).
- STAGE G(PA3/referee)는 DB/API/담당 얽힘 → QA·E·F 완료 후 별도 결재.
