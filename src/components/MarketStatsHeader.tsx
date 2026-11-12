import React, { useState, useEffect } from 'react';
import { Clock, Globe, BarChart2 } from 'lucide-react';
import { MarketAsset } from '../types/market';
import { formatCompactNumber } from '../utils/formatters';

interface MarketStatsHeaderProps {
  assets: MarketAsset[];
}

export const MarketStatsHeader: React.FC<MarketStatsHeaderProps> = ({ assets }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute market breadth
  const advancing = assets.filter((a) => a.changePercent > 0).length;
  const declining = assets.filter((a) => a.changePercent < 0).length;
  const total = assets.length;
  const advancePercent = Math.round((advancing / total) * 100);

  // Calculate total tracked volume
  const totalVolume = assets.reduce((acc, curr) => acc + (curr.volume || 0), 0);

  return (
    <div className="w-full bg-[#1e222d] dark:bg-[#1e222d] border-b border-[#2a2e39] py-3 px-4 sm:px-6">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left: Global Market Sessions */}
        <div className="flex items-center flex-wrap gap-4 text-[#9598a1]">
          <div className="flex items-center gap-1.5 font-medium text-white">
            <Globe className="w-3.5 h-3.5 text-[#2962ff]" />
            <span className="font-semibold text-white">Global Markets</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#9598a1]">New York (NYSE)</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-medium">
              Open · {time} EST
            </span>
          </div>

          <span className="text-[#363a45] hidden md:inline">|</span>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[#9598a1]">London (LSE)</span>
            <span className="text-emerald-400 font-mono font-medium">Open</span>
          </div>

          <span className="text-[#363a45] hidden lg:inline">|</span>

          <div className="hidden xl:flex items-center gap-2">
            <span className="text-[#9598a1]">Tokyo (TSE)</span>
            <span className="text-[#787b86] font-mono font-medium">Closed</span>
          </div>
        </div>

        {/* Right: Breadth & Sentiment Indicators */}
        <div className="flex items-center flex-wrap gap-6 text-[#9598a1]">
          {/* Market Breadth */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-[#787b86]" />
              <span className="text-[#9598a1]">Breadth:</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#089981] font-semibold">{advancing} Up</span>
              <div className="w-16 h-1.5 bg-[#2a2e39] rounded-full overflow-hidden flex">
                <div
                  className="bg-[#089981] h-full transition-all duration-500"
                  style={{ width: `${advancePercent}%` }}
                />
                <div
                  className="bg-[#f23645] h-full transition-all duration-500"
                  style={{ width: `${100 - advancePercent}%` }}
                />
              </div>
              <span className="text-[#f23645] font-semibold">{declining} Down</span>
            </div>
          </div>

          <span className="text-[#363a45] hidden sm:inline">|</span>

          {/* Fear & Greed Index */}
          <div className="flex items-center gap-2">
            <span className="text-[#9598a1]">Sentiment:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                74 · Greed
              </span>
            </div>
          </div>

          <span className="text-[#363a45] hidden md:inline">|</span>

          {/* Total Market Volume */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[#9598a1]">Tracked Vol:</span>
            <span className="font-mono text-white font-medium tabular-nums">
              {formatCompactNumber(totalVolume)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
