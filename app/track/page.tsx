'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/client';
import type { Snapshot, TrackedKeyword } from '@/lib/types';
import LineChart from '../components/LineChart';

function fmtInt(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR');
}

export default function TrackPage() {
  const sp = useSearchParams();
  const qTrackedId = sp.get('trackedId');

  const [trackedId, setTrackedId] = useState<number | null>(qTrackedId ? Number(qTrackedId) : null);
  const [trackedList, setTrackedList] = useState<TrackedKeyword[]>([]);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function refreshList() {
    const items = await apiGet<{ items: TrackedKeyword[] }>('/api/tracking/list');
    setTrackedList(items.items);
  }

  async function refreshSnaps(id: number) {
    const s = await apiGet<{ trackedId: number; snapshots: Snapshot[] }>(`/api/tracking/snapshots?trackedId=${id}`);
    setSnaps(s.snapshots);
  }

  useEffect(() => {
    refreshList().catch((e) => setErr(e?.message || String(e)));
  }, []);

  useEffect(() => {
    if (!trackedId) return;
    refreshSnaps(trackedId).catch((e) => setErr(e?.message || String(e)));
  }, [trackedId]);

  const selected = useMemo(() => trackedList.find((t) => t.id === trackedId) || null, [trackedList, trackedId]);

  const labels = useMemo(() => snaps.map((s) => new Date(s.checked_at).toLocaleDateString()), [snaps]);
  const rankData = useMemo(() => snaps.map((s) => s.rank), [snaps]);
  const volData = useMemo(() => snaps.map((s) => s.volume_total), [snaps]);

  async function runNow() {
    if (!trackedId) return;
    setLoading(true);
    setErr('');
    setMsg('스냅샷 실행 중...');
    try {
      const r = await apiPost<{ ok: boolean; message: string; count: number }>('/api/tracking/snapshot/run', {
        mode: 'one',
        trackedId,
        maxRank: 500,
      });
      setMsg(r.message);
      await refreshSnaps(trackedId);
      await refreshList();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h1>추적</h1>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          키워드별로 날짜별 스냅샷(순위/검색량/경쟁도)을 쌓고, 추이를 확인합니다.
        </div>

        <hr />

        <div className="row">
          <div style={{ flex: 2, minWidth: 260 }}>
            <div className="small muted">키워드 선택</div>
            <select
              value={trackedId ?? ''}
              onChange={(e) => setTrackedId(e.target.value ? Number(e.target.value) : null)}
              style={{ width: '100%' }}
            >
              <option value="">선택...</option>
              {trackedList.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.project || 'default'}] {t.keyword} ({t.blog_id})
                </option>
              ))}
            </select>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="primary" onClick={runNow} disabled={!trackedId || loading}>
              지금 스냅샷 실행
            </button>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button className="secondary" onClick={() => trackedId && refreshSnaps(trackedId)} disabled={!trackedId || loading}>
              새로고침
            </button>
          </div>
        </div>

        {msg ? <div className="muted" style={{ marginTop: 10 }}>{msg}</div> : null}
        {err ? <div className="muted" style={{ marginTop: 10, color: '#fca5a5' }}>{err}</div> : null}

        {selected ? (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="badge">blog: {selected.blog_id}</span>
            <span className="badge">keyword: {selected.keyword}</span>
            <span className="badge">project: {selected.project || 'default'}</span>
          </div>
        ) : null}
      </div>

      <div className="grid2">
        <div>
          {snaps.length ? (
            <LineChart labels={labels} datasets={[{ label: '순위(작을수록 상위)', data: rankData }]} yReverse yTitle="rank" />
          ) : (
            <div className="card">
              <h2>순위 추이</h2>
              <div className="muted">스냅샷이 없으면 그래프가 보이지 않습니다.</div>
            </div>
          )}
        </div>
        <div>
          {snaps.length ? (
            <LineChart labels={labels} datasets={[{ label: '월간 검색량(합)', data: volData }]} yTitle="volume" />
          ) : (
            <div className="card">
              <h2>검색량 추이</h2>
              <div className="muted">SearchAd 설정이 없으면 값이 비어있을 수 있어요.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>스냅샷 상세</h2>
        <div className="muted">최근 스냅샷부터 표시</div>
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table className="table">
            <thead>
              <tr>
                <th>시간</th>
                <th>순위</th>
                <th>월간(합)</th>
                <th>경쟁도</th>
                <th>문서량</th>
                <th>상태</th>
                <th>오류</th>
              </tr>
            </thead>
            <tbody>
              {snaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    선택한 키워드의 스냅샷이 없습니다.
                  </td>
                </tr>
              ) : (
                snaps.map((s) => (
                  <tr key={s.id}>
                    <td className="muted">{new Date(s.checked_at).toLocaleString()}</td>
                    <td>{s.rank ?? '-'}</td>
                    <td>{fmtInt(s.volume_total)}</td>
                    <td>{fmtInt(s.comp_idx)}</td>
                    <td>{fmtInt(s.doc_total)}</td>
                    <td className="muted">{s.status || '-'}</td>
                    <td className="muted" style={{ color: s.error ? '#fca5a5' : undefined }}>{s.error || '-'}</td>
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
