export const env = {
  NAVER_SEARCH_CLIENT_ID: process.env.NAVER_SEARCH_CLIENT_ID || '',
  NAVER_SEARCH_CLIENT_SECRET: process.env.NAVER_SEARCH_CLIENT_SECRET || '',
  NAVER_SEARCHAD_API_KEY: process.env.NAVER_SEARCHAD_API_KEY || '',
  NAVER_SEARCHAD_SECRET_KEY: process.env.NAVER_SEARCHAD_SECRET_KEY || '',
  NAVER_SEARCHAD_CUSTOMER_ID: process.env.NAVER_SEARCHAD_CUSTOMER_ID || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || '',
  CRON_SECRET: process.env.CRON_SECRET || '',
  BASIC_AUTH_USER: process.env.BASIC_AUTH_USER || '',
  BASIC_AUTH_PASS: process.env.BASIC_AUTH_PASS || '',
};

export function hasNaverSearch() {
  return !!env.NAVER_SEARCH_CLIENT_ID && !!env.NAVER_SEARCH_CLIENT_SECRET;
}

export function hasNaverSearchAd() {
  return !!env.NAVER_SEARCHAD_API_KEY && !!env.NAVER_SEARCHAD_SECRET_KEY && !!env.NAVER_SEARCHAD_CUSTOMER_ID;
}

export function hasOpenAI() {
  return !!env.OPENAI_API_KEY && !!env.OPENAI_MODEL;
}

export function hasBasicAuth() {
  return !!env.BASIC_AUTH_USER && !!env.BASIC_AUTH_PASS;
}
