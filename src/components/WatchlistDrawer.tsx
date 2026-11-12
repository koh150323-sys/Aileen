import React from 'react';
import { X, Star, Trash2, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { MarketAsset } from '../types/market';
import { formatPrice, formatPercent } from '../utils/formatters';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  onAddToWatchlist: (symbol: string) => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  watchlist,
  assets,
  onSelectSymbol,
  onRemoveFromWatchlist,
  onAddToWatchlist,
}) => {
  if (!isOpen) return null;

  const watchlistedAssets = watchlist
    .map((sym) => assets.find((a) => a.symbol === sym))
    .filter((a): a is MarketAsset => Boolean(a));

  const suggestedSymbols = ['SPX', 'NVDA', 'BTC/USD', 'TSLA', 'AAPL', 'EUR/USD'].filter(
    (s) => !watchlist.includes(s)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1e222d] border-l border-[#2a2e39] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#2a2e39] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">My Watchlist</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2e39] text-[#9598a1] font-mono">
              {watchlistedAssets.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {watchlistedAssets.length === 0 ? (
            <div className="py-12 text-center">
              <Star className="w-10 h-10 text-[#787b86]/40 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">Your Watchlist is empty</h3>
              <p className="text-xs text-[#787b86] max-w-xs mx-auto mt-1">
                Star any stock, crypto, forex, or commodity from the table or chart to track it here in real-time.
              </p>

              {/* Suggestions */}
              {suggestedSymbols.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#2a2e39]">
                  <p className="text-xs text-[#9598a1] mb-2 font-medium">Quick suggestions:</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {suggestedSymbols.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => onAddToWatchlist(sym)}
                        className="px-2.5 py-1 text-xs font-semibold bg-[#2a2e39] hover:bg-[#2962ff] text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            watchlistedAssets.map((asset) => {
              const isPositive = asset.change >= 0;

              return (
                <div
                  key={asset.symbol}
                  className="p-3 bg-[#171b26] border border-[#2a2e39] rounded-xl hover:border-[#2962ff]/50 transition-all flex items-center justify-between group"
                >
                  <button
                    onClick={() => {
                      onSelectSymbol(asset.symbol);
                      onClose();
                    }}
                    className="flex-1 text-left flex items-center justify-between pr-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{asset.symbol}</span>
                        <span className="text-[10px] text-[#787b86] uppercase font-mono">
                          {asset.exchange}
                        </span>
                      </div>
                      <span className="text-xs text-[#787b86] block truncate max-w-[140px]">
                        {asset.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatPrice(asset.price, asset.currency)}
                      </div>
                      <div
                        className={`font-mono text-xs font-semibold tabular-nums flex items-center justify-end ${
                          isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 inline mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 inline mr-0.5" />
                        )}
                        {formatPercent(asset.changePercent)}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => onRemoveFromWatchlist(asset.symbol)}
                    className="p-1.5 rounded-lg text-[#787b86] hover:text-rose-400 hover:bg-[#2a2e39] transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2e39] bg-[#171b26]/50 text-xs text-[#787b86] flex items-center justify-between font-mono">
          <span>Synced locally</span>
          <span>{watchlistedAssets.length} tracked</span>
        </div>
      </div>
    </div>
  );
};
