import React, { useState } from 'react';
import { MarketAsset } from '../types/market';
import { formatPrice, formatPercent, formatCompactNumber } from '../utils/formatters';
import { Grid, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketHeatmapProps {
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({
  assets,
  onSelectSymbol,
  selectedSymbol,
}) => {
  const [filterGroup, setFilterGroup] = useState<'all' | 'tech' | 'crypto' | 'equities'>('all');
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  // Filter assets based on sector/group
  const filteredAssets = assets.filter((asset) => {
    if (filterGroup === 'tech') return asset.sector === 'Technology' || asset.sector === 'Communication';
    if (filterGroup === 'crypto') return asset.category === 'crypto';
    if (filterGroup === 'equities') return asset.category === 'stocks' || asset.category === 'indices';
    return true;
  });

  // Calculate color based on percentage change
  const getColor = (pct: number) => {
    if (pct >= 4) return 'bg-[#089981] hover:brightness-110';
    if (pct >= 2) return 'bg-[#0e7c6b] hover:brightness-110';
    if (pct > 0) return 'bg-[#12584e] hover:brightness-110';
    if (pct === 0) return 'bg-[#2a2e39] hover:brightness-110';
    if (pct > -2) return 'bg-[#822a32] hover:brightness-110';
    if (pct > -4) return 'bg-[#ba2935] hover:brightness-110';
    return 'bg-[#f23645] hover:brightness-110';
  };

  // Group assets for visual clustering
  const megaCaps = filteredAssets.filter((a) => (a.marketCap || 0) >= 1e12);
  const largeCaps = filteredAssets.filter((a) => (a.marketCap || 0) >= 1e11 && (a.marketCap || 0) < 1e12);
  const others = filteredAssets.filter((a) => (a.marketCap || 0) < 1e11);

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Heatmap Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#2a2e39]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#2a2e39] text-[#2962ff]">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Market Performance Heatmap
            </h2>
            <p className="text-xs text-[#787b86]">
              Box size indicates relative market capitalization · Color indicates 24h performance
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 bg-[#171b26] p-1 border border-[#2a2e39] rounded-lg text-xs">
          <button
            onClick={() => setFilterGroup('all')}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterGroup === 'all' ? 'bg-[#2a2e39] text-white font-semibold' : 'text-[#9598a1] hover:text-white'
            }`}
          >
            All Markets
          </button>
          <button
            onClick={() => setFilterGroup('tech')}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterGroup === 'tech' ? 'bg-[#2a2e39] text-white font-semibold' : 'text-[#9598a1] hover:text-white'
            }`}
          >
            Big Tech & Semis
          </button>
          <button
            onClick={() => setFilterGroup('crypto')}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterGroup === 'crypto' ? 'bg-[#2a2e39] text-white font-semibold' : 'text-[#9598a1] hover:text-white'
            }`}
          >
            Crypto Leaders
          </button>
          <button
            onClick={() => setFilterGroup('equities')}
            className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
              filterGroup === 'equities' ? 'bg-[#2a2e39] text-white font-semibold' : 'text-[#9598a1] hover:text-white'
            }`}
          >
            Equities & Indices
          </button>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between text-xs text-[#787b86] px-1 font-mono">
        <span>-4.0%</span>
        <div className="flex items-center gap-1">
          <div className="w-5 h-3 rounded-sm bg-[#f23645]" title="-4% or worse" />
          <div className="w-5 h-3 rounded-sm bg-[#ba2935]" title="-2% to -4%" />
          <div className="w-5 h-3 rounded-sm bg-[#822a32]" title="0% to -2%" />
          <div className="w-5 h-3 rounded-sm bg-[#2a2e39]" title="Neutral 0%" />
          <div className="w-5 h-3 rounded-sm bg-[#12584e]" title="0% to +2%" />
          <div className="w-5 h-3 rounded-sm bg-[#0e7c6b]" title="+2% to +4%" />
          <div className="w-5 h-3 rounded-sm bg-[#089981]" title="+4% or better" />
        </div>
        <span>+4.0%</span>
      </div>

      {/* Treemap Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 min-h-[360px]">
        {/* Mega Caps Block (Takes 7 columns on desktop) */}
        {megaCaps.length > 0 && (
          <div className="col-span-12 md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {megaCaps.map((asset) => {
              const isSelected = selectedSymbol === asset.symbol;
              const isHovered = hoveredSymbol === asset.symbol;

              return (
                <button
                  key={asset.symbol}
                  onClick={() => onSelectSymbol(asset.symbol)}
                  onMouseEnter={() => setHoveredSymbol(asset.symbol)}
                  onMouseLeave={() => setHoveredSymbol(null)}
                  className={`relative p-3.5 rounded-lg text-left transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-sm ${getColor(
                    asset.changePercent
                  )} ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#131722] z-10'
                      : ''
                  }`}
                  style={{ minHeight: '110px' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-extrabold text-white text-base tracking-tight font-sans block">
                        {asset.symbol}
                      </span>
                      <span className="text-[11px] text-white/70 truncate block max-w-[120px]">
                        {asset.name}
                      </span>
                    </div>
                    {asset.changePercent >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-white/90 shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-white/90 shrink-0" />
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-xs font-bold text-white tabular-nums">
                      {formatPrice(asset.price, asset.currency)}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white tabular-nums drop-shadow-sm">
                      {formatPercent(asset.changePercent)}
                    </span>
                  </div>

                  {asset.marketCap && (
                    <div className="text-[10px] text-white/60 font-mono mt-0.5">
                      Cap: {formatCompactNumber(asset.marketCap)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Large Caps & Others Block (Takes 5 columns on desktop) */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-2">
          {/* Large Caps */}
          {largeCaps.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 flex-1">
              {largeCaps.map((asset) => {
                const isSelected = selectedSymbol === asset.symbol;

                return (
                  <button
                    key={asset.symbol}
                    onClick={() => onSelectSymbol(asset.symbol)}
                    className={`p-2.5 rounded-lg text-left transition-all duration-150 flex flex-col justify-between ${getColor(
                      asset.changePercent
                    )} ${
                      isSelected
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#131722] z-10'
                        : ''
                    }`}
                    style={{ minHeight: '85px' }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-white text-sm font-sans">
                        {asset.symbol}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-white tabular-nums">
                        {formatPercent(asset.changePercent)}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs mt-1">
                      <span className="font-mono text-white/90 tabular-nums text-[11px]">
                        {formatPrice(asset.price, asset.currency)}
                      </span>
                      {asset.marketCap && (
                        <span className="text-[10px] text-white/60 font-mono">
                          {formatCompactNumber(asset.marketCap)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Smaller/Other Assets */}
          {others.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {others.slice(0, 8).map((asset) => {
                const isSelected = selectedSymbol === asset.symbol;

                return (
                  <button
                    key={asset.symbol}
                    onClick={() => onSelectSymbol(asset.symbol)}
                    className={`p-1.5 rounded text-left transition-all ${getColor(
                      asset.changePercent
                    )} ${
                      isSelected
                        ? 'ring-1 ring-white ring-offset-1 ring-offset-[#131722]'
                        : ''
                    }`}
                  >
                    <span className="font-bold text-white text-[11px] block truncate">
                      {asset.symbol}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-white tabular-nums block">
                      {formatPercent(asset.changePercent)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
