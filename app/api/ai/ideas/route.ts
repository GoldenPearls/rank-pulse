import { NextRequest, NextResponse } from 'next/server';
import { env, hasOpenAI } from '@/lib/env';

export const runtime = 'nodejs';


function buildPrompt(args: {
  keyword: string;
  audience?: string;
  notes?: string;
  competitorTitles?: string[];
}) {
  const lines: string[] = [];
  lines.push(`너는 네이버 블로그 콘텐츠 전략가야.`);
  lines.push(`목표: 키워드 "${args.keyword}"로 상위 노출을 노리는 글 기획안을 만든다.`);
  if (args.audience) lines.push(`타겟 독자: ${args.audience}`);
  if (args.notes) lines.push(`메모/제약: ${args.notes}`);
  if (args.competitorTitles?.length) {
    lines.push('경쟁글 제목(참고용):');
    for (const t of args.competitorTitles.slice(0, 20)) lines.push(`- ${t}`);
  }
  lines.push('출력 형식:');
  lines.push('1) 클릭을 부르는 제목 10개 (각 40자 내외)');
  lines.push('2) 추천 제목 TOP 1 선정 + 이유');
  lines.push('3) 본문 목차(소제목) 8~12개');
  lines.push('4) 차별화 포인트 7개');
  lines.push('5) 실제 작성 체크리스트(사진/가격/주차/웨이팅/지도/영업시간 등)');
  lines.push('6) 태그 20개 (쉼표로)');
  return lines.join('\n');
}

async function tryResponsesAPI(prompt: string) {
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: prompt,
    }),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`responses api error: ${r.status} ${r.statusText}${text ? ` - ${text}` : ''}`);
  }

  const data: any = await r.json();
  // best-effort extraction
  const output = data.output?.[0]?.content?.map((c: any) => c.text).filter(Boolean).join('')
    ?? data.output_text
    ?? '';
  return output || JSON.stringify(data, null, 2);
}

async function tryChatCompletions(prompt: string) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`chat completions api error: ${r.status} ${r.statusText}${text ? ` - ${text}` : ''}`);
  }

  const data: any = await r.json();
  return data.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2);
}

export async function POST(req: NextRequest) {
  if (!hasOpenAI()) {
    return new NextResponse('OPENAI_API_KEY 와 OPENAI_MODEL 환경변수를 설정하세요.', { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse('invalid json', { status: 400 });

  const keyword = String(body.keyword || '').trim();
  if (!keyword) return new NextResponse('keyword is required', { status: 400 });

  const prompt = buildPrompt({
    keyword,
    audience: body.audience ? String(body.audience) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
    competitorTitles: Array.isArray(body.competitorTitles) ? body.competitorTitles.map(String) : [],
  });

  try {
    // Prefer Responses API, fallback to Chat Completions
    let text = '';
    try {
      text = await tryResponsesAPI(prompt);
    } catch {
      text = await tryChatCompletions(prompt);
    }

    return NextResponse.json({ ok: true, text });
  } catch (e: any) {
    return new NextResponse(e?.message || String(e), { status: 502 });
  }
}
