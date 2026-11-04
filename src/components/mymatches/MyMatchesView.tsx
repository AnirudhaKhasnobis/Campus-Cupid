import { AlertTriangle, ExternalLink, Heart, Instagram, Sparkles, UserX } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMutualMatches, submitReport, unmatchUser } from '../../lib/database';
import { DatingMatch } from '../../types';

export const MyMatchesView: React.FC = () => {
  const { userProfile } = useAuth();
  const [matches, setMatches] = useState<DatingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMatchId, setActionMatchId] = useState<string | null>(null);
  const [reportingMatch, setReportingMatch] = useState<DatingMatch | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate behavior');

  const loadMatches = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const data = await getMutualMatches(userProfile.uid);
      setMatches(data);
    } catch (err) {
      console.error('Failed to load mutual matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [userProfile?.uid]);

  const handleUnmatch = async (matchId: string) => {
    try {
      await unmatchUser(matchId);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setActionMatchId(null);
    } catch (err) {
      console.error('Error unmatching:', err);
    }
  };

  const handleReport = async () => {
    if (!userProfile || !reportingMatch) return;
    const otherUid = reportingMatch.userA === userProfile.uid ? reportingMatch.userB : reportingMatch.userA;
    try {
      await submitReport(userProfile.uid, otherUid, 'profile', reportingMatch.id, reportReason);
      await unmatchUser(reportingMatch.id);
      setMatches((prev) => prev.filter((m) => m.id !== reportingMatch.id));
      setReportingMatch(null);
    } catch (err) {
      console.error('Error reporting match:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-1 border border-rose-200/50">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>Mutual Dating Matches</span>
        </div>
        <h2 className="font-serif-display text-2xl font-bold text-rose-950">My Matches</h2>
        <p className="text-xs text-rose-800/60 mt-0.5">
          You and these classmates liked each other on Matcher.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-rose-900/50">Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <Heart className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-serif-display text-lg font-bold text-rose-950">No Mutual Matches Yet</h3>
          <p className="text-xs text-rose-800/70 max-w-xs mx-auto mt-1 leading-relaxed">
            Keep swiping on Matcher! When someone you liked swipes right on you, they'll show up here with their Instagram handle.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const isUserA = m.userA === userProfile?.uid;
            const otherName = isUserA ? m.userBUsername : m.userAUsername;
            const otherPhoto = isUserA ? m.userBPhotoURL : m.userAPhotoURL;
            const otherInst = isUserA ? m.userBInstitute : m.userAInstitute;
            const otherYear = isUserA ? m.userBYear : m.userAYear;
            const otherIg = isUserA ? m.userBInstagram : m.userAInstagram;
            const matchDate = new Date(m.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-4 border border-rose-100 shadow-xs space-y-3 hover:border-rose-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={otherPhoto}
                    alt={otherName}
                    className="w-14 h-14 rounded-2xl object-cover border border-rose-100 shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-rose-950 truncate">@{otherName}</span>
                      <span className="text-[10px] text-rose-900/40 font-medium">Matched {matchDate}</span>
                    </div>
                    <span className="text-xs text-rose-800/70 font-semibold mt-0.5 block">
                      {otherInst} • {otherYear}
                    </span>
                  </div>
                </div>

                {/* Open Instagram Action */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://www.instagram.com/${otherIg}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Open @{otherIg}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                  </a>

                  <button
                    onClick={() => setActionMatchId(actionMatchId === m.id ? null : m.id)}
                    className="p-2.5 rounded-xl border border-rose-200 text-rose-700/80 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    Options
                  </button>
                </div>

                {/* Unmatch & Report Action Dropdown */}
                {actionMatchId === m.id && (
                  <div className="pt-2 border-t border-rose-50 flex items-center justify-end gap-3 text-xs">
                    <button
                      onClick={() => setReportingMatch(m)}
                      className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                    <button
                      onClick={() => handleUnmatch(m.id)}
                      className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Unmatch</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* REPORT MODAL */}
      {reportingMatch && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-serif-display text-lg font-bold text-rose-950">Report Student</h3>
            <p className="text-xs text-rose-800/70 mt-1 mb-4">
              Your report will be privately reviewed by campus administrators.
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 font-medium mb-4"
            >
              <option value="Fake or impersonating profile">Fake or impersonating profile</option>
              <option value="Inappropriate photograph">Inappropriate photograph</option>
              <option value="Harassment or offensive behavior">Harassment or offensive behavior</option>
              <option value="Not a university student">Not a university student</option>
              <option value="Other misconduct">Other misconduct</option>
            </select>

            <div className="space-y-2">
              <button
                onClick={handleReport}
                className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 cursor-pointer"
              >
                Submit Report & Unmatch
              </button>
              <button
                onClick={() => setReportingMatch(null)}
                className="w-full py-2 text-xs font-semibold text-rose-900/60 hover:text-rose-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
