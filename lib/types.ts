export type Health = {
  ok: boolean;
  features: {
    naverSearch: boolean;
    naverDatalab: boolean;
    naverSearchad: boolean;
    postgres: boolean;
    openai: boolean;
    basicAuth: boolean;
  };
  hints: string[];
};

export type TrackedKeyword = {
  id: number;
  blog_id: string;
  keyword: string;
  project: string | null;
  created_at: string;
  latest?: Snapshot | null;
};

export type Snapshot = {
  id: number;
  tracked_keyword_id: number;
  checked_at: string;
  rank: number | null;
  doc_total: number | null;
  volume_pc: number | null;
  volume_mobile: number | null;
  volume_total: number | null;
  comp_idx: number | null;
  status: string | null;
  error: string | null;
};

export type KeywordRow = {
  relKeyword: string;
  monthlyPcQcCnt: number | null;
  monthlyMobileQcCnt: number | null;
  monthlyTotalQcCnt: number | null;
  compIdx: number | null;
};

export type RankResult = {
  keyword: string;
  blogId: string;
  rank: number | null;
  docTotal: number | null;
  checkedMaxRank: number;
  note?: string;
};

export type BlogSearchItem = {
  title: string;
  link: string;
  bloggername: string;
  bloggerlink: string;
  description: string;
  postdate: string;
};

export type TrendSeriesPoint = {
  period: string;
  ratio: number;
};

export type TrendSeries = {
  title: string;
  keyword: string[];
  data: TrendSeriesPoint[];
};

export type TrendResult = {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: TrendSeries[];
};
