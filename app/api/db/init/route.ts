import { NextResponse } from 'next/server';
import { dbInit } from '@/lib/db';

export const runtime = 'nodejs';


export async function POST() {
  try {
    const r = await dbInit();
    return NextResponse.json(r);
  } catch (e: any) {
    return new NextResponse(
      `DB 초기화 실패: ${e?.message || String(e)}\n\n힌트: Vercel Postgres를 연결하거나 POSTGRES_URL을 설정하세요.`,
      { status: 500 }
    );
  }
}
