import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

(async () => {
  const dist = await p.$queryRaw<any[]>`
    SELECT game_type, COUNT(*)::int as cnt FROM games GROUP BY game_type ORDER BY game_type
  `;
  console.log("== game_type 분포 ==");
  console.log(dist);

  const fmt = await p.$queryRaw<any[]>`
    SELECT
      COUNT(CASE WHEN description ILIKE '%자체전%' THEN 1 END)::int as 자체전,
      COUNT(CASE WHEN description ILIKE '%교류전%' THEN 1 END)::int as 교류전,
      COUNT(CASE WHEN description ILIKE '%픽업%' THEN 1 END)::int as 픽업,
      COUNT(CASE WHEN description ILIKE '%게스트%' THEN 1 END)::int as 게스트단어포함,
      COUNT(CASE WHEN description ~ '게스트.{0,10}모집' THEN 1 END)::int as 게스트모집표현,
      COUNT(CASE WHEN description ~ '게스트.{0,5}비용' THEN 1 END)::int as 게스트비용필드,
      COUNT(*)::int as total
    FROM games WHERE description IS NOT NULL
  `;
  console.log("\n== 본문 키워드 분포 (description NOT NULL) ==");
  console.log(fmt);

  // 자체전 vs 교류전 vs 픽업 분포 (중복 가능)
  const overlap = await p.$queryRaw<any[]>`
    SELECT
      COUNT(CASE WHEN description ILIKE '%자체전%' AND description ILIKE '%교류전%' THEN 1 END)::int as 자체교류_둘다,
      COUNT(CASE WHEN description ILIKE '%자체전%' AND description NOT ILIKE '%교류전%' THEN 1 END)::int as 자체전만,
      COUNT(CASE WHEN description ILIKE '%교류전%' AND description NOT ILIKE '%자체전%' THEN 1 END)::int as 교류전만,
      COUNT(CASE WHEN description NOT ILIKE '%자체전%' AND description NOT ILIKE '%교류전%' THEN 1 END)::int as 둘다없음
    FROM games WHERE description IS NOT NULL
  `;
  console.log("\n== 자체전/교류전 중복 분포 ==");
  console.log(overlap);

  await p.$disconnect();
})();
