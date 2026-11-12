import React, { useState, useMemo } from 'react';
import {
  Star,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { MarketAsset, MarketCategory } from '../types/market';
import {
  formatPrice,
  formatChange,
  formatPercent,
  formatCompactNumber,
  formatVolume,
} from '../utils/formatters';

interface MarketTableProps {
  assets: MarketAsset[];
  selectedCategory: MarketCategory;
  onSelectCategory: (cat: MarketCategory) => void;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
}

type TableTab = 'overview' | 'performance' | 'technicals' | 'valuation';
type SortField = 'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCap' | 'rsi';
type PresetFilter = 'all' | 'gainers' | 'losers' | 'volume' | 'strong_buy' | 'overbought';

export const MarketTable: React.FC<MarketTableProps> = ({
  assets,
  selectedCategory,
  onSelectCategory,
  selectedSymbol,
  onSelectSymbol,
  watchlist,
  onToggleWatchlist,
}) => {
  const [activeTab, setActiveTab] = useState<TableTab>('overview');
  const [presetFilter, setPresetFilter] = useState<PresetFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filter & sort assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((asset) => {
        // Category filter
        if (selectedCategory !== 'all' && asset.category !== selectedCategory) {
          return false;
        }

        // Preset filter
        if (presetFilter === 'gainers' && asset.changePercent <= 0) return false;
        if (presetFilter === 'losers' && asset.changePercent >= 0) return false;
        if (presetFilter === 'strong_buy' && asset.technicalRating !== 'Strong Buy') return false;
        if (presetFilter === 'overbought' && asset.rsi <= 70) return false;
        if (presetFilter === 'volume' && (asset.volume || 0) < 1e8) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            asset.symbol.toLowerCase().includes(q) ||
            asset.name.toLowerCase().includes(q) ||
            asset.exchange.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'marketCap') {
          valA = a.marketCap || 0;
          valB = b.marketCap || 0;
        }

        if (valA === undefined) valA = 0;
        if (valB === undefined) valB = 0;

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [assets, selectedCategory, presetFilter, searchQuery, sortField, sortAsc]);

  // Mini sparkline renderer
  const renderSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 22;

    const pathD = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#089981' : '#f23645';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Render 24h High/Low range slider bar
  const renderRangeBar = (asset: MarketAsset) => {
    const range = asset.high - asset.low || 1;
    const currentPos = Math.max(0, Math.min(100, ((asset.price - asset.low) / range) * 100));

    return (
      <div className="w-28 flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-[#787b86] font-mono tabular-nums">
          <span>{formatPrice(asset.low, asset.currency)}</span>
          <span>{formatPrice(asset.high, asset.currency)}</span>
        </div>
        <div className="h-1.5 bg-[#2a2e39] rounded-full relative overflow-hidden">
          <div
            className="absolute top-0 bottom-0 bg-[#2962ff] rounded-full"
            style={{ left: 0, width: `${currentPos}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden flex flex-col">
      {/* Table Toolbar 1: Category & Preset Filters */}
      <div className="p-4 border-b border-[#2a2e39] flex flex-wrap items-center justify-between gap-4">
        {/* Category selector */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'stocks', label: 'Stocks' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'forex', label: 'Forex' },
            { id: 'indices', label: 'Indices' },
            { id: 'commodities', label: 'Commodities' },
            { id: 'bonds', label: 'Bonds' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as MarketCategory)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 font-medium ${
                selectedCategory === cat.id
                  ? 'bg-[#2962ff] text-white shadow-sm'
                  : 'text-[#9598a1] hover:text-white bg-[#171b26] border border-[#2a2e39]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] max-w-xs w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#787b86]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter symbols (e.g. AAPL, BTC)..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#131722] border border-[#2a2e39] rounded-lg text-xs text-white placeholder-[#787b86] focus:outline-none focus:border-[#2962ff]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#787b86] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Toolbar 2: Tab Perspectives & Quick Screener Presets */}
      <div className="px-4 py-2.5 bg-[#171b26]/50 border-b border-[#2a2e39] flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Perspectives */}
        <div className="flex items-center gap-1 font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'overview'
                ? 'text-white bg-[#2a2e39] font-bold'
                : 'text-[#9598a1] hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'performance'
                ? 'text-white bg-[#2a2e39] font-bold'
                : 'text-[#9598a1] hover:text-white'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('technicals')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'technicals'
                ? 'text-white bg-[#2a2e39] font-bold'
                : 'text-[#9598a1] hover:text-white'
            }`}
          >
            Technicals
          </button>
          <button
            onClick={() => setActiveTab('valuation')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'valuation'
                ? 'text-white bg-[#2a2e39] font-bold'
                : 'text-[#9598a1] hover:text-white'
            }`}
          >
            Valuation
          </button>
        </div>

        {/* Screener Presets */}
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto scrollbar-none">
          <span className="text-[#787b86] mr-1 hidden sm:inline">Screen:</span>
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'gainers', label: 'Top Gainers' },
              { id: 'losers', label: 'Top Losers' },
              { id: 'volume', label: 'High Vol' },
              { id: 'strong_buy', label: 'Strong Buy' },
              { id: 'overbought', label: 'RSI > 70' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPresetFilter(preset.id)}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                presetFilter === preset.id
                  ? 'bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/40'
                  : 'text-[#787b86] hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs text-[#d1d4dc] border-collapse">
          <thead>
            <tr className="border-b border-[#2a2e39] bg-[#171b26]/70 text-[#787b86] font-semibold select-none">
              <th className="py-2.5 px-3 w-10 text-center">
                <Star className="w-3.5 h-3.5 mx-auto text-[#787b86]" />
              </th>
              <th
                onClick={() => handleSort('symbol')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Symbol & Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Last Price</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('changePercent')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Change %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Change $</th>

              {activeTab === 'overview' && (
                <>
                  <th className="py-2.5 px-3 hidden lg:table-cell">24h Range</th>
                  <th
                    onClick={() => handleSort('volume')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    Volume
                  </th>
                  <th
                    onClick={() => handleSort('marketCap')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                  >
                    Market Cap
                  </th>
                  <th className="py-2.5 px-3 text-center">Technical Rating</th>
                  <th className="py-2.5 px-3 text-right hidden md:table-cell">24h Chart</th>
                </>
              )}

              {activeTab === 'performance' && (
                <>
                  <th className="py-2.5 px-3 text-right">Open</th>
                  <th className="py-2.5 px-3 text-right">24h High</th>
                  <th className="py-2.5 px-3 text-right">24h Low</th>
                  <th className="py-2.5 px-3 text-right">52W High</th>
                  <th className="py-2.5 px-3 text-right">52W Low</th>
                </>
              )}

              {activeTab === 'technicals' && (
                <>
                  <th
                    onClick={() => handleSort('rsi')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    RSI (14)
                  </th>
                  <th className="py-2.5 px-3 text-center">Summary Rating</th>
                  <th className="py-2.5 px-3 text-right">Momentum</th>
                  <th className="py-2.5 px-3 text-right">Exchange</th>
                </>
              )}

              {activeTab === 'valuation' && (
                <>
                  <th className="py-2.5 px-3 text-right">P/E Ratio</th>
                  <th className="py-2.5 px-3 text-right">Div Yield</th>
                  <th className="py-2.5 px-3 text-right">Market Cap</th>
                  <th className="py-2.5 px-3 text-right">Sector</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2e39]/50 font-mono">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-[#787b86]">
                  No market instruments found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const isPositive = asset.change >= 0;
                const isSelected = selectedSymbol === asset.symbol;
                const isSaved = watchlist.includes(asset.symbol);

                return (
                  <tr
                    key={asset.symbol}
                    onClick={() => onSelectSymbol(asset.symbol)}
                    className={`cursor-pointer transition-colors hover:bg-[#2a2e39]/60 ${
                      isSelected ? 'bg-[#2a2e39]/80 ring-1 ring-inset ring-[#2962ff]/40' : ''
                    }`}
                  >
                    {/* Watchlist star */}
                    <td
                      className="py-3 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(asset.symbol);
                      }}
                    >
                      <button
                        className="p-1 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-amber-400 transition-colors"
                        title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isSaved ? 'text-amber-400 fill-amber-400' : ''
                          }`}
                        />
                      </button>
                    </td>

                    {/* Symbol & Name */}
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{asset.symbol}</span>
                            <span className="text-[10px] text-[#787b86] px-1 py-0.2 bg-[#2a2e39] rounded font-mono">
                              {asset.exchange}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#787b86] block truncate max-w-[130px] sm:max-w-[200px]">
                            {asset.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-bold text-white tabular-nums">
                      {formatPrice(asset.price, asset.currency)}
                    </td>

                    {/* Change % */}
                    <td
                      className={`py-3 px-3 text-right font-bold tabular-nums ${
                        isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {formatPercent(asset.changePercent)}
                    </td>

                    {/* Change $ */}
                    <td
                      className={`py-3 px-3 text-right tabular-nums ${
                        isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {formatChange(asset.change, asset.currency)}
                    </td>

                    {/* Mode Specific Columns */}
                    {activeTab === 'overview' && (
                      <>
                        <td className="py-3 px-3 hidden lg:table-cell">
                          {renderRangeBar(asset)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {formatVolume(asset.volume)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums hidden sm:table-cell">
                          {formatCompactNumber(asset.marketCap)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-sans text-[11px] font-semibold px-2 py-0.5 rounded ${
                              asset.technicalRating.includes('Buy')
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : asset.technicalRating.includes('Sell')
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {asset.technicalRating}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right hidden md:table-cell">
                          <div className="flex justify-end">
                            {renderSparkline(asset.sparkline, isPositive)}
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === 'performance' && (
                      <>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {formatPrice(asset.open, asset.currency)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {formatPrice(asset.high, asset.currency)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {formatPrice(asset.low, asset.currency)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {formatPrice(asset.high52w, asset.currency)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {formatPrice(asset.low52w, asset.currency)}
                        </td>
                      </>
                    )}

                    {activeTab === 'technicals' && (
                      <>
                        <td className="py-3 px-3 text-right font-bold tabular-nums">
                          <span
                            className={
                              asset.rsi >= 70
                                ? 'text-rose-400'
                                : asset.rsi <= 30
                                ? 'text-emerald-400'
                                : 'text-white'
                            }
                          >
                            {asset.rsi.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-sans font-medium text-[11px] text-white">
                          {asset.technicalRating}
                        </td>
                        <td className="py-3 px-3 text-right font-sans text-xs text-[#9598a1]">
                          {asset.rsi > 60 ? 'Bullish' : asset.rsi < 40 ? 'Bearish' : 'Neutral'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-[#787b86]">
                          {asset.exchange}
                        </td>
                      </>
                    )}

                    {activeTab === 'valuation' && (
                      <>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {asset.peRatio ? asset.peRatio.toFixed(1) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {asset.dividendYield ? `${asset.dividendYield.toFixed(2)}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-[#9598a1] tabular-nums">
                          {formatCompactNumber(asset.marketCap)}
                        </td>
                        <td className="py-3 px-3 text-right font-sans text-xs text-[#787b86]">
                          {asset.sector || asset.category}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary Count */}
      <div className="p-3 bg-[#171b26]/70 border-t border-[#2a2e39] flex items-center justify-between text-xs text-[#787b86]">
        <span>Showing {filteredAssets.length} of {assets.length} financial instruments</span>
        <span className="font-mono text-[11px]">Real-time quotes powered by TradingView data engine</span>
      </div>
    </div>
  );
};
