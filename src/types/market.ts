export type MarketCategory = 'all' | 'stocks' | 'crypto' | 'forex' | 'indices' | 'commodities' | 'bonds';

export type TechnicalRating = 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';

export interface OHLCV {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  category: MarketCategory;
  sector?: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  high52w: number;
  low52w: number;
  technicalRating: TechnicalRating;
  rsi: number;
  sparkline: number[];
  history: {
    '1D': OHLCV[];
    '5D': OHLCV[];
    '1M': OHLCV[];
    '6M': OHLCV[];
    '1Y': OHLCV[];
    'ALL': OHLCV[];
  };
  description: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  date: string;
  country: string;
  flag: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast: string;
  previous: string;
}

export interface MarketNews {
  id: string;
  title: string;
  source: string;
  category: string;
  timeAgo: string;
  readTime: string;
  summary: string;
  url?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}
