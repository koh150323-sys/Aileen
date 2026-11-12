import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, ArrowRight } from 'lucide-react';
import { MarketAsset, MarketCategory } from '../types/market';
import { formatPrice, formatPercent } from '../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectSymbol,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filtered = assets.filter((asset) => {
    if (selectedCategory !== 'all' && asset.category !== selectedCategory) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      asset.symbol.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      asset.exchange.toLowerCase().includes(q) ||
      (asset.sector && asset.sector.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#1e222d] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#2a2e39] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#2962ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, currency, or company (e.g. NVDA, Bitcoin, S&P 500)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#787b86] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#787b86] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline px-2 py-0.5 text-xs bg-[#2a2e39] text-[#787b86] rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips */}
        <div className="px-4 py-2 border-b border-[#2a2e39] bg-[#171b26]/50 flex items-center gap-1.5 overflow-x-auto text-xs">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'stocks', label: 'Stocks' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'forex', label: 'Forex' },
              { id: 'indices', label: 'Indices' },
              { id: 'commodities', label: 'Commodities' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${
                selectedCategory === cat.id
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#9598a1] hover:text-white bg-[#2a2e39]/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#2a2e39]/50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#787b86] text-xs">
              No matching financial symbols found for "{query}".
            </div>
          ) : (
            filtered.map((asset) => {
              const isPositive = asset.change >= 0;

              return (
                <button
                  key={asset.symbol}
                  onClick={() => {
                    onSelectSymbol(asset.symbol);
                    onClose();
                  }}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#2a2e39]/60 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#2a2e39] flex items-center justify-center text-xs font-bold text-white uppercase font-sans group-hover:bg-[#2962ff] transition-colors">
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{asset.symbol}</span>
                        <span className="text-[10px] text-[#787b86] px-1 py-0.2 bg-[#2a2e39] rounded font-mono">
                          {asset.exchange}
                        </span>
                      </div>
                      <span className="text-xs text-[#787b86] block truncate max-w-[240px]">
                        {asset.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-white tabular-nums">
                      {formatPrice(asset.price, asset.currency)}
                    </div>
                    <div
                      className={`text-xs font-semibold tabular-nums ${
                        isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {formatPercent(asset.changePercent)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#171b26] border-t border-[#2a2e39] flex items-center justify-between text-xs text-[#787b86]">
          <span>Press Enter to select</span>
          <span className="font-mono">{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
};
