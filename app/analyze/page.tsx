'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/client';
import type { BlogSearchItem, KeywordRow, RankResult, TrendResult } from '@/lib/types';
import LineChart from '../components/LineChart';

function fmtInt(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR');
}

function fmtRank(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return `${n}위`;
}

function calcDifficulty(args: { compIdx?: number | null; docTotal?: number | null; volume?: number | null }) {
  const c = Math.max(0, Math.min(100, args.compIdx ?? 0));
  const d = Math.log10(Math.max(1, args.docTotal ?? 1));
  const v = Math.log10(Math.max(10, args.volume ?? 10));
  // 단순 점수: 경쟁도 + 문서량 가중 - 검색량 가중
  const score = c * 0.65 + d * 18 - v * 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function AnalyzePage() {
  const [blogId, setBlogId] = useState('');
  const [keyword, setKeyword] = useState('연신내술집');
  const [maxRank, setMaxRank] = useState(500);

  const [rank, setRank] = useState<RankResult | null>(null);
  const [volume, setVolume] = useState<KeywordRow | null>(null);
  const [topPosts, setTopPosts] = useState<BlogSearchItem[]>([]);
  const [trend, setTrend] = useState<TrendResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // trend inputs
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeUnit, setTimeUnit] = useState<'date' | 'week' | 'month'>('week');

  useEffect(() => {
    const saved = localStorage.getItem('blogId');
    if (saved) setBlogId(saved);
  }, []);

  const difficulty = useMemo(() => {
    return calcDifficulty({ compIdx: volume?.compIdx ?? null, docTotal: rank?.docTotal ?? null, volume: volume?.monthlyTotalQcCnt ?? null });
  }, [rank, volume]);

  async function onAnalyze() {
    setLoading(true);
    setErr('');
    setRank(null);
    setVolume(null);
    setTopPosts([]);
    setTrend(null);

    try {
      const settled = await Promise.allSettled([
        apiGet<RankResult>(
          `/api/naver/rank?keyword=${encodeURIComponent(keyword)}&blogId=${encodeURIComponent(blogId)}&maxRank=${maxRank}`
        ),
        apiGet<{ keyword: string; item: KeywordRow | null; note?: string }>(
          `/api/naver/keywordstool?keyword=${encodeURIComponent(keyword)}`
        ),
        apiGet<{ query: string; total: number; items: BlogSearchItem[] }>(
          `/api/naver/blog-search?query=${encodeURIComponent(keyword)}&display=10&start=1&sort=sim`
        ),
      ]);

      const r = settled[0].status === 'fulfilled' ? settled[0].value : null;
      const v = settled[1].status === 'fulfilled' ? settled[1].value : null;
      const posts = settled[2].status === 'fulfilled' ? settled[2].value : null;

      if (r) setRank(r);
      if (v) setVolume(v.item);
      if (posts) setTopPosts(posts.items);

      const errors: string[] = [];
      for (const s of settled) {
        if (s.status === 'rejected') errors.push(String((s.reason as any)?.message || s.reason || 'unknown error'));
      }

      // Trend is optional; try it but don't fail the whole analysis.
      try {
        const tr = await apiPost<TrendResult>('/api/naver/datalab', {
          startDate,
          endDate,
          timeUnit,
          keywordGroups: [{ groupName: keyword, keywords: [keyword] }],
          device: '',
          gender: '',
          ages: [],
        });
        setTrend(tr);
      } catch (e: any) {
        errors.push(e?.message || String(e));
      }

      if (errors.length) setErr(errors.join('\n'));
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const trendLabels = useMemo(() => {
    const series = trend?.results?.[0]?.data || [];
    return series.map((p) => p.period);
  }, [trend]);

  const trendData = useMemo(() => {
    const series = trend?.results?.[0]?.data || [];
    return series.map((p) => p.ratio);
  }, [trend]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h1>키워드 분석</h1>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          검색량(월간), 경쟁도, 블로그 문서량, 내 블로그 노출 순위(추정), 트렌드를 한 번에 봅니다.
        </div>

        <hr />

        <div className="grid2">
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <div className="small muted">블로그 아이디</div>
              <input value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="prettylee620" />
            </div>
            <div>
              <div className="small muted">키워드</div>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="small muted">순위 탐색 범위(최대)</div>
                <input type="number" value={maxRank} onChange={(e) => setMaxRank(Number(e.target.value || 0))} />
              </div>
              <div style={{ alignSelf: 'end' }}>
                <button className="primary" onClick={onAnalyze} disabled={loading}>
                  분석 실행
                </button>
              </div>
            </div>
            {err ? <div className="muted" style={{ color: '#fca5a5' }}>{err}</div> : null}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="small muted">트렌드 시작</div>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="small muted">트렌드 종료</div>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="small muted">단위</div>
                <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value as any)}>
                  <option value="date">일</option>
                  <option value="week">주</option>
                  <option value="month">월</option>
                </select>
              </div>
            </div>

            <div className="kpi" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="item">
                <div className="label">내 블로그 순위(추정)</div>
                <div className="value">{fmtRank(rank?.rank)}</div>
                <div className="muted">탐색: {rank ? `${rank.checkedMaxRank}위까지` : '-'}</div>
              </div>
              <div className="item">
                <div className="label">난이도(0~100)</div>
                <div className="value">{fmtInt(difficulty)}</div>
                <div className="muted">단순 지표(개인용)</div>
              </div>
              <div className="item">
                <div className="label">월간 검색량(합)</div>
                <div className="value">{fmtInt(volume?.monthlyTotalQcCnt)}</div>
                <div className="muted">PC+MO</div>
              </div>
              <div className="item">
                <div className="label">문서량(블로그)</div>
                <div className="value">{fmtInt(rank?.docTotal)}</div>
                <div className="muted">검색 API total</div>
              </div>
            </div>

            <div className="row">
              <span className="badge">경쟁도: {fmtInt(volume?.compIdx)}</span>
              <span className="badge">PC: {fmtInt(volume?.monthlyPcQcCnt)}</span>
              <span className="badge">MO: {fmtInt(volume?.monthlyMobileQcCnt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>상위 노출 글(블로그 검색 Top 10)</h2>
          <div className="muted">AI 아이디어를 만들 때 참고용으로 사용 가능합니다.</div>
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>제목</th>
                  <th>블로거</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      분석을 실행하면 목록이 표시됩니다.
                    </td>
                  </tr>
                ) : (
                  topPosts.map((p, idx) => (
                    <tr key={idx}>
                      <td className="muted">{idx + 1}</td>
                      <td>
                        <a href={p.link} target="_blank" rel="noreferrer" style={{ fontWeight: 800 }}>
                          {p.title}
                        </a>
                      </td>
                      <td className="muted">
                        <a href={p.bloggerlink} target="_blank" rel="noreferrer">
                          {p.bloggername}
                        </a>
                      </td>
                      <td className="muted">{p.postdate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {trend && trendLabels.length ? (
            <LineChart labels={trendLabels} datasets={[{ label: '트렌드(ratio)', data: trendData }]} yTitle="ratio" />
          ) : (
            <div className="card">
              <h2>트렌드</h2>
              <div className="muted">분석을 실행하면 그래프가 표시됩니다(DataLab 필요).</div>
            </div>
          )}
          <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
            * DataLab 트렌드는 <b>절대 검색수</b>가 아니라 <b>상대값(ratio)</b>입니다.
          </div>
        </div>
      </div>
    </div>
  );
}
