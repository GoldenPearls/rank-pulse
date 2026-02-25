'use client';

import { useEffect, useMemo, useState } from 'react';
import Alert from './components/Alert';
import { apiGet, apiPost } from '@/lib/client';
import type { Health, TrackedKeyword } from '@/lib/types';
import Link from 'next/link';

function fmtInt(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR');
}

function fmtRank(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return `${n}위`;
}

export default function DashboardPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [list, setList] = useState<TrackedKeyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [err, setErr] = useState<string>('');

  const [blogId, setBlogId] = useState('prettylee620');
  const [project, setProject] = useState('default');
  const [keywordsText, setKeywordsText] = useState('연신내술집\n렌트카싼곳\n모텔대실가격');

  useEffect(() => {
    const saved = localStorage.getItem('blogId');
    if (saved) setBlogId(saved);
    const savedProj = localStorage.getItem('project');
    if (savedProj) setProject(savedProj);
  }, []);

  useEffect(() => {
    localStorage.setItem('blogId', blogId);
  }, [blogId]);

  useEffect(() => {
    localStorage.setItem('project', project);
  }, [project]);

  async function refresh() {
    setErr('');
    try {
      const h = await apiGet<Health>('/api/health');
      setHealth(h);
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
    try {
      const items = await apiGet<{ items: TrackedKeyword[] }>('/api/tracking/list');
      setList(items.items);
    } catch (e: any) {
      setErr((prev) => prev || (e?.message || String(e)));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const kpis = useMemo(() => {
    const total = list.length;
    const withLatest = list.filter((x) => x.latest).length;
    const top10 = list.filter((x) => (x.latest?.rank ?? 999999) <= 10).length;
    const top50 = list.filter((x) => (x.latest?.rank ?? 999999) <= 50).length;
    return { total, withLatest, top10, top50 };
  }, [list]);

  function parseKeywords(text: string) {
    return text
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onInitDb() {
    setLoading(true);
    setMsg('DB 초기화 중...');
    setErr('');
    try {
      const r = await apiPost<{ ok: boolean; message: string }>('/api/db/init', {});
      setMsg(r.message);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onAddKeywords() {
    const kws = parseKeywords(keywordsText);
    if (!blogId.trim()) {
      setErr('blog-id를 입력해 주세요.');
      return;
    }
    if (kws.length === 0) {
      setErr('키워드를 1개 이상 입력해 주세요.');
      return;
    }

    setLoading(true);
    setErr('');
    setMsg(`키워드 ${kws.length}개 추가 중...`);
    try {
      for (const kw of kws) {
        await apiPost('/api/tracking/add', { blogId: blogId.trim(), keyword: kw, project: project.trim() || null });
      }
      setMsg('추가 완료');
      await refresh();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onRunSnapshotAll() {
    setLoading(true);
    setErr('');
    setMsg('스냅샷 실행 중(전체)...');
    try {
      const r = await apiPost<{ ok: boolean; message: string; count: number }>('/api/tracking/snapshot/run', {
        mode: 'all',
        maxRank: 500,
      });
      setMsg(`${r.message} (처리: ${r.count}개)`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="grid2">
        <div className="card">
          <h1>대시보드</h1>
          <div className="muted" style={{ lineHeight: 1.6 }}>
            개인용 키워드 도구입니다. 공식 API 기반(네이버 검색 OpenAPI / DataLab / 검색광고 SearchAd)으로
            <br />
            <b>키워드 추천 · 검색량 · 경쟁도 · 내 블로그 노출순위(추정) · 추이</b>를 한 곳에서 봅니다.
          </div>
          <hr />

          <div className="kpi">
            <div className="item">
              <div className="label">추적 키워드</div>
              <div className="value">{fmtInt(kpis.total)}</div>
            </div>
            <div className="item">
              <div className="label">스냅샷 보유</div>
              <div className="value">{fmtInt(kpis.withLatest)}</div>
            </div>
            <div className="item">
              <div className="label">TOP 10</div>
              <div className="value">{fmtInt(kpis.top10)}</div>
            </div>
            <div className="item">
              <div className="label">TOP 50</div>
              <div className="value">{fmtInt(kpis.top50)}</div>
            </div>
          </div>

          <hr />
          <div className="row">
            <button className="secondary" onClick={refresh} disabled={loading}>
              새로고침
            </button>
            <button className="primary" onClick={onRunSnapshotAll} disabled={loading}>
              전체 스냅샷 실행
            </button>
            <button className="danger" onClick={onInitDb} disabled={loading}>
              DB 초기화(테이블 생성)
            </button>
          </div>
          {msg ? <div className="muted" style={{ marginTop: 10 }}>{msg}</div> : null}
          {err ? <div className="muted" style={{ marginTop: 10, color: '#fca5a5' }}>{err}</div> : null}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card">
            <h2>상태</h2>
            {health ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <div className="row">
                  <span className={`badge ${health.features.naverSearch ? 'ok' : 'err'}`}>네이버 검색</span>
                  <span className={`badge ${health.features.naverSearchad ? 'ok' : 'warn'}`}>SearchAd(검색량)</span>
                  <span className={`badge ${health.features.naverDatalab ? 'ok' : 'warn'}`}>DataLab(트렌드)</span>
                  <span className={`badge ${health.features.postgres ? 'ok' : 'warn'}`}>Postgres(DB)</span>
                  <span className={`badge ${health.features.openai ? 'ok' : 'warn'}`}>OpenAI(AI)</span>
                  <span className={`badge ${health.features.basicAuth ? 'ok' : 'warn'}`}>BasicAuth</span>
                </div>
                {health.hints.length ? (
                  <div className="code" style={{ marginTop: 8 }}>
                    {health.hints.map((h, idx) => (
                      <div key={idx}>- {h}</div>
                    ))}
                  </div>
                ) : (
                  <div className="muted">환경변수가 모두 준비되어 있어 보입니다.</div>
                )}
              </div>
            ) : (
              <div className="muted">/api/health 로딩 중...</div>
            )}
          </div>

          <div className="card">
            <h2>추적 키워드 추가</h2>
            <div className="muted">여러 줄/쉼표로 여러 키워드 입력 가능</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="small muted">블로그 아이디</div>
                <input value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="예: prettylee620" />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="small muted">프로젝트(선택)</div>
                <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="default" />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="small muted">키워드</div>
                <textarea rows={5} value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} />
              </div>
              <button className="primary" onClick={onAddKeywords} disabled={loading}>
                추가
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>추적 목록</h2>
        <div className="muted">각 키워드의 최신 스냅샷을 보여줍니다.</div>

        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>프로젝트</th>
                <th>블로그</th>
                <th>키워드</th>
                <th>순위</th>
                <th>월간검색(합)</th>
                <th>경쟁도</th>
                <th>문서량(블로그)</th>
                <th>갱신</th>
                <th>보기</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="muted">
                    아직 추적 키워드가 없습니다. 위에서 추가해 보세요.
                  </td>
                </tr>
              ) : (
                list.map((x) => (
                  <tr key={x.id}>
                    <td>{x.project || '-'}</td>
                    <td>{x.blog_id}</td>
                    <td style={{ fontWeight: 800 }}>{x.keyword}</td>
                    <td>{fmtRank(x.latest?.rank)}</td>
                    <td>{fmtInt(x.latest?.volume_total)}</td>
                    <td>{fmtInt(x.latest?.comp_idx)}</td>
                    <td>{fmtInt(x.latest?.doc_total)}</td>
                    <td className="muted">{x.latest?.checked_at ? new Date(x.latest.checked_at).toLocaleString() : '-'}</td>
                    <td>
                      <Link className="badge" href={`/track?trackedId=${x.id}`}>
                        추이
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
          * 순위는 네이버 <b>블로그 검색 OpenAPI</b> 결과에서 내 블로그가 등장하는 위치로 계산한 “추정치”입니다.
          <br />
          * 검색량은 <b>네이버 검색광고(SearchAd) 키워드도구</b> 값이 설정되어 있으면 표시됩니다.
        </div>
      </div>
    </div>
  );
}
