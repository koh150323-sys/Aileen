import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { EconomicEvent } from '../types/market';

interface EconomicCalendarProps {
  events: EconomicEvent[];
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ events }) => {
  const [filterImpact, setFilterImpact] = useState<'all' | 'high'>('all');

  const filteredEvents = events.filter((e) => {
    if (filterImpact === 'high') return e.impact === 'high';
    return true;
  });

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39] mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#2a2e39] text-[#2962ff]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Economic Calendar</h3>
            <p className="text-[11px] text-[#787b86]">Key macroeconomic releases & central bank events</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#171b26] p-0.5 border border-[#2a2e39] rounded-lg text-[11px]">
          <button
            onClick={() => setFilterImpact('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterImpact === 'all'
                ? 'bg-[#2a2e39] text-white font-semibold'
                : 'text-[#787b86] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterImpact('high')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterImpact === 'high'
                ? 'bg-rose-500/20 text-rose-400 font-semibold'
                : 'text-[#787b86] hover:text-white'
            }`}
          >
            High Impact
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#2a2e39]/60 overflow-y-auto max-h-[380px]">
        {filteredEvents.map((evt) => (
          <div key={evt.id} className="py-2.5 px-1 hover:bg-[#2a2e39]/30 rounded transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{evt.flag}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate">{evt.event}</span>
                    {evt.impact === 'high' && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                        High
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#787b86]">
                    {evt.date} · {evt.time}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 font-mono text-[11px]">
                {evt.actual ? (
                  <div>
                    <span className="text-[#787b86] text-[10px] mr-1">Act:</span>
                    <strong className="text-white">{evt.actual}</strong>
                  </div>
                ) : (
                  <div>
                    <span className="text-[#787b86] text-[10px] mr-1">Frc:</span>
                    <span className="text-[#d1d4dc]">{evt.forecast}</span>
                  </div>
                )}
                <div className="text-[#787b86] text-[10px]">
                  Prev: <span className="tabular-nums">{evt.previous}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
