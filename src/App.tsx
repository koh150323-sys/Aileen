import React, { useState, useEffect, useCallback } from 'react';
import { MarketCategory, MarketAsset } from './types/market';
import { INITIAL_ASSETS, ECONOMIC_CALENDAR, MARKET_NEWS } from './data/marketData';
import { Header } from './components/Header';
import { TickerTape } from './components/TickerTape';
import { MarketStatsHeader } from './components/MarketStatsHeader';
import { TopMoversGrid } from './components/TopMoversGrid';
import { InteractiveChart } from './components/InteractiveChart';
import { MarketHeatmap } from './components/MarketHeatmap';
import { MarketTable } from './components/MarketTable';
import { EconomicCalendar } from './components/EconomicCalendar';
import { MarketNewsFeed } from './components/MarketNewsFeed';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { SearchModal } from './components/SearchModal';

const WATCHLIST_STORAGE_KEY = 'tv_markets_watchlist';

export default function App() {
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [activeTab, setActiveTab] = useState<MarketCategory | 'heatmap'>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [recentTickMap, setRecentTickMap] = useState<Record<string, 'up' | 'down'>>({});

  // Initialize watchlist from localStorage or defaults
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return ['SPX', 'NVDA', 'BTC/USD', 'TSLA', 'AAPL', 'EUR/USD', 'XAU/USD'];
  });

  // Sync watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.error(e);
    }
  }, [watchlist]);

  // Handle Watchlist toggle
  const handleToggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  }, []);

  const handleAddToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
  }, []);

  const handleRemoveFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol));
  }, []);

  // Theme toggle
  const handleToggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Keyboard shortcut for Cmd+K / Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Realistic micro-tick simulation engine
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick 2-4 random assets to tick
      const count = Math.floor(Math.random() * 3) + 2;
      const targetIndices: number[] = [];
      while (targetIndices.length < count) {
        const idx = Math.floor(Math.random() * assets.length);
        if (!targetIndices.includes(idx)) targetIndices.push(idx);
      }

      const newTicks: Record<string, 'up' | 'down'> = {};

      setAssets((prevAssets) =>
        prevAssets.map((asset, index) => {
          if (!targetIndices.includes(index)) return asset;

          const isUp = Math.random() > 0.47;
          const deltaFactor = 0.0005 + Math.random() * 0.0015;
          const delta = asset.price * deltaFactor * (isUp ? 1 : -1);
          const newPrice = Number(Math.max(asset.price + delta, 0.001).toFixed(asset.price < 10 ? 4 : 2));
          const newChange = Number((asset.change + delta).toFixed(2));
          const newChangePercent = Number(((newChange / asset.prevClose) * 100).toFixed(2));
          const newHigh = Math.max(asset.high, newPrice);
          const newLow = Math.min(asset.low, newPrice);

          newTicks[asset.symbol] = isUp ? 'up' : 'down';

          // Update latest candle in 1D history
          const updated1D = [...asset.history['1D']];
          if (updated1D.length > 0) {
            const lastCandle = { ...updated1D[updated1D.length - 1] };
            lastCandle.close = newPrice;
            lastCandle.high = Math.max(lastCandle.high, newPrice);
            lastCandle.low = Math.min(lastCandle.low, newPrice);
            lastCandle.volume += Math.floor(Math.random() * 5000);
            updated1D[updated1D.length - 1] = lastCandle;
          }

          return {
            ...asset,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
            high: newHigh,
            low: newLow,
            history: {
              ...asset.history,
              '1D': updated1D,
            },
            sparkline: updated1D.map((c) => c.close),
          };
        })
      );

      setRecentTickMap(newTicks);

      // Clear flash after 800ms
      setTimeout(() => {
        setRecentTickMap({});
      }, 800);
    }, 3200);

    return () => clearInterval(interval);
  }, [assets.length]);

  // Selected asset
  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  return (
    <div className="min-h-screen bg-[#131722] text-[#d1d4dc] flex flex-col font-sans selection:bg-[#2962ff] selection:text-white">
      {/* 1. Global Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Real-Time Ticker Tape */}
      <TickerTape
        assets={assets}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        recentTickMap={recentTickMap}
      />

      {/* 3. Global Market Status & Breadth Strip */}
      <MarketStatsHeader assets={assets} />

      {/* 4. Main Viewport Content */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Heatmap Dedicated View */}
        {activeTab === 'heatmap' ? (
          <div className="space-y-6">
            <MarketHeatmap
              assets={assets}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
            />
            {/* Embedded chart below heatmap */}
            <div className="pt-2">
              <InteractiveChart
                asset={selectedAsset}
                isWatchlisted={watchlist.includes(selectedAsset.symbol)}
                onToggleWatchlist={handleToggleWatchlist}
                isExpanded={isChartExpanded}
                onToggleExpand={() => setIsChartExpanded(!isChartExpanded)}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Top Movers Cards Strip */}
            <TopMoversGrid
              assets={assets}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
            />

            {/* Flagship Interactive Candlestick / Area Chart */}
            <InteractiveChart
              asset={selectedAsset}
              isWatchlisted={watchlist.includes(selectedAsset.symbol)}
              onToggleWatchlist={handleToggleWatchlist}
              isExpanded={isChartExpanded}
              onToggleExpand={() => setIsChartExpanded(!isChartExpanded)}
            />

            {/* Quick Heatmap Snapshot (on Overview) */}
            {activeTab === 'all' && (
              <MarketHeatmap
                assets={assets}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={setSelectedSymbol}
              />
            )}

            {/* Comprehensive Market Screener Table */}
            <MarketTable
              assets={assets}
              selectedCategory={activeTab === 'all' ? 'all' : (activeTab as MarketCategory)}
              onSelectCategory={(cat) => {
                if (cat === 'all') setActiveTab('all');
                else setActiveTab(cat);
              }}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />

            {/* 2-Column Split: Economic Calendar + Breaking Financial News */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <EconomicCalendar events={ECONOMIC_CALENDAR} />
              <MarketNewsFeed news={MARKET_NEWS} />
            </div>
          </>
        )}
      </main>

      {/* 5. Minimal Editorial Footer */}
      <footer className="border-t border-[#2a2e39] bg-[#171b26] py-6 px-4 sm:px-6 mt-12 text-xs text-[#787b86]">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TradingView Markets</span>
            <span>·</span>
            <span>Real-time financial quotes, advanced charting & market analytics</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Market data delayed by exchange rules or simulated for evaluation</span>
            <span>·</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>

      {/* Slide-out Watchlist Drawer */}
      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        assets={assets}
        onSelectSymbol={setSelectedSymbol}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        onAddToWatchlist={handleAddToWatchlist}
      />

      {/* Symbol Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        assets={assets}
        onSelectSymbol={setSelectedSymbol}
      />
    </div>
  );
}
