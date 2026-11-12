import React, { useState, useMemo, useRef } from 'react';
import {
  Star,
  Maximize2,
  Minimize2,
  TrendingUp,
  BarChart2,
  Layers,
  Bell,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { MarketAsset, OHLCV } from '../types/market';
import {
  formatPrice,
  formatChange,
  formatPercent,
  formatCompactNumber,
  formatVolume,
} from '../utils/formatters';

interface InteractiveChartProps {
  asset: MarketAsset;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

type Timeframe = '1D' | '5D' | '1M' | '6M' | '1Y' | 'ALL';
type ChartStyle = 'candle' | 'area';

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  asset,
  isWatchlisted,
  onToggleWatchlist,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candle');
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(false);
  const [showBollinger, setShowBollinger] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>(asset.price.toString());
  const [alertConfirmed, setAlertConfirmed] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Get current candle data based on timeframe
  const candles: OHLCV[] = useMemo(() => {
    return asset.history[timeframe] || asset.history['1D'];
  }, [asset, timeframe]);

  // Compute Moving Averages
  const { sma20, sma50, bollinger, rsiValues } = useMemo(() => {
    const closes = candles.map((c) => c.close);

    // SMA calculation helper
    const calcSMA = (period: number): (number | null)[] => {
      return closes.map((_, idx) => {
        if (idx < period - 1) return null;
        const slice = closes.slice(idx - period + 1, idx + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
      });
    };

    const sma20Arr = calcSMA(Math.min(10, Math.floor(closes.length / 2)));
    const sma50Arr = calcSMA(Math.min(20, Math.floor(closes.length * 0.75)));

    // Bollinger Bands (using SMA20 + 2 standard deviations)
    const bollingerBands = closes.map((val, idx) => {
      const avg = sma20Arr[idx];
      if (avg === null) return null;
      const period = Math.min(10, Math.floor(closes.length / 2));
      const slice = closes.slice(Math.max(0, idx - period + 1), idx + 1);
      const variance = slice.reduce((acc, curr) => acc + Math.pow(curr - avg, 2), 0) / slice.length;
      const stdDev = Math.sqrt(variance);
      return {
        upper: avg + stdDev * 1.8,
        middle: avg,
        lower: avg - stdDev * 1.8,
      };
    });

    // Approximate RSI oscillator
    const rsiArr = closes.map((_, idx) => {
      if (idx === 0) return 50;
      const prev = closes[idx - 1];
      const curr = closes[idx];
      const diff = curr - prev;
      const baseRsi = 50 + (diff / prev) * 500;
      return Math.min(Math.max(baseRsi, 15), 85);
    });

    return {
      sma20: sma20Arr,
      sma50: sma50Arr,
      bollinger: bollingerBands,
      rsiValues: rsiArr,
    };
  }, [candles]);

  // Min and Max for charting scale
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    // Add 2% padding
    const padding = (max - min) * 0.05 || 1;
    return {
      minPrice: Math.max(0.001, min - padding),
      maxPrice: max + padding,
      maxVolume: maxVol || 1,
    };
  }, [candles]);

  // Chart SVG coordinate metrics
  const chartWidth = 900;
  const chartHeight = showRSI ? 320 : 420;
  const rsiHeight = showRSI ? 90 : 0;
  const priceScaleWidth = 70;
  const plotWidth = chartWidth - priceScaleWidth;

  const getY = (price: number) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    return chartHeight - ratio * chartHeight;
  };

  const getX = (index: number) => {
    if (candles.length <= 1) return plotWidth / 2;
    return (index / (candles.length - 1)) * plotWidth;
  };

  // Hovered candle (or active current candle)
  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];
  const isPositiveCandle = activeCandle ? activeCandle.close >= activeCandle.open : asset.change >= 0;

  // Handle mouse move for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = mouseX / rect.width;
    const svgX = ratio * chartWidth;

    if (svgX < 0 || svgX > plotWidth) {
      setHoveredIndex(null);
      return;
    }

    const candleIndex = Math.round((svgX / plotWidth) * (candles.length - 1));
    if (candleIndex >= 0 && candleIndex < candles.length) {
      setHoveredIndex(candleIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleSetAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertConfirmed(true);
    setTimeout(() => {
      setAlertConfirmed(false);
      setShowAlertModal(false);
    }, 1500);
  };

  // Generate Area Path
  const areaPathD = useMemo(() => {
    if (!candles.length) return { line: '', fill: '' };
    const points = candles.map((c, i) => `${getX(i).toFixed(1)},${getY(c.close).toFixed(1)}`);
    const linePath = `M ${points.join(' L ')}`;
    const closeArea = ` L ${getX(candles.length - 1).toFixed(1)},${chartHeight} L 0,${chartHeight} Z`;
    return {
      line: linePath,
      fill: linePath + closeArea,
    };
  }, [candles, minPrice, maxPrice]);

  return (
    <div className="bg-[#1e222d] dark:bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden flex flex-col shadow-sm">
      {/* Top Chart Header */}
      <div className="p-4 border-b border-[#2a2e39] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Asset details & live quote */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleWatchlist(asset.symbol)}
            className={`p-1.5 rounded-md border transition-colors ${
              isWatchlisted
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-[#2a2e39]/50 border-transparent text-[#787b86] hover:text-white'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">{asset.symbol}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#2a2e39] text-[#9598a1] font-mono">
                {asset.exchange}
              </span>
              <span className="text-xs text-[#787b86] truncate max-w-[140px] sm:max-w-none">
                {asset.name}
              </span>
            </div>

            {/* Price & Change line */}
            <div className="flex items-baseline gap-2.5 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
                {formatPrice(asset.price, asset.currency)}
              </span>
              <span
                className={`font-mono text-xs font-semibold tabular-nums flex items-center ${
                  asset.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {formatChange(asset.change, asset.currency)} ({formatPercent(asset.changePercent)})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Timeframe & Indicators & Chart Type Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Style Switcher */}
          <div className="flex items-center p-0.5 bg-[#171b26] border border-[#2a2e39] rounded-lg">
            <button
              onClick={() => setChartStyle('candle')}
              className={`p-1.5 rounded text-xs font-medium transition-colors ${
                chartStyle === 'candle' ? 'bg-[#2962ff] text-white shadow-sm' : 'text-[#9598a1] hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartStyle('area')}
              className={`p-1.5 rounded text-xs font-medium transition-colors ${
                chartStyle === 'area' ? 'bg-[#2962ff] text-white shadow-sm' : 'text-[#9598a1] hover:text-white'
              }`}
              title="Line / Area Chart"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center p-0.5 bg-[#171b26] border border-[#2a2e39] rounded-lg text-xs font-mono">
            {(['1D', '5D', '1M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeframe === tf ? 'bg-[#2a2e39] text-white font-bold' : 'text-[#9598a1] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Technical Indicator Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                showSMA20
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 font-semibold'
                  : 'bg-[#171b26] border-[#2a2e39] text-[#787b86] hover:text-white'
              }`}
            >
              SMA 20
            </button>
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                showSMA50
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-semibold'
                  : 'bg-[#171b26] border-[#2a2e39] text-[#787b86] hover:text-white'
              }`}
            >
              SMA 50
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                showBollinger
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-400 font-semibold'
                  : 'bg-[#171b26] border-[#2a2e39] text-[#787b86] hover:text-white'
              }`}
            >
              BB
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                showRSI
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                  : 'bg-[#171b26] border-[#2a2e39] text-[#787b86] hover:text-white'
              }`}
            >
              RSI
            </button>
          </div>

          {/* Set Alert Trigger */}
          <button
            onClick={() => {
              setAlertTargetPrice(asset.price.toString());
              setShowAlertModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#9598a1] hover:text-white bg-[#171b26] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-lg transition-colors"
            title="Set Price Alert"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Alert</span>
          </button>

          {/* Expand Fullscreen Button */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg bg-[#171b26] border border-[#2a2e39] text-[#9598a1] hover:text-white transition-colors"
              title={isExpanded ? 'Minimize View' : 'Full View'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Active Candle OHLCV Sub-Header */}
      <div className="px-4 py-2 bg-[#171b26]/60 border-b border-[#2a2e39] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-4 text-[#9598a1]">
          <span>
            Time: <strong className="text-white">{activeCandle?.time || '—'}</strong>
          </span>
          <span>
            O:{' '}
            <strong className={isPositiveCandle ? 'text-[#089981]' : 'text-[#f23645]'}>
              {formatPrice(activeCandle?.open || asset.open, asset.currency)}
            </strong>
          </span>
          <span>
            H:{' '}
            <strong className="text-white">
              {formatPrice(activeCandle?.high || asset.high, asset.currency)}
            </strong>
          </span>
          <span>
            L:{' '}
            <strong className="text-white">
              {formatPrice(activeCandle?.low || asset.low, asset.currency)}
            </strong>
          </span>
          <span>
            C:{' '}
            <strong className={isPositiveCandle ? 'text-[#089981]' : 'text-[#f23645]'}>
              {formatPrice(activeCandle?.close || asset.price, asset.currency)}
            </strong>
          </span>
          <span className="hidden sm:inline">
            Vol: <strong className="text-white">{formatVolume(activeCandle?.volume)}</strong>
          </span>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-3 text-[11px]">
          {showSMA20 && (
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-0.5 bg-blue-400 inline-block" /> SMA(20)
            </span>
          )}
          {showSMA50 && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-0.5 bg-amber-400 inline-block" /> SMA(50)
            </span>
          )}
          {showBollinger && (
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-0.5 bg-purple-400 inline-block" /> Bollinger(20,2)
            </span>
          )}
          {showRSI && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> RSI(14):{' '}
              {asset.rsi.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Main Interactive Chart SVG */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none bg-[#131722]"
        style={{ height: `${chartHeight + rsiHeight}px` }}
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + rsiHeight}`}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2962ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2962ff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#089981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#089981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = chartHeight * ratio;
            const price = maxPrice - (maxPrice - minPrice) * ratio;
            return (
              <g key={ratio}>
                <line
                  x1="0"
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke="#2a2e39"
                  strokeWidth="0.75"
                  strokeDasharray="2 3"
                />
                <text
                  x={plotWidth + 6}
                  y={y + 3}
                  fill="#787b86"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatPrice(price, asset.currency)}
                </text>
              </g>
            );
          })}

          {/* Vertical time grid */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const x = plotWidth * ratio;
            const idx = Math.floor(ratio * (candles.length - 1));
            return (
              <line
                key={ratio}
                x1={x}
                y1="0"
                x2={x}
                y2={chartHeight}
                stroke="#2a2e39"
                strokeWidth="0.5"
                strokeDasharray="2 4"
              />
            );
          })}

          {/* Volume Profile Bars (Bottom 18% of main chart) */}
          {candles.map((c, i) => {
            const x = getX(i);
            const barWidth = Math.max(2, (plotWidth / candles.length) * 0.7);
            const volHeight = (c.volume / maxVolume) * (chartHeight * 0.18);
            const isUp = c.close >= c.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x - barWidth / 2}
                y={chartHeight - volHeight}
                width={barWidth}
                height={volHeight}
                fill={isUp ? '#089981' : '#f23645'}
                opacity={hoveredIndex === i ? 0.7 : 0.35}
              />
            );
          })}

          {/* Bollinger Bands Shaded Area */}
          {showBollinger && (
            <path
              d={candles
                .map((_, i) => {
                  const b = bollinger[i];
                  if (!b) return '';
                  return `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(b.upper).toFixed(1)}`;
                })
                .concat(
                  candles
                    .slice()
                    .reverse()
                    .map((_, revIdx) => {
                      const origIdx = candles.length - 1 - revIdx;
                      const b = bollinger[origIdx];
                      if (!b) return '';
                      return `L ${getX(origIdx).toFixed(1)} ${getY(b.lower).toFixed(1)}`;
                    })
                )
                .join(' ') + ' Z'}
              fill="#9333ea"
              fillOpacity="0.08"
            />
          )}

          {/* Bollinger Bands Lines */}
          {showBollinger && (
            <>
              <path
                d={candles
                  .map((_, i) => {
                    const b = bollinger[i];
                    return b ? `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(b.upper).toFixed(1)}` : '';
                  })
                  .join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <path
                d={candles
                  .map((_, i) => {
                    const b = bollinger[i];
                    return b ? `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(b.lower).toFixed(1)}` : '';
                  })
                  .join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </>
          )}

          {/* Area Chart Mode */}
          {chartStyle === 'area' && (
            <>
              <path d={areaPathD.fill} fill="url(#areaGradient)" />
              <path
                d={areaPathD.line}
                fill="none"
                stroke="#2962ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Candlestick Chart Mode */}
          {chartStyle === 'candle' &&
            candles.map((c, i) => {
              const x = getX(i);
              const openY = getY(c.open);
              const closeY = getY(c.close);
              const highY = getY(c.high);
              const lowY = getY(c.low);
              const isUp = c.close >= c.open;
              const color = isUp ? '#089981' : '#f23645';
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);
              const candleWidth = Math.max(3, (plotWidth / candles.length) * 0.7);

              return (
                <g key={`candle-${i}`}>
                  {/* High/Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth="0.5"
                    rx="0.5"
                  />
                </g>
              );
            })}

          {/* SMA 20 Overlay */}
          {showSMA20 && (
            <path
              d={candles
                .map((_, i) => {
                  const val = sma20[i];
                  return val !== null
                    ? `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`
                    : '';
                })
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}

          {/* SMA 50 Overlay */}
          {showSMA50 && (
            <path
              d={candles
                .map((_, i) => {
                  const val = sma50[i];
                  return val !== null
                    ? `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`
                    : '';
                })
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}

          {/* Current Price Line & Tag on Right Axis */}
          {candles.length > 0 && (
            <g>
              <line
                x1="0"
                y1={getY(asset.price)}
                x2={plotWidth}
                y2={getY(asset.price)}
                stroke={asset.change >= 0 ? '#089981' : '#f23645'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <rect
                x={plotWidth}
                y={getY(asset.price) - 10}
                width={priceScaleWidth}
                height="20"
                fill={asset.change >= 0 ? '#089981' : '#f23645'}
                rx="3"
              />
              <text
                x={plotWidth + priceScaleWidth / 2}
                y={getY(asset.price) + 3}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {formatPrice(asset.price, asset.currency)}
              </text>
            </g>
          )}

          {/* Interactive Crosshair Tracking Cursor */}
          {hoveredIndex !== null && candles[hoveredIndex] && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={getX(hoveredIndex)}
                y1="0"
                x2={getX(hoveredIndex)}
                y2={chartHeight + (showRSI ? rsiHeight : 0)}
                stroke="#787b86"
                strokeWidth="0.75"
                strokeDasharray="3 3"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1="0"
                y1={getY(candles[hoveredIndex].close)}
                x2={plotWidth}
                y2={getY(candles[hoveredIndex].close)}
                stroke="#787b86"
                strokeWidth="0.75"
                strokeDasharray="3 3"
              />
              {/* Point Dot */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(candles[hoveredIndex].close)}
                r="3.5"
                fill="#ffffff"
                stroke="#2962ff"
                strokeWidth="2"
              />
              {/* Time Tag at bottom of main chart */}
              <rect
                x={getX(hoveredIndex) - 28}
                y={chartHeight - 16}
                width="56"
                height="16"
                fill="#2a2e39"
                rx="2"
              />
              <text
                x={getX(hoveredIndex)}
                y={chartHeight - 4}
                fill="#d1d4dc"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {candles[hoveredIndex].time}
              </text>
            </g>
          )}

          {/* Sub-Chart: RSI Oscillator Pane */}
          {showRSI && (
            <g transform={`translate(0, ${chartHeight})`}>
              {/* Pane Divider */}
              <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#2a2e39" strokeWidth="1" />
              <rect x="0" y="0" width={plotWidth} height={rsiHeight} fill="#0d1017" fillOpacity="0.4" />

              {/* 70 Overbought & 30 Oversold Lines */}
              <line
                x1="0"
                y1={rsiHeight * 0.3}
                x2={plotWidth}
                y2={rsiHeight * 0.3}
                stroke="#f23645"
                strokeWidth="0.75"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              <text
                x={plotWidth + 6}
                y={rsiHeight * 0.3 + 3}
                fill="#f23645"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                70 (OB)
              </text>

              <line
                x1="0"
                y1={rsiHeight * 0.7}
                x2={plotWidth}
                y2={rsiHeight * 0.7}
                stroke="#089981"
                strokeWidth="0.75"
                strokeDasharray="2 3"
                opacity="0.6"
              />
              <text
                x={plotWidth + 6}
                y={rsiHeight * 0.7 + 3}
                fill="#089981"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                30 (OS)
              </text>

              {/* RSI Curve */}
              <path
                d={candles
                  .map((_, i) => {
                    const r = rsiValues[i];
                    // Map 0-100 to rsiHeight
                    const y = rsiHeight - (r / 100) * rsiHeight;
                    return `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#089981"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              <text
                x="8"
                y="15"
                fill="#787b86"
                fontSize="9"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
              >
                RSI (14): {asset.rsi.toFixed(1)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Asset Valuation & Key Statistics Footer */}
      <div className="p-4 bg-[#171b26]/40 border-t border-[#2a2e39] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
        <div>
          <span className="text-[#787b86] block text-[11px]">52-Week High</span>
          <span className="font-mono text-white font-medium tabular-nums">
            {formatPrice(asset.high52w, asset.currency)}
          </span>
        </div>
        <div>
          <span className="text-[#787b86] block text-[11px]">52-Week Low</span>
          <span className="font-mono text-white font-medium tabular-nums">
            {formatPrice(asset.low52w, asset.currency)}
          </span>
        </div>
        <div>
          <span className="text-[#787b86] block text-[11px]">24h Volume</span>
          <span className="font-mono text-white font-medium tabular-nums">
            {formatVolume(asset.volume)}
          </span>
        </div>
        <div>
          <span className="text-[#787b86] block text-[11px]">Market Cap</span>
          <span className="font-mono text-white font-medium tabular-nums">
            {formatCompactNumber(asset.marketCap)}
          </span>
        </div>
        <div>
          <span className="text-[#787b86] block text-[11px]">Technical Rating</span>
          <span
            className={`font-medium ${
              asset.technicalRating.includes('Buy')
                ? 'text-emerald-400'
                : asset.technicalRating.includes('Sell')
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {asset.technicalRating}
          </span>
        </div>
        <div>
          <span className="text-[#787b86] block text-[11px]">P/E Ratio</span>
          <span className="font-mono text-white font-medium tabular-nums">
            {asset.peRatio ? asset.peRatio.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {/* Price Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39] mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Create Price Alert</h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-[#787b86] hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {alertConfirmed ? (
              <div className="py-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Alert Set Successfully!</p>
                <p className="text-xs text-[#787b86] mt-1">
                  You will be notified when {asset.symbol} reaches {formatPrice(Number(alertTargetPrice), asset.currency)}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSetAlert} className="space-y-4">
                <div>
                  <label className="text-xs text-[#9598a1] block mb-1">
                    Target Price for {asset.symbol} ({asset.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#2962ff]"
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#787b86] mt-1.5 font-mono">
                    <span>Current: {formatPrice(asset.price, asset.currency)}</span>
                    <button
                      type="button"
                      onClick={() => setAlertTargetPrice((asset.price * 1.05).toFixed(2))}
                      className="text-[#2962ff] hover:underline"
                    >
                      +5% Target
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertTargetPrice((asset.price * 0.95).toFixed(2))}
                      className="text-[#2962ff] hover:underline"
                    >
                      -5% Target
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(false)}
                    className="px-3 py-1.5 text-xs text-[#9598a1] hover:text-white bg-[#171b26] rounded-lg border border-[#2a2e39]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#2962ff] hover:bg-[#1e53e5] rounded-lg transition-colors shadow-sm"
                  >
                    Confirm Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
