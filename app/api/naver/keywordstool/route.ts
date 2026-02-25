import { NextRequest, NextResponse } from 'next/server';
import { searchadSearchVolume } from '@/lib/naver';
import { hasNaverSearchAd } from '@/lib/env';

export const runtime = 'nodejs';


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const keyword = url.searchParams.get('keyword') || '';
  if (!keyword.trim()) {
    return new NextResponse('keyword is required', { status: 400 });
  }

  if (!hasNaverSearchAd()) {
    return NextResponse.json({ keyword, item: null, note: 'SearchAd 환경변수가 없어서 검색량을 조회하지 않았습니다.' });
  }

  try {
    const { item, note } = await searchadSearchVolume(keyword);
    return NextResponse.json({ keyword, item, note });
  } catch (e: any) {
    return new NextResponse(e?.message || 'SearchAd error', { status: 502 });
  }
}
