import { NextResponse } from 'next/server';
import { listTrackedKeywordsWithLatest } from '@/lib/db';

export const runtime = 'nodejs';


export async function GET() {
  try {
    const items = await listTrackedKeywordsWithLatest();
    return NextResponse.json({ items });
  } catch (e: any) {
    return new NextResponse(
      `추적 목록 조회 실패: ${e?.message || String(e)}\n\n힌트: DB 초기화(/api/db/init)를 먼저 실행하세요.`,
      { status: 500 }
    );
  }
}
