# 랭크펄스 (RankPulse)

개인용 **네이버 키워드/순위 추적 대시보드**  
- 키워드 검색량(선택) / 연관키워드 확장 / 트렌드(상대값) / 내 블로그 노출 순위(추정) / 추이 저장 & 그래프
- Vercel로 배포해서 **내 대시보드처럼** 쓰는 것을 목표로 합니다.

> ⚠️ 본 프로젝트는 개인용 도구이며 NAVER/블랙키위 등과 **무관**합니다.  
> 네이버/검색광고 API 정책 및 약관을 준수해서 사용하세요(무분별 크롤링 지양).

---

## 핵심 기능

### 1) 키워드 확장 (블랙키위 스타일)
- 시드 키워드 입력 → 연관 키워드 리스트 출력
- (가능하면) 월간 검색량(PC/MO/합), 경쟁도 등의 지표 표시
- 필터(최소 검색량/포함·제외 키워드 등) 후 “추적 키워드로 추가”

### 2) 키워드 분석
- **내 블로그 노출 순위(추정)**: 네이버 검색 OpenAPI(블로그 검색) 결과에서 내 blogId가 등장하는 위치를 계산
- 문서량(total), 상위 노출 글 목록 일부
- **트렌드 그래프(상대값)**: DataLab 검색어 트렌드
- (선택) 검색량/경쟁도: 네이버 검색광고(SearchAd) API

### 3) 추적 & 대시보드
- 키워드별 날짜 스냅샷 저장(순위/검색량/문서량 등)
- 순위 추이 / 검색량 추이 그래프
- 상승/하락 키워드 빠른 보기

### 4) (선택) AI 글 아이디어
- OpenAI API 키가 있으면 키워드 기반:
  - 제목 후보 / 소제목 구성 / 차별화 포인트 / 태그 아이디어 생성

### 5) (강력 권장) 개인용 보안
- Basic Auth(아이디/비번)로 사이트 전체 잠금

---

## 기술 스택
- Next.js (App Router)
- Vercel (배포)
- Vercel Postgres (추적 데이터 저장, 선택)
- Vercel Cron (매일 자동 스냅샷 저장, 선택)

---

## 로컬 실행 방법

### 1) 설치
```bash
npm install
````

### 2) 환경변수 파일 생성

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

### 3) 실행

```bash
npm run dev
```

---

## 환경변수 (.env.local)

### ✅ 필수 (순위/분석 기능)

네이버 검색 OpenAPI(검색 API) - 블로그 검색을 위해 필요

```env
NAVER_SEARCH_CLIENT_ID=
NAVER_SEARCH_CLIENT_SECRET=
```

### ✅ 강력 추천 (개인용 보안)

```env
BASIC_AUTH_USER=
BASIC_AUTH_PASS=
```

### 선택 1) 검색량/연관키워드(“검색량 숫자”)

네이버 검색광고(SearchAd) API 키워드 도구 사용 시 필요

> SearchAd 키/권한이 없으면 검색량 기능은 비활성/에러 표시되고, 순위 분석은 동작합니다.

```env
NAVER_SEARCHAD_API_KEY=
NAVER_SEARCHAD_SECRET_KEY=
NAVER_SEARCHAD_CUSTOMER_ID=
```

### 선택 2) 추적/그래프(DB 저장)

Vercel Postgres 연결 시 자동 주입되는 경우가 많습니다.

```env
POSTGRES_URL=
```

### 선택 3) 자동 수집 Cron 보호

```env
CRON_SECRET=
```

### 선택 4) AI 아이디어

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

---

## 네이버 API 준비

### A) 네이버 검색 OpenAPI (필수)

1. 네이버 개발자센터에서 애플리케이션 생성
2. “검색” API 사용 설정
3. Client ID / Client Secret 발급
4. 위 값을 `.env.local`에 입력

### B) 네이버 검색광고(SearchAd) API (선택: 검색량/추천용)

* 광고주센터에서 API 사용 신청 후 Access License / Secret Key 발급
* Customer ID도 필요합니다
* `.env.local`의 SearchAd 항목 채우기

> SearchAd `/keywordstool` 호출이 403이면
>
> * API 사용 신청/권한, Customer ID 불일치, 서명(Signature) 불일치, 키 값 오타 등을 점검하세요.

---

## Vercel 배포 방법 (레포 루트 = Next 프로젝트)

1. GitHub에 이 레포를 올립니다(루트에 `package.json`이 있어야 함)
2. Vercel → New Project → GitHub 레포 Import → Deploy
3. Vercel 프로젝트 Settings → Environment Variables에 위 변수들 등록
4. (추적 사용 시) Vercel Storage → Postgres 생성 & Connect
5. 배포 사이트에서 **DB 초기화 1회**

   * UI에서 “DB 초기화” 버튼 클릭
   * 또는 API 호출:

     ```bash
     curl -X POST https://YOUR_DOMAIN/api/db/init
     ```

---

## Cron(자동 스냅샷) 사용 (선택)

* `vercel.json`에 크론 스케줄이 포함되어 있습니다.
* `CRON_SECRET` 설정 시 `/api/cron/daily`는 Bearer 토큰이 있어야 동작하도록 보호됩니다.

수동 실행도 가능:

* 대시보드에서 “전체 스냅샷 실행” 버튼

---

## 동작 방식(중요)

### “순위”는 네이버가 숫자로 주는 게 아니라, 우리가 계산합니다

* 네이버 검색 OpenAPI(블로그 검색) 결과 리스트에서
* 내 블로그(`blogId`)가 등장하는 위치를 찾아 **노출 순위(추정)**로 저장합니다.

> 따라서 실제 네이버 앱/개인화/탭 구성과 100% 동일하지 않을 수 있습니다.
> 하지만 같은 기준(API 기준)으로 일관되게 쌓이면 “추세(상승/하락)” 파악에는 유용합니다.

### “검색량”은 DataLab이 아니라 SearchAd가 주로 담당합니다

* DataLab: 기간별 “상대 관심도(비율)” → 트렌드 그래프용
* SearchAd: 월간 PC/MO 같은 “절대 검색량 수치” → 검색량 컬럼/추천 정렬용

---

## 자주 막히는 문제(FAQ)

### 1) Windows에서 `.env.local`이 `.env.local.txt`로 저장돼요

* 파일 확장명 표시를 켜고 `.txt`가 붙지 않게 저장하세요.
* PowerShell에서는 `Copy-Item .env.example .env.local` 권장

### 2) SearchAd 검색량이 403 Forbidden

* API 사용 신청/권한(계정 책임자), Customer ID, API Key/Secret Key 오타 여부 확인
* SearchAd 키를 비우면(또는 기능 비활성) 순위 분석은 계속 사용 가능합니다.

### 3) 배포는 됐는데 그래프가 비어요

* DB(Postgres) 연결 여부 확인
* `/api/db/init`로 테이블 생성이 되었는지 확인
* 키워드를 “추적 추가”하고 스냅샷을 1회 이상 실행해야 데이터가 쌓입니다.

---

## 보안/개인정보

* API 키/시크릿은 절대 GitHub에 커밋하지 마세요.
* Vercel Environment Variables에만 저장하세요.
* 개인용이면 Basic Auth로 잠그는 것을 권장합니다.

---

## 라이선스

개인 프로젝트 용도로 사용하세요. (원하면 MIT로 바꾸세요)

---

## 로드맵 - 확장

* 키워드 클러스터링(주제별 묶기)
* 주간 리포트 자동 생성(상승/하락 TOP)
* 키워드 그룹/프로젝트 관리 강화
* 글 제목/목차 추천 자동화 고도화(AI)

```

::contentReference[oaicite:0]{index=0}
```
