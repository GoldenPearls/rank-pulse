// app/api/auto/top-exposure/route.ts
import { XMLParser } from "fast-xml-parser";
import { extractCandidatesFromTitles } from "@/lib/autoKeywords";

export const dynamic = "force-dynamic";

type Req = {
  blogId: string;
  maxPosts?: number;       // RSS에서 읽을 글 수 (기본 50)
  maxCandidates?: number;  // 후보 키워드 수 (기본 50)
  maxRank?: number;        // 순위 탐색 범위 (기본 500, 최대 1000)
};

function getNaverSearchCreds() {
  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing NAVER_SEARCH_CLIENT_ID/SECRET");
  return { id, secret };
}

async function blogSearch(query: string, start: number, display: number) {
  const { id, secret } = getNaverSearchCreds();
  const url = new URL("https://openapi.naver.com/v1/search/blog.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", String(start));
  url.searchParams.set("sort", "sim");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "X-Naver-Client-Id": id,
      "X-Naver-Client-Secret": secret,
    },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Naver blog search failed: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json() as Promise<{
    items: Array<{ link: string; bloggerlink: string; title: string }>;
  }>;
}

async function findMyRank(keyword: string, blogId: string, maxRank: number) {
  const display = 100;
  const cap = Math.min(Math.max(maxRank, 1), 1000);

  for (let start = 1; start <= cap; start += display) {
    const data = await blogSearch(keyword, start, display);
    const items = data.items ?? [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const hay = `${it.bloggerlink} ${it.link}`.toLowerCase();
      if (hay.includes(blogId.toLowerCase())) return start + i; // 1-based
    }

    if (items.length < display) break;
  }
  return null;
}

async function fetchRssTitles(blogId: string, maxPosts: number) {
  const rssUrl = `https://rss.blog.naver.com/${encodeURIComponent(blogId)}.xml`;
  const res = await fetch(rssUrl, { cache: "no-store", headers: { "User-Agent": "RankPulse/1.0" } });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml);

  const itemsRaw = data?.rss?.channel?.item ?? [];
  const items = (Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw]).slice(0, maxPosts);

  // item.title이 CDATA일 때도 문자열로 들어오는 경우가 많음
  const titles = items.map((it: any) => String(it?.title ?? "")).filter(Boolean);

  return titles;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Req;

  const blogId = body.blogId?.trim();
  if (!blogId) {
    return Response.json({ ok: false, error: "블로그 아이디가 빠졌어요." }, { status: 400 });
  }

  const maxPosts = body.maxPosts ?? 50;
  const maxCandidates = body.maxCandidates ?? 50;
  const maxRank = body.maxRank ?? 500;

  // 1) RSS → 제목
  const titles = await fetchRssTitles(blogId, maxPosts);

  // 2) 제목 → 후보 키워드
  const candidates = extractCandidatesFromTitles(titles, maxCandidates);

  // 3) 후보별 내 블로그 순위 계산
  const results: Array<{ keyword: string; rank: number | null; label: string }> = [];
  for (const kw of candidates) {
    const rank = await findMyRank(kw, blogId, maxRank).catch(() => null);

    // ✅ 요구사항 2) 500위 밖이면 문구
    const label = rank ? `${rank}위` : `${maxRank}위 밖이에요.`;
    results.push({ keyword: kw, rank, label });
  }

  // rank 있는 것 우선 + 오름차순
  results.sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999));

  return Response.json({
    ok: true,
    blogId,
    maxRank,
    items: results,
  });
}
