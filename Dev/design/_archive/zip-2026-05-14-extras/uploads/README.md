# Claude Project Knowledge — BDR 디자인 작업

> [Claude.ai](https://claude.ai) 의 "Projects" 기능에 업로드할 패키지.
> 매번 의뢰 시 사용자 결정 / 디자인 시스템 / AppNav frozen 자동 적용.

---

## 1. 패키지 구성 (8 파일)

```
Dev/design/claude-project-knowledge/
├── README.md                            ← 이 파일 (사용 가이드)
├── 00-master-guide.md                   ⭐ 마스터 진입점 (필수)
├── 01-user-design-decisions.md            사용자 직접 결정 8 영역
├── 02-design-system-tokens.md             색상 / 타이포 / 라운딩 / 모바일
├── 03-appnav-frozen-component.md        ⭐ AppNav frozen 코드 (필수)
├── 04-page-inventory.md                   117 페이지 박제 등급
├── 05-design-brief-template.md            시안 의뢰 표준 템플릿
├── 06-self-checklist.md                 ⭐ 시안 완료 후 자체 검수 (필수)
└── 07-custom-instructions.md              Custom Instructions 텍스트
```

⭐ = Project Knowledge 에 반드시 업로드. 굵은 글씨 3개 (00, 03, 06) 는 매번 의뢰마다 자동 참조.

---

## 2. 사용자 가이드 — 단계별 (10분)

### Step 1: Claude.ai Project 생성 (2분)

1. **[claude.ai](https://claude.ai) 로그인**
2. 좌측 사이드바 → **"+ Create Project"** 또는 "Projects" 메뉴
3. **Project 이름**: `BDR 디자인 작업`
4. **Description**:
   ```
   MyBDR 농구 매칭 플랫폼 디자인 시안 작업.
   사용자 결정 / 디자인 시스템 / AppNav frozen 자동 적용.
   ```
5. **Create Project** 클릭

### Step 2: Custom Instructions 입력 (2분)

1. Project 페이지 → 우측 또는 상단 **"Set Custom Instructions"** 또는 ⚙️ 설정
2. `07-custom-instructions.md` 파일 열기
3. § "Custom Instructions (복사 시작)" ~ § "Custom Instructions (복사 끝)" **통째로 복사**
4. Custom Instructions 텍스트 박스에 **붙여넣기**
5. **Save**

### Step 3: Project Knowledge 파일 업로드 (3분)

Project 페이지 → "Knowledge" 또는 "Add Files" 영역에서 다음 7 파일 **모두 업로드**:

```
1. 00-master-guide.md
2. 01-user-design-decisions.md
3. 02-design-system-tokens.md
4. 03-appnav-frozen-component.md
5. 04-page-inventory.md
6. 05-design-brief-template.md
7. 06-self-checklist.md
```

⚠️ `07-custom-instructions.md` 는 업로드 불필요 (이미 Custom Instructions 에 입력됨).
⚠️ `README.md` (이 파일) 도 업로드 불필요 (가이드라 Knowledge 안 됨).

### Step 4: 첫 의뢰 테스트 (3분)

Project 안에서 새 chat → 다음 테스트 메시지:

```
이 Project 의 Knowledge 가 정상 인지되는지 확인해줘.

답변:
1. 00-master-guide.md 의 13 룰을 1줄씩 요약
2. AppNav frozen 룰 7가지를 1줄씩 요약
3. 다음 시안 의뢰 시 첫 응답 형식을 보여줘
```

✅ **정상 응답 예시**:
- 13 룰 요약 (헤더/더보기/카피/토큰/모바일)
- AppNav 7 룰 (9 메인 탭/utility 우측/main 우측 4개/다크 하이브리드/아이콘만/모바일 닉네임/9번째 탭)
- §F 작업 순서의 첫 응답 형식

❌ 인지 안 됨:
- 일반적인 디자인 답변만
- "Knowledge 파일 없음" 같은 안내
- 13 룰 / 7 룰 누락

→ 인지 안 되면 Step 3 다시 (파일 업로드 확인).

---

## 3. 사용 흐름 (Project 생성 후)

### 3-1. 새 시안 의뢰

Project 안에서 새 chat → 의뢰 메시지 던지기:

```
# 의뢰: [작업명]

[작업 내용 기술]
```

→ Claude 가 Custom Instructions + Knowledge 모두 자동 인지하고 §F 의 첫 응답 형식으로 응답.

### 3-2. 시안 의뢰 시 표준 템플릿 사용

`05-design-brief-template.md` 의 §1 표준 템플릿을 채워서 의뢰. 산출물 일관성 ↑.

### 3-3. 시안 받은 후 자체 검수

Claude 가 시안 제출 시 `06-self-checklist.md` 모든 항목 ✅ 통과 보고.
사용자가 검수 결과 보고 받고 산출물 확인.

---

## 4. Project Knowledge 갱신 시점

다음 경우 Knowledge 파일 갱신 + 재업로드 필요:

| 트리거 | 갱신 파일 |
|--------|---------|
| 사용자 결정 새 영역 추가 | 01 |
| 디자인 토큰 변경 (색상 / 라운딩 등) | 02 |
| AppNav 규칙 변경 (PM 결정) | 03 |
| 신규 페이지 추가 / 박제 등급 변화 | 04 |
| 의뢰 템플릿 개선 | 05 |
| 자체 검수 항목 추가 | 06 |

→ 갱신 후 Project Knowledge 에서 옛 파일 삭제 + 새 파일 업로드.

---

## 5. 자주 묻는 질문 (FAQ)

### Q1. Project 안에서 의뢰하면 Custom Instructions 가 자동 적용?

✅ 예. 모든 chat 에 자동 주입. 매번 의뢰마다 룰 명시 불필요.

### Q2. Project Knowledge 파일을 Claude 가 항상 읽나?

자동 검색 (RAG). Claude 가 의뢰 내용에 따라 관련 파일 자동 참조. 단 파일이 너무 많으면 일부 누락 가능 → 7 파일이 적정.

### Q3. Knowledge 파일이 너무 많아 보이는데?

핵심 3 파일 (00, 03, 06) 만 업로드해도 OK. 단 사용자 결정 / 페이지 인벤토리 등은 의뢰 따라 필요할 수 있어서 7 파일 권장.

### Q4. Custom Instructions 가 너무 길어 토큰 부담?

`07-custom-instructions.md` 의 § "압축 버전" 사용. 13 룰 핵심만. Project Knowledge 가 자세한 룰을 검색.

### Q5. 같은 Project 에서 여러 작업 (마이페이지 / 결제 / 본인인증) 동시 진행?

✅ 가능. Project 안에서 chat 별로 작업 분리. Knowledge / Custom Instructions 는 모든 chat 에 공유.

### Q6. Project Knowledge 변경 시 기존 chat 영향?

기존 chat 은 옛 Knowledge 사용. 새 chat 부터 새 Knowledge 적용. 영향 받는 작업 있으면 chat 재시작 권장.

---

## 6. Project Knowledge 외에 Cowork 에서도 활용

Cowork (이 환경) 에서 작업할 때도 같은 7 파일을 참고 권장:

```
"Dev/design/claude-project-knowledge/00-master-guide.md 읽고 작업 시작해줘"
```

→ Cowork 가 첨부 파일을 직접 읽어서 룰 인지.

특히:
- CLI 박제 위임 시 03 frozen 코드 인용
- 검토 작업 시 06 self-checklist 사용
- 새 의뢰 작성 시 05 template 활용

---

## 7. 산출물 — Dev/design/BDR v2.X/

Project 에서 받은 시안은 다음 폴더에 저장:

```
Dev/design/BDR v2.3/      ← 다음 버전 (Phase 13 마이페이지 hub)
Dev/design/BDR v2.4/      ← 그 다음 (Phase 14 본인인증 ?)
Dev/design/BDR v2.5/      ← ...
```

각 버전 폴더는 이전 버전 카피 + 변경 부분만 수정.

---

## 8. 위반 발생 시 (회귀 방지)

만약 Claude 가 Knowledge 무시하고 위반 (예: AppNav 새로 그림, 가짜링크 추가 등) 했다면:

1. **즉시 작업 중단** + 위반 항목 명시
2. **§7 Custom Instructions §G** 의 "위반 시 즉시 중단" 절차 따라
3. PM 결정 후 재작업

→ Knowledge 가 정상 인지됐다면 자동 회귀 방지.

---

## 9. 외부 참조

- **Claude Projects 공식 가이드**: [Anthropic Help](https://support.anthropic.com/en/articles/9519177-using-projects-on-claude-ai)
- **사용자 결정 원본**: `Dev/design/user-design-decisions-2026-04-30.md`
- **디자인 시스템 원본**: `Dev/design/DESIGN.md`
- **현재 시안 베이스**: `Dev/design/BDR v2.2/`
- **CLAUDE.md**: 프로젝트 룰 + 보안

---

## 10. 다음 단계 (이 패키지 완성 후)

```
[지금]
├─ 사용자가 Step 1~4 진행 (Project 생성 + Knowledge 업로드 + 테스트)
└─ 첫 의뢰 던지기 (Phase 13 마이페이지)

[Phase 13 마이페이지 시안 도착]
└─ Cowork 가 시안 검수 (06-self-checklist 통과 확인)
   └─ CLI 박제 위임 (3-4h)

[향후 모든 시안]
└─ Project 안에서 의뢰 → 자동 룰 적용 → 회귀 0
```

---

## 11. 문제 발생 시 디버깅

### 증상 1: Knowledge 파일 인지 안 됨

```
원인: 파일 업로드 누락 또는 형식 오류
조치:
1. Project 페이지 → Knowledge 영역에서 7 파일 모두 보이는지 확인
2. 각 파일 클릭 → preview 정상 표시 확인
3. 새 chat 시작 → "00-master-guide.md 읽고 13 룰 요약해줘" 테스트
```

### 증상 2: Custom Instructions 무시

```
원인: 입력 후 Save 안 함 또는 텍스트 잘못 복사
조치:
1. Project 설정 → Custom Instructions 다시 열기
2. 07-custom-instructions.md 의 § "Custom Instructions (복사 시작)" ~ § "Custom Instructions (복사 끝)" 통째 다시 붙여넣기
3. Save 후 새 chat 시작
```

### 증상 3: 룰 위반 시안 도착

```
원인: Knowledge 인지는 됐지만 실수 / 우선순위 미준수
조치:
1. 시안 받은 직후 06-self-checklist.md §1~§7 모두 검수
2. 위반 발견 시 Claude 에게 명시: "§N-M 위반. 03-appnav-frozen-component.md §1 코드 그대로 카피해서 재작업"
3. 재작업 시안 받고 재검수
```
