import { NextRequest, NextResponse } from 'next/server';
import { listSnapshots } from '@/lib/db';

export const runtime = 'nodejs';


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const trackedId = Number(url.searchParams.get('trackedId') || '0');
  const limit = Number(url.searchParams.get('limit') || '200');

  if (!trackedId) return new NextResponse('trackedId is required', { status: 400 });

  try {
    const snapshots = await listSnapshots(trackedId, Math.max(1, Math.min(1000, limit)));
    return NextResponse.json({ trackedId, snapshots });
  } catch (e: any) {
    return new NextResponse(`스냅샷 조회 실패: ${e?.message || String(e)}`, { status: 500 });
  }
}
