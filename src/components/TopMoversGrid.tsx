import React from 'react';
import { TrendingUp, TrendingDown, Activity, Award } from 'lucide-react';
import { MarketAsset } from '../types/market';
import { formatPrice, formatPercent, formatVolume } from '../utils/formatters';

interface TopMoversGridProps {
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
}

export const TopMoversGrid: React.FC<TopMoversGridProps> = ({
  assets,
  onSelectSymbol,
  selectedSymbol,
}) => {
  // Sort copies for different leaderboards
  const gainers = [...assets].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const losers = [...assets].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);
  const mostActive = [...assets].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 4);
  const technicalLeaders = [...assets]
    .filter((a) => a.technicalRating === 'Strong Buy')
    .sort((a, b) => b.rsi - a.rsi)
    .slice(0, 4);

  const renderSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 56;
    const height = 20;

    const pathD = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#089981' : '#f23645';

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
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

  const renderCard = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    items: MarketAsset[],
    highlightMetric?: (asset: MarketAsset) => React.ReactNode
  ) => {
    return (
      <div className="bg-[#1e222d] dark:bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39]/80 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2a2e39] text-[#2962ff]">{icon}</div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-[#787b86]">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#2a2e39]/50">
          {items.map((item) => {
            const isPositive = item.change >= 0;
            const isSelected = selectedSymbol === item.symbol;

            return (
              <button
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                className={`w-full py-2.5 px-2 flex items-center justify-between text-left rounded-lg transition-colors hover:bg-[#2a2e39]/50 ${
                  isSelected ? 'bg-[#2a2e39]/70 ring-1 ring-[#2962ff]/50' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate font-sans">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] text-[#787b86] uppercase font-mono">
                        {item.exchange}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#787b86] truncate block max-w-[110px]">
                      {item.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {renderSparkline(item.sparkline, isPositive)}

                  <div className="text-right">
                    <div className="font-mono text-xs font-medium text-white tabular-nums">
                      {formatPrice(item.price, item.currency)}
                    </div>
                    {highlightMetric ? (
                      highlightMetric(item)
                    ) : (
                      <div
                        className={`font-mono text-[11px] font-semibold tabular-nums ${
                          isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {formatPercent(item.changePercent)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {renderCard(
        'Top Gainers',
        'Highest % return today',
        <TrendingUp className="w-4 h-4 text-emerald-400" />,
        gainers
      )}
      {renderCard(
        'Top Losers',
        'Largest drawdowns today',
        <TrendingDown className="w-4 h-4 text-rose-400" />,
        losers
      )}
      {renderCard(
        'Most Active',
        'Highest trading volume',
        <Activity className="w-4 h-4 text-[#2962ff]" />,
        mostActive,
        (item) => (
          <div className="font-mono text-[11px] text-[#9598a1] tabular-nums">
            Vol {formatVolume(item.volume)}
          </div>
        )
      )}
      {renderCard(
        'Technical Buy',
        'Highest momentum rating',
        <Award className="w-4 h-4 text-amber-400" />,
        technicalLeaders,
        (item) => (
          <div className="font-mono text-[11px] text-emerald-400 font-medium tabular-nums">
            RSI {item.rsi.toFixed(1)}
          </div>
        )
      )}
    </div>
  );
};
