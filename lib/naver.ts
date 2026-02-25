import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { env, hasNaverSearch, hasNaverSearchAd } from './env';
import type { BlogSearchItem, KeywordRow } from './types';

function strip(html: string) {
  // Naver title/description often contains <b>...
  const s = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
}

export async function naverBlogSearch(args: {
  query: string;
  display?: number;
  start?: number;
  sort?: 'sim' | 'date';
}): Promise<{ total: number; items: BlogSearchItem[] }> {
  if (!hasNaverSearch()) {
    throw new Error('NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET 환경변수가 필요합니다.');
  }

  const display = Math.max(1, Math.min(100, args.display ?? 10));
  const start = Math.max(1, Math.min(1000, args.start ?? 1));
  const sort = args.sort ?? 'sim';

  const url = new URL('https://openapi.naver.com/v1/search/blog.json');
  url.searchParams.set('query', args.query);
  url.searchParams.set('display', String(display));
  url.searchParams.set('start', String(start));
  url.searchParams.set('sort', sort);

  const r = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': env.NAVER_SEARCH_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_SEARCH_CLIENT_SECRET,
    },
    cache: 'no-store',
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`네이버 블로그 검색 API 오류: ${r.status} ${r.statusText}${text ? ` - ${text}` : ''}`);
  }

  const data = await r.json();
  const items = (data.items || []).map((it: any) => ({
    title: strip(it.title || ''),
    link: it.link || '',
    bloggername: strip(it.bloggername || ''),
    bloggerlink: it.bloggerlink || '',
    description: strip(it.description || ''),
    postdate: it.postdate || '',
  })) as BlogSearchItem[];

  return { total: data.total ?? 0, items };
}

export async function findBlogRankInKeyword(args: {
  keyword: string;
  blogId: string;
  maxRank?: number;
  sort?: 'sim' | 'date';
}): Promise<{ rank: number | null; docTotal: number | null; checkedMaxRank: number }> {
  const maxRank = Math.max(1, Math.min(1000, args.maxRank ?? 500));
  const display = 100;
  const sort = args.sort ?? 'sim';

  let checked = 0;
  let docTotal: number | null = null;

  for (let start = 1; start <= maxRank; start += display) {
    const { total, items } = await naverBlogSearch({ query: args.keyword, display, start, sort });
    docTotal = total;
    checked = Math.min(maxRank, start + items.length - 1);

    for (let i = 0; i < items.length; i++) {
      const pos = start + i;
      const item = items[i];
      const link = item.link || '';
      const bloggerlink = item.bloggerlink || '';
      if (link.includes(args.blogId) || bloggerlink.includes(args.blogId)) {
        return { rank: pos, docTotal, checkedMaxRank: checked };
      }
      if (pos >= maxRank) break;
    }

    if (items.length < display) break;
  }

  return { rank: null, docTotal, checkedMaxRank: checked || maxRank };
}

function toIntMaybe(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    if (v.includes('<')) return 0;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function searchadKeywordstool(args: {
  hintKeywords: string;
  showDetail?: boolean;
  includeHintKeyword?: boolean;
}): Promise<{ items: KeywordRow[]; note?: string }> {
  if (!hasNaverSearchAd()) {
    return { items: [], note: 'SearchAd 환경변수가 없어서 검색량을 조회하지 않았습니다.' };
  }

  const method = 'GET';
  const uri = '/keywordstool';
  const ts = String(Date.now());
  const message = `${ts}.${method}.${uri}`;
  const sig = crypto.createHmac('sha256', env.NAVER_SEARCHAD_SECRET_KEY).update(message).digest('base64');

  const url = new URL(`https://api.searchad.naver.com${uri}`);
  url.searchParams.set('hintKeywords', args.hintKeywords);
  url.searchParams.set('showDetail', (args.showDetail ?? true) ? '1' : '0');
  if (args.includeHintKeyword !== undefined) {
    url.searchParams.set('includeHintKeyword', args.includeHintKeyword ? '1' : '0');
  }

  const r = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Timestamp': ts,
      'X-API-KEY': env.NAVER_SEARCHAD_API_KEY,
      'X-Customer': env.NAVER_SEARCHAD_CUSTOMER_ID,
      'X-Signature': sig,
    },
    cache: 'no-store',
  });

  // SearchAd는 에러 본문이 JSON인 경우가 많음
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    // 개인용이므로 바로 throw해서 원인을 보게 하는 게 디버깅에 좋음
    throw new Error(`SearchAd keywordstool 오류: ${r.status} ${r.statusText}${text ? ` - ${text}` : ''}`);
  }

  const data = await r.json();
  const list = (data.keywordList || []) as any[];

  const items: KeywordRow[] = list.map((row) => {
    const pc = toIntMaybe(row.monthlyPcQcCnt);
    const mo = toIntMaybe(row.monthlyMobileQcCnt);
    const total = (pc ?? 0) + (mo ?? 0);
    const comp = toIntMaybe(row.compIdx);
    return {
      relKeyword: row.relKeyword,
      monthlyPcQcCnt: pc,
      monthlyMobileQcCnt: mo,
      monthlyTotalQcCnt: total,
      compIdx: comp,
    };
  });

  return { items };
}

export async function searchadSearchVolume(keyword: string): Promise<{ item: KeywordRow | null; note?: string }> {
  try {
    const { items, note } = await searchadKeywordstool({ hintKeywords: keyword, showDetail: true, includeHintKeyword: true });
    if (!items.length) return { item: null, note };
    const exact = items.find((x) => x.relKeyword === keyword) || items[0];
    return { item: exact, note };
  } catch (e: any) {
    // 개인용: 에러를 상위로 올려서 UI에서 보여줌
    throw e;
  }
}

export async function searchadExpand(seed: string, topN: number): Promise<{ seed: string; items: KeywordRow[] }> {
  const { items } = await searchadKeywordstool({ hintKeywords: seed, showDetail: true, includeHintKeyword: true });
  const sorted = items
    .slice()
    .sort((a, b) => (b.monthlyTotalQcCnt ?? 0) - (a.monthlyTotalQcCnt ?? 0))
    .slice(0, Math.max(1, Math.min(200, topN)));
  return { seed, items: sorted };
}

export async function naverDatalabSearchTrend(body: any): Promise<any> {
  if (!hasNaverSearch()) {
    throw new Error('NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET 환경변수가 필요합니다.');
  }

  const r = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Naver-Client-Id': env.NAVER_SEARCH_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_SEARCH_CLIENT_SECRET,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`네이버 DataLab API 오류: ${r.status} ${r.statusText}${text ? ` - ${text}` : ''}`);
  }

  return await r.json();
}
