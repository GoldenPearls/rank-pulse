import { NextResponse } from 'next/server';
import { hasBasicAuth, hasNaverSearch, hasNaverSearchAd, hasOpenAI } from '@/lib/env';

export const runtime = 'nodejs';


export async function GET() {
  const features = {
    naverSearch: hasNaverSearch(),
    naverDatalab: hasNaverSearch(),
    naverSearchad: hasNaverSearchAd(),
    postgres: !!process.env.POSTGRES_URL || !!process.env.POSTGRES_PRISMA_URL,
    openai: hasOpenAI(),
    basicAuth: hasBasicAuth(),
  };

  const hints: string[] = [];
  if (!features.naverSearch) hints.push('NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET 를 설정하세요 (네이버 검색 OpenAPI).');
  if (!features.naverSearchad) hints.push('SearchAd(검색량/연관키워드)를 쓰려면 NAVER_SEARCHAD_* 3종을 설정하세요. (없어도 순위/문서량은 동작)');
  if (!features.postgres) hints.push('추적/저장을 쓰려면 Vercel Postgres를 연결하거나 POSTGRES_URL을 설정하세요.');
  if (!features.openai) hints.push('AI 아이디어를 쓰려면 OPENAI_API_KEY + OPENAI_MODEL 을 설정하세요(선택).');
  if (!features.basicAuth) hints.push('개인용 배포라면 BASIC_AUTH_USER/PASS 설정을 강력 추천합니다.');

  return NextResponse.json({ ok: true, features, hints });
}
