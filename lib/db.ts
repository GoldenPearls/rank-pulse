import { sql } from '@vercel/postgres';
import type { Snapshot, TrackedKeyword } from './types';

export async function dbInit(): Promise<{ ok: boolean; message: string }> {
  // Create tables if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS tracked_keywords (
      id SERIAL PRIMARY KEY,
      blog_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      project TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(blog_id, keyword)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS snapshots (
      id SERIAL PRIMARY KEY,
      tracked_keyword_id INTEGER NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      rank INTEGER,
      doc_total INTEGER,
      volume_pc INTEGER,
      volume_mobile INTEGER,
      volume_total INTEGER,
      comp_idx INTEGER,
      status TEXT,
      error TEXT
    );
  `;

  return { ok: true, message: 'DB 테이블 확인/생성 완료' };
}

export async function addTrackedKeyword(args: {
  blogId: string;
  keyword: string;
  project?: string | null;
}): Promise<{ ok: boolean; id: number; created: boolean }> {
  const blogId = args.blogId.trim();
  const keyword = args.keyword.trim();
  const project = args.project ?? null;

  const existing = await sql`
    SELECT id FROM tracked_keywords WHERE blog_id = ${blogId} AND keyword = ${keyword} LIMIT 1;
  `;
  if (existing.rowCount && existing.rows[0]?.id) {
    return { ok: true, id: existing.rows[0].id as number, created: false };
  }

  const inserted = await sql`
    INSERT INTO tracked_keywords (blog_id, keyword, project)
    VALUES (${blogId}, ${keyword}, ${project})
    RETURNING id;
  `;

  return { ok: true, id: inserted.rows[0].id as number, created: true };
}

export async function listTrackedKeywordsWithLatest(): Promise<TrackedKeyword[]> {
  // DISTINCT ON to get latest snapshot per keyword
  const q = await sql`
    SELECT
      tk.id,
      tk.blog_id,
      tk.keyword,
      tk.project,
      tk.created_at,
      s.id as snapshot_id,
      s.tracked_keyword_id,
      s.checked_at,
      s.rank,
      s.doc_total,
      s.volume_pc,
      s.volume_mobile,
      s.volume_total,
      s.comp_idx,
      s.status,
      s.error
    FROM tracked_keywords tk
    LEFT JOIN LATERAL (
      SELECT * FROM snapshots s
      WHERE s.tracked_keyword_id = tk.id
      ORDER BY s.checked_at DESC
      LIMIT 1
    ) s ON TRUE
    ORDER BY tk.project NULLS LAST, tk.created_at DESC;
  `;

  return q.rows.map((r: any) => {
    const latest: Snapshot | null = r.snapshot_id
      ? {
          id: r.snapshot_id,
          tracked_keyword_id: r.tracked_keyword_id,
          checked_at: r.checked_at,
          rank: r.rank,
          doc_total: r.doc_total,
          volume_pc: r.volume_pc,
          volume_mobile: r.volume_mobile,
          volume_total: r.volume_total,
          comp_idx: r.comp_idx,
          status: r.status,
          error: r.error,
        }
      : null;

    return {
      id: r.id,
      blog_id: r.blog_id,
      keyword: r.keyword,
      project: r.project,
      created_at: r.created_at,
      latest,
    } as TrackedKeyword;
  });
}

export async function getTrackedKeyword(id: number): Promise<TrackedKeyword | null> {
  const q = await sql`
    SELECT id, blog_id, keyword, project, created_at
    FROM tracked_keywords
    WHERE id = ${id}
    LIMIT 1;
  `;

  if (!q.rowCount) return null;
  const r: any = q.rows[0];
  return {
    id: r.id,
    blog_id: r.blog_id,
    keyword: r.keyword,
    project: r.project,
    created_at: r.created_at,
  };
}

export async function insertSnapshot(args: {
  trackedId: number;
  rank: number | null;
  docTotal: number | null;
  volumePc: number | null;
  volumeMobile: number | null;
  volumeTotal: number | null;
  compIdx: number | null;
  status?: string | null;
  error?: string | null;
}): Promise<{ ok: boolean; id: number }> {
  const inserted = await sql`
    INSERT INTO snapshots (
      tracked_keyword_id,
      rank,
      doc_total,
      volume_pc,
      volume_mobile,
      volume_total,
      comp_idx,
      status,
      error
    ) VALUES (
      ${args.trackedId},
      ${args.rank},
      ${args.docTotal},
      ${args.volumePc},
      ${args.volumeMobile},
      ${args.volumeTotal},
      ${args.compIdx},
      ${args.status ?? null},
      ${args.error ?? null}
    )
    RETURNING id;
  `;

  return { ok: true, id: inserted.rows[0].id as number };
}

export async function listSnapshots(trackedId: number, limit = 200): Promise<Snapshot[]> {
  const q = await sql`
    SELECT
      id,
      tracked_keyword_id,
      checked_at,
      rank,
      doc_total,
      volume_pc,
      volume_mobile,
      volume_total,
      comp_idx,
      status,
      error
    FROM snapshots
    WHERE tracked_keyword_id = ${trackedId}
    ORDER BY checked_at DESC
    LIMIT ${limit};
  `;

  return q.rows as Snapshot[];
}

export async function listAllTrackedIds(): Promise<number[]> {
  const q = await sql`SELECT id FROM tracked_keywords ORDER BY id ASC;`;
  return q.rows.map((r: any) => r.id as number);
}
