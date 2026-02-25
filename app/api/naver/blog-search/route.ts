import { NextRequest, NextResponse } from 'next/server';
import { naverBlogSearch } from '@/lib/naver';

export const runtime = 'nodejs';


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query') || '';
  const display = Number(url.searchParams.get('display') || '10');
  const start = Number(url.searchParams.get('start') || '1');
  const sort = (url.searchParams.get('sort') || 'sim') as any;

  if (!query.trim()) {
    return new NextResponse('query is required', { status: 400 });
  }

  const { total, items } = await naverBlogSearch({ query, display, start, sort });
  return NextResponse.json({ query, total, items });
}
