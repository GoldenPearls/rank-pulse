import { NextRequest, NextResponse } from 'next/server';
import { hasNaverSearchAd } from '@/lib/env';
import { searchadExpand } from '@/lib/naver';

export const runtime = 'nodejs';


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const seed = url.searchParams.get('seed') || '';
  const topN = Number(url.searchParams.get('topN') || '50');

  if (!seed.trim()) {
    return new NextResponse('seed is required', { status: 400 });
  }

  if (!hasNaverSearchAd()) {
    return new NextResponse('SearchAd 환경변수가 없어서 키워드 확장을 사용할 수 없습니다.', { status: 400 });
  }

  try {
    const r = await searchadExpand(seed, topN);
    return NextResponse.json(r);
  } catch (e: any) {
    return new NextResponse(e?.message || 'SearchAd error', { status: 502 });
  }
}
