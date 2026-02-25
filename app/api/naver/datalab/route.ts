import { NextRequest, NextResponse } from 'next/server';
import { naverDatalabSearchTrend } from '@/lib/naver';

export const runtime = 'nodejs';


export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse('invalid json', { status: 400 });

  // Minimal validation
  if (!body.startDate || !body.endDate || !body.timeUnit || !Array.isArray(body.keywordGroups)) {
    return new NextResponse('startDate/endDate/timeUnit/keywordGroups are required', { status: 400 });
  }

  const r = await naverDatalabSearchTrend(body);
  return NextResponse.json(r);
}
