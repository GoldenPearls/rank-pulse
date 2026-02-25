import { NextRequest, NextResponse } from 'next/server';
import { getTrackedKeyword, insertSnapshot, listAllTrackedIds } from '@/lib/db';
import { findBlogRankInKeyword, searchadSearchVolume } from '@/lib/naver';
import { hasNaverSearchAd } from '@/lib/env';

export const runtime = 'nodejs';


async function runOne(trackedId: number, maxRank: number) {
  const tk = await getTrackedKeyword(trackedId);
  if (!tk) {
    return { ok: false, trackedId, error: 'tracked keyword not found' };
  }

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
      // keep rank results; just annotate
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse('invalid json', { status: 400 });

  const mode = String(body.mode || 'all'); // 'all' | 'one'
  const maxRank = Math.max(1, Math.min(1000, Number(body.maxRank || 500)));

  try {
    if (mode === 'one') {
      const trackedId = Number(body.trackedId || 0);
      if (!trackedId) return new NextResponse('trackedId is required for mode=one', { status: 400 });

      const r = await runOne(trackedId, maxRank);
      return NextResponse.json({ ok: true, message: '스냅샷 완료', count: 1, results: [r] });
    }

    const ids = await listAllTrackedIds();
    const results = [];
    for (const id of ids) {
      try {
        const r = await runOne(id, maxRank);
        results.push(r);
      } catch (e: any) {
        results.push({ ok: false, trackedId: id, error: e?.message || String(e) });
      }
    }

    return NextResponse.json({ ok: true, message: '스냅샷 완료', count: results.length, results });
  } catch (e: any) {
    return new NextResponse(
      `스냅샷 실패: ${e?.message || String(e)}\n\n힌트: /api/db/init로 테이블을 먼저 만들었는지 확인하세요.`,
      { status: 500 }
    );
  }
}
