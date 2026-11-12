import React, { useState } from 'react';
import { Newspaper, ExternalLink, ArrowUpRight } from 'lucide-react';
import { MarketNews } from '../types/market';

interface MarketNewsFeedProps {
  news: MarketNews[];
  onSelectCategory?: (category: string) => void;
}

export const MarketNewsFeed: React.FC<MarketNewsFeedProps> = ({ news }) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const tags = ['All', 'Stocks', 'Crypto', 'Bonds', 'Forex', 'Commodities'];

  const filteredNews = news.filter((item) => {
    if (selectedTag === 'All') return true;
    return item.category.toLowerCase() === selectedTag.toLowerCase();
  });

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39] mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#2a2e39] text-[#2962ff]">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Market News & Analysis</h3>
            <p className="text-[11px] text-[#787b86]">Real-time financial journalism & market color</p>
          </div>
        </div>

        {/* Category tags */}
        <div className="hidden sm:flex items-center gap-1 bg-[#171b26] p-0.5 border border-[#2a2e39] rounded-lg text-[11px]">
          {tags.slice(0, 4).map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedTag === tag
                  ? 'bg-[#2a2e39] text-white font-semibold'
                  : 'text-[#787b86] hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#2a2e39]/60 overflow-y-auto max-h-[380px] space-y-1">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className="py-3 px-1 hover:bg-[#2a2e39]/30 rounded transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-[11px] text-[#787b86] mb-1">
              <span className="font-semibold text-white/90">{item.source}</span>
              <span>·</span>
              <span className="text-[#2962ff]">{item.category}</span>
              <span>·</span>
              <span>{item.timeAgo}</span>
              <span>·</span>
              <span>{item.readTime} read</span>
            </div>

            <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#2962ff] transition-colors leading-snug">
              {item.title}
            </h4>

            <p className="text-xs text-[#9598a1] line-clamp-2 mt-1 leading-relaxed">
              {item.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
