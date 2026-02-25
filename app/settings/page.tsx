'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/client';
import type { Health } from '@/lib/types';

export default function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiGet<Health>('/api/health')
      .then(setHealth)
      .catch((e) => setErr(e?.message || String(e)));
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h1>설정</h1>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          이 앱은 <b>환경변수</b>로 API 키를 받습니다. 로컬은 <b>.env.local</b>, Vercel은 Project Settings →
          Environment Variables에 등록하세요.
        </div>
        <hr />

        {err ? <div className="muted" style={{ color: '#fca5a5' }}>{err}</div> : null}
        {health ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="row">
              <span className={`badge ${health.features.naverSearch ? 'ok' : 'err'}`}>네이버 검색</span>
              <span className={`badge ${health.features.naverSearchad ? 'ok' : 'warn'}`}>SearchAd(검색량)</span>
              <span className={`badge ${health.features.naverDatalab ? 'ok' : 'warn'}`}>DataLab(트렌드)</span>
              <span className={`badge ${health.features.postgres ? 'ok' : 'warn'}`}>Postgres(DB)</span>
              <span className={`badge ${health.features.openai ? 'ok' : 'warn'}`}>OpenAI(AI)</span>
              <span className={`badge ${health.features.basicAuth ? 'ok' : 'warn'}`}>BasicAuth</span>
            </div>

            {health.hints.length ? (
              <div className="code">
                {health.hints.map((h, idx) => (
                  <div key={idx}>- {h}</div>
                ))}
              </div>
            ) : (
              <div className="muted">환경변수가 모두 준비되어 있어 보입니다.</div>
            )}
          </div>
        ) : (
          <div className="muted">상태 확인 중...</div>
        )}
      </div>

      <div className="card">
        <h2>.env.local 예시</h2>
        <div className="muted">필요한 항목만 채우면 됩니다. (개인용이라면 BasicAuth를 강력 추천)</div>
        <pre className="code">{`# 1) 네이버 검색 OpenAPI (필수: 블로그 검색 순위/문서량)
NAVER_SEARCH_CLIENT_ID=
NAVER_SEARCH_CLIENT_SECRET=

# 2) 네이버 DataLab (선택: 트렌드)
# 위 OpenAPI 키로 DataLab도 사용합니다.

# 3) 네이버 검색광고(SearchAd) (선택: 검색량/연관키워드)
NAVER_SEARCHAD_API_KEY=
NAVER_SEARCHAD_SECRET_KEY=
NAVER_SEARCHAD_CUSTOMER_ID=

# 4) Vercel Postgres (추적/스냅샷 저장)
# Vercel에서 Postgres를 붙이면 자동으로 POSTGRES_URL 등이 생깁니다.
POSTGRES_URL=

# 5) Cron 보호(선택)
CRON_SECRET=

# 6) Basic Auth(강력 추천: 개인용 보호)
BASIC_AUTH_USER=
BASIC_AUTH_PASS=

# 7) OpenAI(AI 아이디어 기능)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
`}</pre>
      </div>

      <div className="card">
        <h2>윈도우에서 .env.local 만들기 팁</h2>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          메모장으로 저장하면 <b>.env.local.txt</b>로 저장되는 경우가 많아요.
          <br />
          파일 탐색기에서 “파일 확장명 표시”를 켜고, 확장명이 .txt면 제거해 주세요.
        </div>

        <hr />
        <div className="muted">PowerShell:</div>
        <pre className="code">{`Copy-Item .env.example .env.local`}</pre>
        <div className="muted">CMD:</div>
        <pre className="code">{`copy .env.example .env.local`}</pre>
      </div>
    </div>
  );
}
