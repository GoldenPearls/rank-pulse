import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { listAllTrackedIds } from '@/lib/db';

// Reuse snapshot runner by calling internal API endpoint would be easy,
// but in serverless that adds overhead. We'll import the same logic.
import { getTrackedKeyword, insertSnapshot } from '@/lib/db';
import { findBlogRankInKeyword, searchadSearchVolume } from '@/lib/naver';
import { hasNaverSearchAd } from '@/lib/env';

export const runtime = 'nodejs';


async function runOne(trackedId: number, maxRank: number) {
  const tk = await getTrackedKeyword(trackedId);
  if (!tk) return { ok: false, trackedId, error: 'tracked keyword not found' };

  let rank: number | null = null;
  let docTotal: number | null = null;
  let volumePc: number | null = null;
  let volumeMo: number | null = null;
  let volumeTotal: number | null = null;
  let compIdx: number | null = null;

  let status: string | null = 'ok';
  let error: string | null = null;

  try {
    const r = await findBlogRankInKeyword({ keyword: tk.keyword, blogId: tk.blog_id, maxRank });
    rank = r.rank;
    docTotal = r.docTotal;
  } catch (e: any) {
    status = 'naver_search_error';
    error = e?.message || String(e);
  }

  if (hasNaverSearchAd()) {
    try {
      const v = await searchadSearchVolume(tk.keyword);
      const item = v.item;
      if (item) {
        volumePc = item.monthlyPcQcCnt;
        volumeMo = item.monthlyMobileQcCnt;
        volumeTotal = item.monthlyTotalQcCnt;
        compIdx = item.compIdx;
      }
    } catch (e: any) {
      status = status === 'ok' ? 'searchad_error' : status;
      error = error ? `${error}; SearchAd: ${e?.message || String(e)}` : `SearchAd: ${e?.message || String(e)}`;
    }
  } else {
    status = status === 'ok' ? 'ok_no_searchad' : status;
  }

  const ins = await insertSnapshot({
    trackedId,
    rank,
    docTotal,
    volumePc,
    volumeMobile: volumeMo,
    volumeTotal,
    compIdx,
    status,
    error,
  });

  return { ok: true, trackedId, snapshotId: ins.id };
}

export async function GET(req: NextRequest) {
  // Optional cron secret
  if (env.CRON_SECRET) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return new NextResponse('Forbidden (bad CRON_SECRET)', { status: 403 });
    }
  }

  const url = new URL(req.url);
  const maxRank = Math.max(1, Math.min(1000, Number(url.searchParams.get('maxRank') || '500')));

  const ids = await listAllTrackedIds();
  const results = [] as any[];

  for (const id of ids) {
    try {
      results.push(await runOne(id, maxRank));
    } catch (e: any) {
      results.push({ ok: false, trackedId: id, error: e?.message || String(e) });
    }
  }

  return NextResponse.json({ ok: true, message: 'cron snapshot done', count: results.length });
}
