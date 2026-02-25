// lib/autoKeywords.ts
const STOP = new Set([
  "후기","리뷰","정리","추천","가격","정보","방법","구매","방문",
  "일상","기록","오늘","가능","완벽","최고","포스팅","블로그"
]);

export function extractCandidatesFromTitles(titles: string[], topN = 60) {
  const freq = new Map<string, number>();

  for (const t of titles) {
    const cleaned = t
      .replace(/<[^>]+>/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    const tokens = cleaned.split(" ").filter(Boolean);

    // 1-gram
    for (const tok of tokens) {
      const k = tok.trim();
      if (k.length < 2) continue;
      if (/^\d+$/.test(k)) continue;
      if (STOP.has(k)) continue;
      freq.set(k, (freq.get(k) ?? 0) + 1);
    }

    // 2-gram (예: "분당 호텔")
    for (let i = 0; i < tokens.length - 1; i++) {
      const a = tokens[i]?.trim();
      const b = tokens[i + 1]?.trim();
      if (!a || !b) continue;
      if (a.length < 2 || b.length < 2) continue;
      const k2 = `${a} ${b}`;
      if (STOP.has(a) || STOP.has(b)) continue;
      freq.set(k2, (freq.get(k2) ?? 0) + 1);
    }
  }

  return [...freq.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, topN)
    .map(([k]) => k);
}
