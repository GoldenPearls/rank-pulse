'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/client';
import type { KeywordRow } from '@/lib/types';

type Candidate = { token: string; count: number };

function fmtInt(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR');
}

const DEFAULT_STOPWORDS = [
  '맛집',
  '후기',
  '리뷰',
  '추천',
  '가격',
  '주차',
  '영업',
  '시간',
  '위치',
  '전화',
  '예약',
  '웨이팅',
  '내돈내산',
];

export default function CandidatesPage() {
  const [blogId, setBlogId] = useState('');
  const [project, setProject] = useState('default');
  const [text, setText] = useState('연신내 술집 추천\n연신내 맛집 데이트\n연신내 이자카야\n역촌역 맛집\n은평구 케이크\n');
  const [topN, setTopN] = useState(80);
  const [minLen, setMinLen] = useState(2);
  const [stopwords, setStopwords] = useState(DEFAULT_STOPWORDS.join(', '));

  const [volMap, setVolMap] = useState<Record<string, KeywordRow | null>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('blogId');
    if (saved) setBlogId(saved);
    const savedProj = localStorage.getItem('project');
    if (savedProj) setProject(savedProj);
  }, []);

  const candidates = useMemo(() => {
    const stops = new Set(
      stopwords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );

    // Tokenize
    const tokens: string[] = [];
    const re = /[0-9A-Za-z가-힣]+/g;
    for (const line of text.split(/\n/)) {
      const m = line.match(re);
      if (!m) continue;
      for (const t of m) {
        const tok = t.trim();
        if (tok.length < minLen) continue;
        if (stops.has(tok)) continue;
        tokens.push(tok);
      }
    }

    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);

    return Array.from(counts.entries())
      .map(([token, count]) => ({ token, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Math.max(1, Math.min(300, topN)));
  }, [text, topN, minLen, stopwords]);

  async function fetchVolume(token: string) {
    setLoading(true);
    setErr('');
    setMsg(`검색량 조회: ${token}`);
    try {
      const r = await apiGet<{ keyword: string; item: KeywordRow | null }>(`/api/naver/keywordstool?keyword=${encodeURIComponent(token)}`);
      setVolMap((prev) => ({ ...prev, [token]: r.item }));
      setMsg('완료');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function addTracking(token: string) {
    if (!blogId.trim()) {
      setErr('블로그 아이디를 먼저 입력해 주세요(상단).');
      return;
    }
    setLoading(true);
    setErr('');
    setMsg(`추적 추가: ${token}`);
    try {
      await apiPost('/api/tracking/add', { blogId: blogId.trim(), keyword: token, project: project.trim() || null });
      setMsg('추가 완료');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h1>키워드 후보</h1>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          (선택지 C)처럼 <b>내 글 제목/태그</b>를 붙여넣으면, 자주 등장하는 단어를 후보로 뽑습니다.
          <br />
          이후 SearchAd 키가 있으면 각 후보의 <b>검색량</b>도 조회할 수 있어요.
          <br />
          * 개인용이라 NLP는 최소화(단순 토큰/빈도 기반)로 두었습니다.
        </div>

        <hr />

        <div className="grid2">
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="small muted">블로그 아이디(추적 추가에 사용)</div>
                <input value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="prettylee620" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="small muted">프로젝트(선택)</div>
                <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="default" />
              </div>
            </div>

            <div>
              <div className="small muted">제목/태그 붙여넣기(한 줄 1개)</div>
              <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="small muted">상위 N</div>
                <input type="number" value={topN} onChange={(e) => setTopN(Number(e.target.value || 0))} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="small muted">최소 글자수</div>
                <input type="number" value={minLen} onChange={(e) => setMinLen(Number(e.target.value || 0))} />
              </div>
            </div>
            <div>
              <div className="small muted">제외 단어(쉼표로)</div>
              <textarea rows={4} value={stopwords} onChange={(e) => setStopwords(e.target.value)} />
            </div>
            {msg ? <div className="muted">{msg}</div> : null}
            {err ? <div className="muted" style={{ color: '#fca5a5' }}>{err}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>후보 리스트</h2>
        <div className="muted">각 단어의 빈도와 (가능하면) 검색량을 확인하고 추적에 추가하세요.</div>

        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>후보</th>
                <th>빈도</th>
                <th>월간(합)</th>
                <th>경쟁도</th>
                <th>검색량</th>
                <th>추적</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    텍스트를 입력하면 후보가 생성됩니다.
                  </td>
                </tr>
              ) : (
                candidates.map((c: Candidate, idx) => {
                  const v = volMap[c.token];
                  return (
                    <tr key={c.token}>
                      <td className="muted">{idx + 1}</td>
                      <td style={{ fontWeight: 800 }}>{c.token}</td>
                      <td>{fmtInt(c.count)}</td>
                      <td>{fmtInt(v?.monthlyTotalQcCnt)}</td>
                      <td>{fmtInt(v?.compIdx)}</td>
                      <td>
                        <button className="secondary" onClick={() => fetchVolume(c.token)} disabled={loading}>
                          조회
                        </button>
                      </td>
                      <td>
                        <button className="primary" onClick={() => addTracking(c.token)} disabled={loading}>
                          추가
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
