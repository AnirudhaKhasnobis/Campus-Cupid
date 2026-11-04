import { AlertCircle, Award, Calendar, Heart, Info, Medal, Sparkles, Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getSystemSettings, getTopMatches } from '../../lib/database';
import { Nomination, SystemSetting } from '../../types';

export const TopMatchesView: React.FC = () => {
  const [matches, setMatches] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'yesVotes' | 'percentage' | 'totalVotes'>('yesVotes');
  const [timeframe, setTimeframe] = useState<'allTime' | 'weekly'>('allTime');
  const [systemSettings, setSystemSettings] = useState<SystemSetting | null>(null);

  useEffect(() => {
    getSystemSettings().then(setSystemSettings);
  }, []);

  useEffect(() => {
    const fetchTop = async () => {
      setLoading(true);
      try {
        const threshold = systemSettings?.minVotingThreshold ?? 3;
        const data = await getTopMatches(sortBy, timeframe, threshold);
        setMatches(data);
      } catch (err) {
        console.error('Failed to load top matches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, [sortBy, timeframe, systemSettings]);

  const top3 = matches.slice(0, 3);

  // Check if disabled by Admin
  if (systemSettings && systemSettings.enableTopMatches === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif-display text-xl font-bold text-rose-950">Leaderboard Paused</h3>
        <p className="text-xs text-rose-800/70 max-w-xs mt-1 leading-relaxed">
          The campus leaderboard is currently being refreshed by administrators. Please check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-1 border border-amber-200/50">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Campus Leaderboard</span>
        </div>
        <h2 className="font-serif-display text-2xl font-bold text-rose-950">Top Matches</h2>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-3 mb-4 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-rose-900/70 leading-relaxed font-medium">
          These rankings reflect community votes, not confirmed romantic relationships.
        </p>
      </div>

      {/* Timeframe Filter (All-Time vs Weekly) */}
      <div className="flex bg-white p-1 rounded-2xl mb-3 border border-rose-100 shadow-xs">
        <button
          onClick={() => setTimeframe('allTime')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            timeframe === 'allTime' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-900/60'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>All-Time Rankings</span>
        </button>
        <button
          onClick={() => setTimeframe('weekly')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            timeframe === 'weekly' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-900/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Weekly Top</span>
        </button>
      </div>

      {/* Sorting Tabs */}
      <div className="flex bg-rose-100/60 p-1 rounded-2xl mb-5 border border-rose-200/50">
        <button
          onClick={() => setSortBy('yesVotes')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
            sortBy === 'yesVotes' ? 'bg-white text-rose-800 shadow-xs' : 'text-rose-900/60'
          }`}
        >
          Most YES Votes
        </button>
        <button
          onClick={() => setSortBy('percentage')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
            sortBy === 'percentage' ? 'bg-white text-rose-800 shadow-xs' : 'text-rose-900/60'
          }`}
        >
          Highest % Approval
        </button>
        <button
          onClick={() => setSortBy('totalVotes')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
            sortBy === 'totalVotes' ? 'bg-white text-rose-800 shadow-xs' : 'text-rose-900/60'
          }`}
        >
          Total Votes
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-rose-900/50">Loading leaderboard...</div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-rose-100">
          <Trophy className="w-8 h-8 text-rose-300 mx-auto mb-2" />
          <h4 className="font-serif-display text-base font-bold text-rose-950">No Voted Pairings Yet</h4>
          <p className="text-xs text-rose-800/60 mt-1 max-w-xs mx-auto">
            Head over to Matchmaking to nominate couples and cast your votes!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TOP 3 PODIUM */}
          {top3.length > 0 && (
            <div className="bg-gradient-to-b from-white to-rose-50/40 rounded-3xl p-4 border border-rose-100 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-800/80 mb-3 text-center">
                Top 3 Community Favorites
              </h3>

              <div className="grid grid-cols-3 gap-2 items-end pt-2">
                {/* 2nd Place */}
                {top3[1] ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <div className="flex -space-x-3">
                        <img
                          src={top3[1].personAPhotoURL}
                          alt={top3[1].personAName}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                        <img
                          src={top3[1].personBPhotoURL}
                          alt={top3[1].personBName}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-800 text-[10px] font-black flex items-center justify-center border border-white">
                        2
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-rose-950 truncate max-w-[90px]">
                      @{top3[1].personAName} & @{top3[1].personBName}
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold mt-0.5">{top3[1].yesVotes} YES</span>
                    <div className="w-full h-12 bg-slate-200/80 rounded-t-xl mt-2 flex items-center justify-center text-slate-700 font-black text-xs">
                      2nd
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* 1st Place (Center & Taller) */}
                {top3[0] && (
                  <div className="flex flex-col items-center text-center -mt-3">
                    <div className="relative mb-2">
                      <div className="flex -space-x-3">
                        <img
                          src={top3[0].personAPhotoURL}
                          alt={top3[0].personAName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-md"
                        />
                        <img
                          src={top3[0].personBPhotoURL}
                          alt={top3[0].personBName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-md"
                        />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs font-black flex items-center justify-center border-2 border-white shadow-xs">
                        👑
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-950 truncate max-w-[100px]">
                      @{top3[0].personAName} & @{top3[0].personBName}
                    </span>
                    <span className="text-[11px] text-amber-600 font-extrabold mt-0.5">
                      {top3[0].yesVotes} YES ({top3[0].yesPercentage}%)
                    </span>
                    <div className="w-full h-16 bg-gradient-to-t from-amber-300 to-amber-200 rounded-t-xl mt-2 flex items-center justify-center text-amber-900 font-black text-sm shadow-xs">
                      1st
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3[2] ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <div className="flex -space-x-3">
                        <img
                          src={top3[2].personAPhotoURL}
                          alt={top3[2].personAName}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                        <img
                          src={top3[2].personBPhotoURL}
                          alt={top3[2].personBName}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-black flex items-center justify-center border border-white">
                        3
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-rose-950 truncate max-w-[90px]">
                      @{top3[2].personAName} & @{top3[2].personBName}
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold mt-0.5">{top3[2].yesVotes} YES</span>
                    <div className="w-full h-8 bg-amber-100 rounded-t-xl mt-2 flex items-center justify-center text-amber-800 font-black text-xs">
                      3rd
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </div>
          )}

          {/* ALL RANKINGS LIST */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900/60 px-1">
              Complete Leaderboard ({matches.length})
            </h3>

            {matches.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3 border border-rose-100 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 text-center font-black text-xs ${
                      index === 0
                        ? 'text-amber-500 text-sm'
                        : index === 1
                        ? 'text-slate-400 text-sm'
                        : index === 2
                        ? 'text-amber-700 text-sm'
                        : 'text-rose-900/40'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <div className="flex -space-x-2 shrink-0">
                    <img
                      src={item.personAPhotoURL}
                      alt={item.personAName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <img
                      src={item.personBPhotoURL}
                      alt={item.personBName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-rose-950 truncate">
                      @{item.personAName} & @{item.personBName}
                    </p>
                    <p className="text-[10px] text-rose-800/70 truncate">
                      {item.personAInstitute} • {item.personBInstitute}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-rose-600 block">
                    {item.yesVotes} YES
                  </span>
                  <span className="text-[10px] text-rose-900/50 block font-medium">
                    {item.yesPercentage}% approval ({item.totalVotes} votes)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
