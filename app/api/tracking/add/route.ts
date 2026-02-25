import { NextRequest, NextResponse } from 'next/server';
import { addTrackedKeyword } from '@/lib/db';

export const runtime = 'nodejs';


export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse('invalid json', { status: 400 });

  const blogId = String(body.blogId || '').trim();
  const keyword = String(body.keyword || '').trim();
  const project = body.project === null || body.project === undefined ? null : String(body.project);

  if (!blogId || !keyword) {
    return new NextResponse('blogId and keyword are required', { status: 400 });
  }

  try {
    const r = await addTrackedKeyword({ blogId, keyword, project });
    return NextResponse.json(r);
  } catch (e: any) {
    return new NextResponse(`추적 추가 실패: ${e?.message || String(e)}`, { status: 500 });
  }
}
