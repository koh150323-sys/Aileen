import React from 'react';
import { MarketAsset } from '../types/market';
import { formatPrice, formatPercent } from '../utils/formatters';

interface TickerTapeProps {
  assets: MarketAsset[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  recentTickMap: Record<string, 'up' | 'down'>;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  recentTickMap,
}) => {
  // Select benchmark items for the ticker
  const tickerSymbols = ['SPX', 'NDX', 'DJI', 'BTC/USD', 'ETH/USD', 'EUR/USD', 'XAU/USD', 'WTI', 'NVDA', 'TSLA', 'US10Y'];
  const tickerItems = tickerSymbols
    .map((sym) => assets.find((a) => a.symbol === sym))
    .filter((a): a is MarketAsset => Boolean(a));

  return (
    <div className="w-full bg-[#171b26] dark:bg-[#171b26] border-b border-[#2a2e39] overflow-hidden select-none">
      <div className="max-w-[1720px] mx-auto flex items-center overflow-x-auto scrollbar-none py-1.5 px-4 text-xs font-mono">
        <div className="flex items-center gap-6 whitespace-nowrap">
          {tickerItems.map((item) => {
            const isPositive = item.change >= 0;
            const tick = recentTickMap[item.symbol];
            const isSelected = selectedSymbol === item.symbol;

            return (
              <button
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all shrink-0 hover:bg-[#2a2e39]/60 ${
                  isSelected ? 'bg-[#2a2e39] ring-1 ring-[#2962ff]' : ''
                } ${
                  tick === 'up'
                    ? 'bg-emerald-500/15 duration-100'
                    : tick === 'down'
                    ? 'bg-rose-500/15 duration-100'
                    : ''
                }`}
              >
                <span className="font-sans font-semibold text-white tracking-wide">
                  {item.symbol}
                </span>

                <span
                  className={`tabular-nums font-medium ${
                    tick === 'up'
                      ? 'text-emerald-400 font-bold'
                      : tick === 'down'
                      ? 'text-rose-400 font-bold'
                      : 'text-[#d1d4dc]'
                  }`}
                >
                  {formatPrice(item.price, item.currency)}
                </span>

                <span
                  className={`tabular-nums font-semibold flex items-center ${
                    isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                  }`}
                >
                  {formatPercent(item.changePercent)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
