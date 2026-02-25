'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/client';
import type { KeywordRow } from '@/lib/types';

function fmtInt(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR');
}

export default function ExpandPage() {
  const [blogId, setBlogId] = useState('');
  const [project, setProject] = useState('default');
  const [seed, setSeed] = useState('연신내');
  const [topN, setTopN] = useState(50);
  const [minVolume, setMinVolume] = useState(0);
  const [contains, setContains] = useState('');
  const [exclude, setExclude] = useState('');

  const [rows, setRows] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('blogId');
    if (saved) setBlogId(saved);
    const savedProj = localStorage.getItem('project');
    if (savedProj) setProject(savedProj);
  }, []);

  const filtered = useMemo(() => {
    const inc = contains.trim();
    const exc = exclude.trim();

    return rows
      .filter((r) => (r.monthlyTotalQcCnt ?? 0) >= minVolume)
      .filter((r) => (inc ? r.relKeyword.includes(inc) : true))
      .filter((r) => (exc ? !r.relKeyword.includes(exc) : true));
  }, [rows, minVolume, contains, exclude]);

  async function onExpand() {
    setLoading(true);
    setMsg('확장 중...');
    setErr('');
    try {
      const data = await apiGet<{ seed: string; items: KeywordRow[] }>(
        `/api/naver/expand?seed=${encodeURIComponent(seed)}&topN=${topN}`
      );
      setRows(data.items);
      setMsg(`완료: ${data.items.length}개`);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setMsg('');
    } finally {
      setLoading(false);
    }
  }

  async function addOne(keyword: string) {
    if (!blogId.trim()) {
      setErr('블로그 아이디를 먼저 입력해 주세요(상단).');
      return;
    }
    setLoading(true);
    setErr('');
    setMsg(`추적 추가: ${keyword}`);
    try {
      await apiPost('/api/tracking/add', { blogId: blogId.trim(), keyword, project: project.trim() || null });
      setMsg('추가 완료');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function addSelected() {
    const selected = filtered.slice(0, 30); // 안전하게 30개 제한
    if (!blogId.trim()) {
      setErr('블로그 아이디를 먼저 입력해 주세요(상단).');
      return;
    }
    setLoading(true);
    setErr('');
    setMsg(`추적 추가: ${selected.length}개...`);
    try {
      for (const r of selected) {
        await apiPost('/api/tracking/add', { blogId: blogId.trim(), keyword: r.relKeyword, project: project.trim() || null });
      }
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
        <h1>키워드 확장</h1>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          블랙키위의 “키워드 확장”처럼, 시드 키워드를 넣으면 연관 키워드를 뽑아줍니다.
          <br />
          * 검색량/경쟁도는 <b>SearchAd 키워드도구</b> 설정이 있어야 조회됩니다.
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
            <div className="row">
              <div style={{ flex: 2 }}>
                <div className="small muted">시드 키워드</div>
                <input value={seed} onChange={(e) => setSeed(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="small muted">결과 개수</div>
                <input type="number" value={topN} onChange={(e) => setTopN(Number(e.target.value || 0))} />
              </div>
              <div style={{ alignSelf: 'end' }}>
                <button className="primary" onClick={onExpand} disabled={loading}>
                  확장
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="small muted">최소 검색량(합)</div>
                <input type="number" value={minVolume} onChange={(e) => setMinVolume(Number(e.target.value || 0))} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="small muted">포함</div>
                <input value={contains} onChange={(e) => setContains(e.target.value)} placeholder="예: 맛집" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="small muted">제외</div>
                <input value={exclude} onChange={(e) => setExclude(e.target.value)} placeholder="예: 광고" />
              </div>
            </div>
            <div className="row">
              <button className="secondary" onClick={addSelected} disabled={loading || filtered.length === 0}>
                현재 필터 결과 상위 30개 추적 추가
              </button>
            </div>
            {msg ? <div className="muted">{msg}</div> : null}
            {err ? <div className="muted" style={{ color: '#fca5a5' }}>{err}</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>결과</h2>
        <div className="muted">검색량이 0으로 나오는 경우: SearchAd 키가 없거나, 응답이 “&lt; 10” 같은 값일 수 있어요.</div>

        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>키워드</th>
                <th>월간(PC)</th>
                <th>월간(MO)</th>
                <th>월간(합)</th>
                <th>경쟁도</th>
                <th>추적</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    아직 결과가 없습니다. 위에서 확장을 눌러보세요.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={`${r.relKeyword}-${idx}`}>
                    <td className="muted">{idx + 1}</td>
                    <td style={{ fontWeight: 800 }}>{r.relKeyword}</td>
                    <td>{fmtInt(r.monthlyPcQcCnt)}</td>
                    <td>{fmtInt(r.monthlyMobileQcCnt)}</td>
                    <td>{fmtInt(r.monthlyTotalQcCnt)}</td>
                    <td>{fmtInt(r.compIdx)}</td>
                    <td>
                      <button className="primary" onClick={() => addOne(r.relKeyword)} disabled={loading}>
                        추가
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
