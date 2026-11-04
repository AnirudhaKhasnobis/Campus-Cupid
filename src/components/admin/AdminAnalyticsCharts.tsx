import { BarChart3, Calendar, CheckCircle2, Flame, Heart, PieChart, RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react';
import React, { useState } from 'react';
import { INSTITUTES } from '../../types';

interface AnalyticsData {
  totalUsers: number;
  filteredUsersCount: number;
  activeUsers: number;
  suspendedUsers: number;
  deletedUsers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  swipingUsersCount: number;
  instituteCounts: Record<string, number>;
  yearCounts: Record<string, number>;
  totalLikes: number;
  totalPasses: number;
  totalMatches: number;
  matchConversionRate: number;
  totalNominations: number;
  pendingNominations: number;
  approvedNominations: number;
  rejectedNominations: number;
  registeredNominations: number;
  unregisteredNominations: number;
  totalVotes: number;
  totalYesVotes: number;
  totalNoVotes: number;
  pendingReports: number;
  registrationGrowthSeries: { date: string; count: number }[];
  popularPairings: { pair: string; yesVotes: number; totalVotes: number; percentage: number }[];
}

interface AdminAnalyticsChartsProps {
  analytics: AnalyticsData;
  timeFilter: 'today' | '7days' | '30days' | '90days' | 'all';
  onTimeFilterChange: (filter: 'today' | '7days' | '30days' | '90days' | 'all') => void;
  onRefresh: () => void;
  loading: boolean;
}

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({
  analytics,
  timeFilter,
  onTimeFilterChange,
  onRefresh,
  loading,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; count: number } | null>(null);

  const maxGrowthCount = Math.max(...analytics.registrationGrowthSeries.map((d) => d.count), 5);
  const totalInstituteUsers = Object.values(analytics.instituteCounts).reduce((a, b) => a + b, 0) || 1;
  const totalYearUsers = (analytics.yearCounts['First Year'] || 0) + (analytics.yearCounts['Second Year'] || 0) || 1;

  // Institute Colors
  const instituteColors: Record<string, string> = {
    SIBM: '#FF4D6D',
    SIDTM: '#FF758F',
    SSBF: '#A53860',
    SIMC: '#DA627D',
    SSVAP: '#F28482',
    SSSS: '#84DCC6',
  };

  return (
    <div className="space-y-4">
      {/* Time Filters & Refresh Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-rose-100 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {(['today', '7days', '30days', '90days', 'all'] as const).map((key) => {
            const labels: Record<string, string> = {
              today: 'Today',
              '7days': 'Last 7 Days',
              '30days': 'Last 30 Days',
              '90days': 'Last 90 Days',
              all: 'All Time',
            };
            return (
              <button
                key={key}
                onClick={() => onTimeFilterChange(key)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  timeFilter === key
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-900/60 hover:text-rose-900 hover:bg-rose-50'
                }`}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Registration Growth Over Time (SVG Line Chart) */}
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                  User Registration Growth
                </h4>
              </div>
              <span className="text-[11px] font-bold text-rose-600">
                {analytics.registrationGrowthSeries.length} Active Days
              </span>
            </div>
            <p className="text-[11px] text-rose-800/60 mb-3">Daily newly registered university students</p>
          </div>

          {analytics.registrationGrowthSeries.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-rose-900/40">
              No registration data recorded yet
            </div>
          ) : (
            <div className="relative pt-4">
              <svg className="w-full h-36 overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="growthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF4D6D" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FF4D6D" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* SVG Filled Area */}
                <polygon
                  points={`0,100 ${analytics.registrationGrowthSeries
                    .map(
                      (d, idx) =>
                        `${(idx / (analytics.registrationGrowthSeries.length - 1 || 1)) * 300},${
                          100 - (d.count / maxGrowthCount) * 85
                        }`
                    )
                    .join(' ')} 300,100`}
                  fill="url(#growthGradient)"
                />

                {/* SVG Stroke Line */}
                <polyline
                  fill="none"
                  stroke="#FF4D6D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={analytics.registrationGrowthSeries
                    .map(
                      (d, idx) =>
                        `${(idx / (analytics.registrationGrowthSeries.length - 1 || 1)) * 300},${
                          100 - (d.count / maxGrowthCount) * 85
                        }`
                    )
                    .join(' ')}
                />

                {/* Interactive Points */}
                {analytics.registrationGrowthSeries.map((d, idx) => {
                  const x = (idx / (analytics.registrationGrowthSeries.length - 1 || 1)) * 300;
                  const y = 100 - (d.count / maxGrowthCount) * 85;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-rose-500 hover:fill-rose-700 stroke-2 stroke-white cursor-pointer transition-all hover:scale-150"
                      onMouseEnter={() => setHoveredPoint(d)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </svg>

              {/* Hover Tooltip */}
              {hoveredPoint && (
                <div className="absolute top-0 right-2 bg-rose-950 text-white text-[10px] px-2.5 py-1 rounded-lg font-mono shadow-md">
                  {hoveredPoint.date}: {hoveredPoint.count} students
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Likes vs Passes Comparison (Bar Chart) */}
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-pink-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Likes vs Passes
              </h4>
            </div>
            <span className="text-[11px] font-bold text-rose-700">
              Total Swipes: {analytics.totalLikes + analytics.totalPasses}
            </span>
          </div>

          <div className="space-y-4 my-auto pt-2">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <Flame className="w-3.5 h-3.5" /> Likes ({analytics.totalLikes})
                </span>
                <span>
                  {Math.round(
                    (analytics.totalLikes / (analytics.totalLikes + analytics.totalPasses || 1)) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-rose-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(analytics.totalLikes / (analytics.totalLikes + analytics.totalPasses || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span>❌</span> Passes ({analytics.totalPasses})
                </span>
                <span>
                  {Math.round(
                    (analytics.totalPasses / (analytics.totalLikes + analytics.totalPasses || 1)) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${(analytics.totalPasses / (analytics.totalLikes + analytics.totalPasses || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-rose-50 flex items-center justify-between text-xs">
              <span className="text-rose-900/60 font-semibold">Mutual Matches Formed</span>
              <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-emerald-600" />
                {analytics.totalMatches} matches ({analytics.matchConversionRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* 3. Institute Distribution Breakdown */}
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Institute Share (6 Institutes)
              </h4>
            </div>
            <span className="text-[11px] font-bold text-rose-900/60">
              {analytics.totalUsers} Students
            </span>
          </div>

          <div className="space-y-2">
            {INSTITUTES.map((inst) => {
              const count = analytics.instituteCounts[inst] || 0;
              const pct = Math.round((count / totalInstituteUsers) * 100);
              const color = instituteColors[inst] || '#FF4D6D';

              return (
                <div key={inst}>
                  <div className="flex items-center justify-between text-[11px] font-bold mb-0.5">
                    <span className="flex items-center gap-1.5 text-rose-950">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {inst}
                    </span>
                    <span className="text-rose-900/60">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-rose-50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Community Voting Distribution (YES vs NO) */}
        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Community Voting Ratio
              </h4>
            </div>
            <span className="text-[11px] font-bold text-rose-900/60">
              {analytics.totalVotes} Total Votes
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-800">YES Votes</span>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{analytics.totalYesVotes}</p>
                <span className="text-[10px] text-emerald-600/80 font-semibold">
                  {Math.round((analytics.totalYesVotes / (analytics.totalVotes || 1)) * 100)}% positive
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-800">NO Votes</span>
                <p className="text-xl font-black text-rose-700 mt-0.5">{analytics.totalNoVotes}</p>
                <span className="text-[10px] text-rose-600/80 font-semibold">
                  {Math.round((analytics.totalNoVotes / (analytics.totalVotes || 1)) * 100)}% negative
                </span>
              </div>
            </div>

            {/* Top 3 Popular Pairings Preview */}
            <div className="pt-2 border-t border-rose-50">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-900/60 block mb-2">
                Top Voted Pairings
              </span>
              {analytics.popularPairings.length === 0 ? (
                <p className="text-[11px] text-rose-900/40">No pairing votes recorded yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {analytics.popularPairings.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-950 truncate max-w-[180px]">{p.pair}</span>
                      <span className="text-rose-600 font-extrabold shrink-0">
                        {p.yesVotes} YES ({p.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
