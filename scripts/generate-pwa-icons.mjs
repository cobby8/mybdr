// PWA 아이콘 5종 일괄 생성 (BDR Navy 배경 + 로고 중앙 합성)
// - 이유: NextJS 기본 아이콘이 깔려 있어 모바일 PWA 설치 시 BDR 브랜딩이 노출되지 않음.
//   sharp로 정사각 캔버스를 만들고 로고를 중앙에 합성하여 manifest 5종 src와 매칭되는 파일을 한 번에 생성.
// - 사용: `node scripts/generate-pwa-icons.mjs` (1회용)
// - 출력: public/icons/{apple-touch-icon|icon-192x192|icon-512x512|maskable-192x192|maskable-512x512}.png
//
// 색상: BDR Navy #1B3C87 (manifest theme_color와 일치)
// safe zone:
//  - 일반 (any): 로고를 캔버스 70%로 축소
//  - maskable: Android adaptive icon 안전 영역 고려 → 55%로 더 작게 (모서리 잘림 방지)

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// 소스 로고: BDR v2 자산 (184x82 세로형 비율 PNG)
const SOURCE = path.join(ROOT, "Dev/design/BDR v2/assets/bdr-logo.png");
// 출력 디렉토리: PWA manifest가 가리키는 경로
const OUT_DIR = path.join(ROOT, "public/icons");

// BDR Navy #1B3C87 → RGB(27, 60, 135). theme_color와 동일.
const BG = { r: 27, g: 60, b: 135, alpha: 1 };

// 일반 아이콘 (purpose: any): 로고 70% 비율로 중앙 배치
const SIZES = [
  { size: 180, name: "apple-touch-icon.png" }, // iOS 홈화면
  { size: 192, name: "icon-192x192.png" },     // Android 일반 + shortcuts 아이콘
  { size: 512, name: "icon-512x512.png" },     // Android 고해상도 + splash
];

// maskable 아이콘 (purpose: maskable): Android adaptive icon
// safe zone은 중앙 80% (40% 반경) → 로고는 더 안전하게 55%만
const MASKABLE_SIZES = [192, 512];

async function ensureSourceExists() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`소스 로고를 찾을 수 없음: ${SOURCE}`);
  }
}

async function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
}

// 정사각형 캔버스 + 중앙 로고 합성
async function makeIcon(canvasSize, logoRatio, outPath) {
  // 로고를 캔버스 비율에 맞게 contain 리사이즈 (가로 기준)
  const logoTargetWidth = Math.floor(canvasSize * logoRatio);
  const logoBuf = await sharp(SOURCE)
    .resize({ width: logoTargetWidth, fit: "inside" }) // 비율 유지하며 안에 맞춤
    .toBuffer();

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logoBuf, gravity: "center" }]) // 중앙 합성
    .png()
    .toFile(outPath);

  const stat = fs.statSync(outPath);
  return { path: outPath, bytes: stat.size };
}

async function main() {
  await ensureSourceExists();
  await ensureOutDir();

  const results = [];

  // 일반 아이콘 (any purpose) — 로고 70%
  for (const { size, name } of SIZES) {
    const out = path.join(OUT_DIR, name);
    const r = await makeIcon(size, 0.7, out);
    results.push({ ...r, type: "any", size });
  }

  // maskable 아이콘 — 로고 55% (safe zone 보장)
  for (const size of MASKABLE_SIZES) {
    const out = path.join(OUT_DIR, `maskable-${size}x${size}.png`);
    const r = await makeIcon(size, 0.55, out);
    results.push({ ...r, type: "maskable", size });
  }

  console.log("\n=== PWA 아이콘 생성 완료 ===");
  for (const r of results) {
    const rel = path.relative(ROOT, r.path).replace(/\\/g, "/");
    console.log(`  [${r.type.padEnd(8)}] ${r.size}px  ${(r.bytes / 1024).toFixed(1)} KB  ${rel}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("❌ 아이콘 생성 실패:", err);
  process.exit(1);
});
