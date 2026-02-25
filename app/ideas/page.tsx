'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/client';

export default function IdeasPage() {
  const [keyword, setKeyword] = useState('연신내술집');
  const [audience, setAudience] = useState('서울 서북권에서 술집/맛집을 찾는 20~40대');
  const [notes, setNotes] = useState('내 블로그 톤: 솔직 후기 + 가격/웨이팅/주차 정보 중요');
  const [competitors, setCompetitors] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function run() {
    setLoading(true);
    setErr('');
    setResult('');
    try {
      const r = await apiPost<{ ok: boolean; text: string }>('/api/ai/ideas', {
        keyword,
        audience,
        notes,
        competitorTitles: competitors
          .split(/\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
      });
      setResult(r.text);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h1>AI 아이디어</h1>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          선택 기능입니다. <b>OPENAI_API_KEY</b>가 설정되어 있으면, 키워드 기반으로
          <b>글 제목/소제목/구성/차별화 포인트</b>를 생성합니다.
        </div>
        <hr />

        <div className="grid2">
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <div className="small muted">키워드</div>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div>
              <div className="small muted">타겟 독자(선택)</div>
              <input value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <div>
              <div className="small muted">메모/제약(선택)</div>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <div className="small muted">경쟁글 제목(선택, 한 줄 1개)</div>
              <textarea rows={6} value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="분석 페이지 Top10 제목을 붙여넣어도 됩니다" />
            </div>
            <button className="primary" onClick={run} disabled={loading}>
              생성
            </button>
            {err ? <div className="muted" style={{ color: '#fca5a5' }}>{err}</div> : null}
          </div>

          <div>
            <div className="card" style={{ minHeight: 420 }}>
              <h2>결과</h2>
              <div className="muted">키/모델이 없으면 에러가 뜹니다(설정 페이지 참고).</div>
              <pre className="code" style={{ whiteSpace: 'pre-wrap', marginTop: 10, minHeight: 320 }}>{result || '...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
