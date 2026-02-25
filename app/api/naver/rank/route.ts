import { NextRequest, NextResponse } from 'next/server';
import { findBlogRankInKeyword } from '@/lib/naver';

export const runtime = 'nodejs';


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const keyword = url.searchParams.get('keyword') || '';
  const blogId = url.searchParams.get('blogId') || '';
  const maxRank = Number(url.searchParams.get('maxRank') || '500');

  if (!keyword.trim() || !blogId.trim()) {
    return new NextResponse('keyword and blogId are required', { status: 400 });
  }

  const r = await findBlogRankInKeyword({ keyword, blogId, maxRank });

  return NextResponse.json({
    keyword,
    blogId,
    rank: r.rank,
    docTotal: r.docTotal,
    checkedMaxRank: r.checkedMaxRank,
  });
}
