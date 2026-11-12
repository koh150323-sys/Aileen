import React from 'react';
import { Search, Star, Moon, Sun, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { MarketCategory } from '../types/market';

interface HeaderProps {
  activeTab: MarketCategory | 'heatmap';
  setActiveTab: (tab: MarketCategory | 'heatmap') => void;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenSearch: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  watchlistCount,
  onOpenWatchlist,
  onOpenSearch,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a2e39] dark:border-[#2a2e39] bg-[#131722]/95 dark:bg-[#131722]/95 backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element with logo mark) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2962ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-[#1e53e5] transition-colors">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white dark:text-white whitespace-nowrap">
                TradingView <span className="text-[#2962ff] font-medium">Markets</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean, single-line text links) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'all'
                ? 'text-white bg-[#2a2e39] font-semibold'
                : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'stocks'
                ? 'text-white bg-[#2a2e39] font-semibold'
                : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]/50'
            }`}
          >
            Stocks
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'crypto'
                ? 'text-white bg-[#2a2e39] font-semibold'
                : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]/50'
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setActiveTab('forex')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'forex'
                ? 'text-white bg-[#2a2e39] font-semibold'
                : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]/50'
            }`}
          >
            Forex
          </button>
          <button
            onClick={() => setActiveTab('commodities')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'commodities'
                ? 'text-white bg-[#2a2e39] font-semibold'
                : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]/50'
            }`}
          >
            Commodities
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'heatmap'
                ? 'text-white bg-[#2a2e39] font-semibold'
                : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Heatmap
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Tool Area */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#9598a1] hover:text-white bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-lg transition-colors whitespace-nowrap"
            title="Search markets (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#787b86]" />
            <span className="hidden sm:inline">Search markets...</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-[#2a2e39] text-[#b2b5be] rounded font-mono">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={onOpenWatchlist}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Your Watchlist"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-[#2962ff] text-white text-[10px] font-bold rounded-full">
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 text-[#9598a1] hover:text-white bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-lg transition-colors"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
