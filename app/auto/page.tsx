// app/auto/page.tsx
"use client";

import { useState } from "react";
import { apiPost } from "@/lib/client";

type Item = { keyword: string; rank: number | null; label: string };

export default function AutoTopExposurePage() {
  const [blogId, setBlogId] = useState("prettylee620");
  const [maxRank, setMaxRank] = useState(500);
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setErr("");
    setItems([]);

    if (!blogId.trim()) {
      setErr("블로그 아이디가 빠졌어요.");
      return;
    }

    setLoading(true);
    try {
      const r = await apiPost<{ ok: boolean; items: Item[]; error?: string }>("/api/auto/top-exposure", {
        blogId: blogId.trim(),
        maxRank,
        maxPosts: 50,
        maxCandidates: 60,
      });
      if (!r.ok) throw new Error(r.error || "failed");
      setItems(r.items);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <h1>상위 노출 키워드 자동 찾기</h1>
      <div className="muted">블로그 RSS(최근 글 제목) 기반으로 후보 키워드를 만들고, 각 키워드에서 내 블로그 순위를 계산합니다.</div>

      <div className="row">
        <div style={{ flex: 2, minWidth: 220 }}>
          <div className="small muted">블로그 아이디</div>
          <input value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="prettylee620" />
        </div>
        <div style={{ width: 180 }}>
          <div className="small muted">최대 탐색 순위</div>
          <input
            type="number"
            value={maxRank}
            onChange={(e) => setMaxRank(Number(e.target.value || 500))}
            min={1}
            max={1000}
          />
        </div>
        <div style={{ alignSelf: "end" }}>
          <button className="primary" onClick={run} disabled={loading}>
            {loading ? "실행 중..." : "자동 추출 실행"}
          </button>
        </div>
      </div>

      {err ? <div className="muted" style={{ color: "#fca5a5" }}>{err}</div> : null}

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>키워드</th>
              <th>내 블로그 노출 순위</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={3} className="muted">아직 결과가 없습니다.</td></tr>
            ) : (
              items.map((x, i) => (
                <tr key={`${x.keyword}-${i}`}>
                  <td className="muted">{i + 1}</td>
                  <td style={{ fontWeight: 800 }}>{x.keyword}</td>
                  <td>{x.label}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="muted">
        팁: 결과에서 상위권 키워드를 골라서 “추적”에 추가하면 날짜별로 순위 추이를 볼 수 있어요.
      </div>
    </div>
  );
}
