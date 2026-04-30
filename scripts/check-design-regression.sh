#!/bin/bash
# 박제 회귀 + 디자인 안티패턴 자동 검출
# 사용: bash scripts/check-design-regression.sh
#
# 검출 항목:
#   1) alert('준비 중')      — E형 라우팅 누락 후보
#   2) 인라인 gridTemplateColumns: repeat(N, 1fr) — 모바일 깨짐 후보
#   3) lucide-react import   — Material Symbols 정책 위반
#   4) 하드코딩 hex 색상      — 정보성(토큰화 권장)

set -e
EXIT=0

echo "=== 1. alert('준비 중') 신규 추가 검출 ==="
# grep -E 사용 — 이스케이프된 따옴표(\x27=홑, \x22=쌍) 모두 매치
ALERT_HITS=$(grep -rnE 'alert\((\x22|\x27)준비 중' src/ 2>/dev/null | wc -l)
if [ "$ALERT_HITS" -gt 0 ]; then
  echo "⚠️  alert('준비 중') $ALERT_HITS건 발견. E형 검토 필요."
  grep -rnE 'alert\((\x22|\x27)준비 중' src/ | head -10
  EXIT=1
else
  echo "OK — 0건"
fi

echo ""
echo "=== 2. 인라인 gridTemplateColumns repeat(N, 1fr) 모바일 미대응 ==="
# auto-fit / auto-fill / minmax 패턴은 반응형으로 간주하여 제외
GRID_HITS=$(grep -rn "gridTemplateColumns:.*repeat" src/ 2>/dev/null | grep -v "auto-fit" | grep -v "auto-fill" | wc -l)
if [ "$GRID_HITS" -gt 0 ]; then
  echo "⚠️  인라인 grid repeat $GRID_HITS건. auto-fit minmax() 또는 className 분기 권장."
  grep -rn "gridTemplateColumns:.*repeat" src/ | grep -v "auto-fit" | grep -v "auto-fill" | head -10
  EXIT=1
else
  echo "OK — 0건"
fi

echo ""
echo "=== 3. lucide-react import 검출 ==="
LUCIDE_HITS=$(grep -rnE "from ['\"]lucide-react" src/ 2>/dev/null | wc -l)
if [ "$LUCIDE_HITS" -gt 0 ]; then
  echo "🔴 lucide-react import $LUCIDE_HITS건. Material Symbols Outlined로 교체 필요."
  grep -rnE "from ['\"]lucide-react" src/ | head -10
  EXIT=1
else
  echo "OK — 0건"
fi

echo ""
echo "=== 4. 하드코딩 색상 hex (정보성) ==="
# var(--*) 와 줄코멘트(// 뒤에 # 색상) 제외 — 잔존은 의도일 수 있어 EXIT 영향 X
HEX_HITS=$(grep -rnE "#[0-9a-fA-F]{6}" src/ --include="*.tsx" 2>/dev/null | grep -v "var(--" | grep -v "//.*#" | wc -l)
echo "ℹ️  hex 색상 $HEX_HITS건 발견 (var(--*) 토큰 권장 — 일부는 의도적 가능)"

echo ""
if [ "$EXIT" -eq 0 ]; then
  echo "✅ 회귀 검사 통과"
else
  echo "❌ 위 항목 검토 필요"
fi
exit $EXIT
