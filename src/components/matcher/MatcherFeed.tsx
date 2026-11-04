import confetti from 'canvas-confetti';
import { AlertCircle, Heart, Instagram, RefreshCw, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDiscoveryProfiles, getSystemSettings, recordSwipe } from '../../lib/database';
import { DatingMatch, SystemSetting, UserProfile } from '../../types';
import { DemoMatcherFeed } from './DemoMatcherFeed';

interface MatcherFeedProps {
  onMatchCreated?: () => void;
}

export const MatcherFeed: React.FC<MatcherFeedProps> = ({ onMatchCreated }) => {
  const { userProfile } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationMatch, setCelebrationMatch] = useState<DatingMatch | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSetting | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const loadFeed = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const [candidates, settings] = await Promise.all([
        getDiscoveryProfiles(userProfile, 20),
        getSystemSettings(),
      ]);
      setProfiles(candidates);
      setSystemSettings(settings);
    } catch (err) {
      console.error('Failed to load discovery profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [userProfile?.uid]);

  const currentCandidate = profiles[0];

  const handleAction = async (direction: 'like' | 'pass') => {
    if (!userProfile || !currentCandidate) return;

    const candidate = currentCandidate;
    setProfiles((prev) => prev.slice(1));

    try {
      const res = await recordSwipe(userProfile, candidate, direction);
      if (res.isMatch && res.match) {
        setCelebrationMatch(res.match);
        if (onMatchCreated) onMatchCreated();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF4D6D', '#FF758F', '#FFB3C1', '#FFF0F3'],
        });
      }
    } catch (err) {
      console.error('Error during swipe action:', err);
    }
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleAction('like');
    } else if (info.offset.x < -100) {
      handleAction('pass');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-3xl bg-rose-100 flex items-center justify-center animate-bounce mb-3">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
        </div>
        <p className="text-sm font-semibold text-rose-950">Finding campus classmates...</p>
        <p className="text-xs text-rose-800/60 mt-1">Checking for new students across 6 institutes</p>
      </div>
    );
  }

  // Feature Disabled by Admin
  if (systemSettings && systemSettings.enableMatcher === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif-display text-xl font-bold text-rose-950">Matcher Temporarily Paused</h3>
        <p className="text-xs text-rose-800/70 max-w-xs mt-1 leading-relaxed">
          The campus discovery feed is undergoing scheduled maintenance by administrators. Please check back shortly!
        </p>
      </div>
    );
  }

  // Active Demo Mode
  if (isDemoMode) {
    return <DemoMatcherFeed onExitDemo={() => setIsDemoMode(false)} />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between max-w-md w-full mx-auto px-4 py-3 pb-24">
      {/* Try Demo Banner */}
      <div className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 border border-amber-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-rose-950 truncate">Matcher Demo Mode</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 shrink-0">
                Sandboxed
              </span>
            </div>
            <p className="text-[11px] text-rose-900/70 truncate">
              Test personal dating swiping & mutual match celebration
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDemoMode(true)}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          Try Demo
        </button>
      </div>

      {/* Cards Deck */}
      <div className="relative w-full aspect-[3/4.2] max-h-[580px] flex items-center justify-center">
        <AnimatePresence>
          {currentCandidate ? (
            <motion.div
              key={currentCandidate.uid}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.02 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                x: swipeDirection === 'right' ? 300 : swipeDirection === 'left' ? -300 : 0,
                opacity: 0,
                transition: { duration: 0.25 },
              }}
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl bg-white border border-rose-100/90 flex flex-col cursor-grab active:cursor-grabbing select-none"
            >
              {/* Photo Area */}
              <div className="relative flex-1 w-full bg-rose-50 overflow-hidden">
                <img
                  src={currentCandidate.profilePhotoURL}
                  alt={currentCandidate.username}
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* Subtle gradient vignette at bottom of image */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Institute & Year Badges (Overlay on top of photo) */}
                <div className="absolute top-4 left-4 flex gap-1.5">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-white/90 text-rose-950 backdrop-blur-md shadow-xs">
                    {currentCandidate.institute}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-md">
                    {currentCandidate.year}
                  </span>
                </div>

                {/* Profile Details at bottom of photo card */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-serif-display text-2xl font-bold tracking-tight drop-shadow-xs">
                      @{currentCandidate.username}
                    </h3>
                  </div>
                  <p className="text-xs text-white/90 mt-1 line-clamp-3 leading-relaxed drop-shadow-xs font-medium">
                    {currentCandidate.bio}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Empty State: Exactly matching prompt specification */
            <div className="w-full h-full rounded-3xl bg-white/80 border border-dashed border-rose-200 flex flex-col items-center justify-center p-8 text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-rose-950 tracking-tight">
                YOU'VE SEEN EVERYONE!
              </h3>
              <p className="text-xs text-rose-800/70 max-w-xs mt-1.5 leading-relaxed">
                Looks like you've caught up with the campus. Check back when someone new joins.
              </p>
              <button
                onClick={loadFeed}
                className="mt-5 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-rose-300 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check for New Students</span>
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Buttons */}
      {currentCandidate && (
        <div className="w-full flex items-center justify-center gap-8 mt-5">
          {/* Pass button */}
          <button
            onClick={() => {
              setSwipeDirection('left');
              handleAction('pass');
            }}
            aria-label="Pass"
            className="w-16 h-16 rounded-full bg-white text-rose-400 border border-rose-100 shadow-lg shadow-rose-100/80 flex items-center justify-center hover:scale-105 active:scale-95 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
          >
            <X className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* Like button */}
          <button
            onClick={() => {
              setSwipeDirection('right');
              handleAction('like');
            }}
            aria-label="Like"
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-300/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Heart className="w-8 h-8 fill-white stroke-white" />
          </button>
        </div>
      )}

      {/* Celebratory Mutual Match Modal */}
      {celebrationMatch && (
        <div className="fixed inset-0 z-50 bg-rose-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6" />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
              Mutual Dating Match
            </span>

            <h3 className="font-serif-display text-3xl font-bold text-rose-950 mt-2">
              It's a Match!
            </h3>

            <p className="text-xs text-rose-800/70 mt-1">
              You and <strong>@{celebrationMatch.userA === userProfile?.uid ? celebrationMatch.userBUsername : celebrationMatch.userAUsername}</strong> liked each other!
            </p>

            {/* Overlapping Couple Avatars */}
            <div className="flex items-center justify-center -space-x-4 my-5">
              <img
                src={celebrationMatch.userAPhotoURL}
                alt="Match 1"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
              <img
                src={celebrationMatch.userBPhotoURL}
                alt="Match 2"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>

            {/* Open Instagram Action */}
            <div className="space-y-2">
              <a
                href={`https://www.instagram.com/${
                  celebrationMatch.userA === userProfile?.uid
                    ? celebrationMatch.userBInstagram
                    : celebrationMatch.userAInstagram
                }/`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white text-sm font-bold shadow-md shadow-pink-200 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Instagram className="w-4 h-4" />
                <span>Open Instagram (@{celebrationMatch.userA === userProfile?.uid ? celebrationMatch.userBInstagram : celebrationMatch.userAInstagram})</span>
              </a>

              <button
                onClick={() => setCelebrationMatch(null)}
                className="w-full py-2.5 text-xs font-semibold text-rose-700/80 hover:text-rose-900 transition-colors cursor-pointer"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
