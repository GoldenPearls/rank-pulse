# 개인용 키워드 도구 (블랙키위 느낌 / Vercel 배포용)

> **개인용**으로 쓰는 것을 전제로 만든 MVP입니다.
> - 키워드 확장 / 검색량 / 경쟁도 / 내 블로그 노출순위(추정) / 트렌드 / 추적(스냅샷)
> - (선택) OpenAI로 글 아이디어 생성

## 1) 준비물

### 필수
- **네이버 검색 OpenAPI** (블로그 검색)
  - `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET`

### 선택 (있으면 블랙키위처럼 더 비슷해짐)
- **네이버 검색광고(SearchAd) API** (키워드도구: 검색량/경쟁도/연관키워드)
  - `NAVER_SEARCHAD_API_KEY`, `NAVER_SEARCHAD_SECRET_KEY`, `NAVER_SEARCHAD_CUSTOMER_ID`
- **Vercel Postgres** (추적/스냅샷 저장)
  - Vercel Storage에서 Postgres 연결하면 `POSTGRES_URL` 등이 자동으로 생김
- **Vercel Cron** (매일 자동 스냅샷)
  - `vercel.json`에 `/api/cron/daily`가 05:00 UTC로 설정됨
  - `CRON_SECRET`을 설정하면 Vercel이 자동으로 `Authorization: Bearer <CRON_SECRET>` 헤더를 넣어 호출함 (공식 문서 참고)
- **Basic Auth** (개인용 보안 강력 추천)
  - `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`
- **OpenAI** (AI 아이디어 기능)
  - `OPENAI_API_KEY`, `OPENAI_MODEL`

## 2) 로컬 실행

### 2-1) 설치

```bash
npm install
```

### 2-2) 환경변수

`.env.example` → `.env.local`로 복사 후 값 채우기

- PowerShell:
```powershell
Copy-Item .env.example .env.local
```

- CMD:
```bat
copy .env.example .env.local
```

- macOS/Linux/Git Bash:
```bash
cp .env.example .env.local
```

### 2-3) 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`

## 3) DB 초기화

처음 한 번만 **대시보드에서** `DB 초기화(테이블 생성)` 버튼을 누르거나

```bash
curl -X POST http://localhost:3000/api/db/init
```

## 4) 기능 맵

- 대시보드(`/`) : 추적 키워드 목록 + 최신 스냅샷
- 키워드 확장(`/expand`) : 연관키워드/검색량/경쟁도 + 추적 추가
- 키워드 분석(`/analyze`) : 순위/문서량/검색량/경쟁도/트렌드
- 추적(`/track`) : 키워드별 스냅샷 그래프
- AI 아이디어(`/ideas`) : OpenAI로 제목/목차/태그 생성
- 설정(`/settings`) : 환경변수 상태 확인

## 5) Vercel 배포

1) GitHub에 올리고 Vercel에서 Import
2) Project Settings → Environment Variables에 `.env.local` 값 등록
3) Vercel Storage → Postgres 연결
4) 배포 후 `/` 들어가서 DB 초기화
5) Cron 사용 시: `CRON_SECRET` 설정 추천

---

### 주의
- 이 도구의 “순위”는 **네이버 블로그 검색 OpenAPI 결과에서 내 블로그가 등장하는 위치**를 사용한 **추정치**입니다.
- SearchAd는 계정/권한/서명 문제가 있으면 403이 날 수 있습니다. 403 메시지는 UI에서 그대로 보이도록 했습니다(개인용 디버깅).
