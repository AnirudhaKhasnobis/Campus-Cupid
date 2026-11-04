import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Heart,
  Instagram,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DemoMatcherMatch,
  loadDemoMatcherState,
  recordDemoMatcherSwipe,
  resetDemoMatcherState
} from '../../lib/demoMatchmaking';
import { Gender, InterestedIn } from '../../types';

interface DemoMatcherFeedProps {
  onExitDemo: () => void;
}

export const DemoMatcherFeed: React.FC<DemoMatcherFeedProps> = ({ onExitDemo }) => {
  const { userProfile } = useAuth();
  const [matcherState, setMatcherState] = useState(loadDemoMatcherState);
  const [celebrationMatch, setCelebrationMatch] = useState<DemoMatcherMatch | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Directly linked to the student's profile preferences
  const userGender: Gender = userProfile?.gender || 'man';
  const userLookingFor: InterestedIn = userProfile?.interestedIn || 'woman';

  // Filter candidates strictly matching the bidirectional preferences from the student's profile
  const candidates = matcherState.candidates.filter((candidate) => {
    if (matcherState.swipedIds.includes(candidate.id)) return false;

    // Inbound: Does candidate match what current user wants to see?
    if (userLookingFor !== 'everyone' && candidate.gender !== userLookingFor) {
      return false;
    }

    // Outbound: Does current user match what candidate is looking for?
    if (candidate.interestedIn !== 'everyone' && candidate.interestedIn !== userGender) {
      return false;
    }

    return true;
  });

  const currentCandidate = candidates[0];

  const handleAction = (direction: 'like' | 'pass') => {
    if (!currentCandidate) return;
    const candidate = currentCandidate;
    setSwipeDirection(direction === 'like' ? 'right' : 'left');

    const { state: updatedState, isMatch, match } = recordDemoMatcherSwipe(candidate, direction);
    setMatcherState(updatedState);

    if (isMatch && match) {
      setCelebrationMatch(match);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF4D6D', '#FF758F', '#FFB3C1', '#FFF0F3'],
      });
    }

    setTimeout(() => {
      setSwipeDirection(null);
    }, 250);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleAction('like');
    } else if (info.offset.x < -100) {
      handleAction('pass');
    }
  };

  const handleReset = () => {
    const fresh = resetDemoMatcherState();
    setMatcherState(fresh);
    setCelebrationMatch(null);
  };

  return (
    <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-4 py-3 pb-24 h-full">
      {/* DEMO HEADER */}
      <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide uppercase">Matcher Demo Mode</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-white text-rose-700">
                Sandboxed
              </span>
            </div>
            <p className="text-[10px] text-white/90">Test personal dating swiping & mutual matches</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            title="Reset Matcher demo"
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onExitDemo}
            className="px-2.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {currentCandidate ? (
        <div className="flex-1 flex flex-col items-center justify-between min-h-[480px]">
          {/* Main Profile Card Container */}
          <div className="relative w-full aspect-[3/4.2] max-h-[500px] flex items-center justify-center">
            <AnimatePresence>
              <motion.div
                key={currentCandidate.id}
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
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-white border border-rose-100 flex flex-col cursor-grab active:cursor-grabbing select-none"
              >
                {/* Profile Photo */}
                <div className="relative flex-1 w-full overflow-hidden bg-rose-50">
                  <img
                    src={currentCandidate.profilePhotoURL}
                    alt={currentCandidate.displayName}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-rose-800 shadow-xs">
                        {currentCandidate.institute}
                      </span>
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-rose-500/90 backdrop-blur-md text-white shadow-xs">
                        {currentCandidate.gender === 'woman' ? '🙋‍♀️ Woman' : '🙋‍♂️ Man'}
                      </span>
                    </div>

                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white shadow-xs">
                      {currentCandidate.year}
                    </span>
                  </div>

                  {/* Profile Details at Bottom of Card */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-serif-display text-2xl font-bold tracking-tight drop-shadow-md">
                        {currentCandidate.displayName}
                      </h3>
                      <span className="text-xs font-semibold text-white/80">
                        @{currentCandidate.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-200 font-semibold">
                      <span>Looking for: {currentCandidate.interestedIn === 'woman' ? 'Women' : currentCandidate.interestedIn === 'man' ? 'Men' : 'Everyone'}</span>
                    </div>

                    <p className="text-xs text-white/90 font-medium mt-1 leading-relaxed drop-shadow-xs line-clamp-3">
                      {currentCandidate.bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Swipe Buttons */}
          <div className="w-full flex items-center justify-center gap-10 mt-5 mb-2">
            <button
              onClick={() => handleAction('pass')}
              className="w-16 h-16 rounded-full bg-white text-rose-400 border border-rose-100 shadow-xl shadow-rose-100/80 flex items-center justify-center hover:scale-105 active:scale-95 hover:text-rose-600 transition-all cursor-pointer"
            >
              <X className="w-7 h-7" />
            </button>

            <button
              onClick={() => handleAction('like')}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-2xl shadow-rose-300/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Heart className="w-7 h-7 fill-white" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4 shadow-xs">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-serif-display text-2xl font-bold text-rose-950 tracking-tight">
            YOU'VE SEEN EVERYONE!
          </h3>
          <p className="text-xs text-rose-800/70 mt-2 leading-relaxed">
            No more demo profiles match your profile's dating preference ({userLookingFor === 'woman' ? 'Women' : userLookingFor === 'man' ? 'Men' : 'Everyone'}). You can update your preferences anytime in your Profile tab.
          </p>
          <button
            onClick={handleReset}
            className="mt-6 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-200 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo Students</span>
          </button>
        </div>
      )}

      {/* MUTUAL MATCH CELEBRATION MODAL */}
      {celebrationMatch && (
        <div className="fixed inset-0 z-50 bg-rose-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2 animate-bounce">
              <Heart className="w-6 h-6 fill-rose-600" />
            </div>

            <h3 className="font-serif-display text-2xl font-bold text-rose-950">
              IT'S A MUTUAL MATCH!
            </h3>
            <p className="text-xs text-rose-800/70 mt-1 mb-5">
              You and {celebrationMatch.student.displayName} liked each other!
            </p>

            {/* Profile Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <img
                src={celebrationMatch.student.profilePhotoURL}
                alt={celebrationMatch.student.displayName}
                className="w-full h-full rounded-full object-cover border-4 border-rose-200 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                <Heart className="w-4 h-4 fill-white" />
              </div>
            </div>

            {/* Student Info & Revealed Instagram */}
            <h4 className="font-serif-display text-lg font-bold text-rose-950">
              {celebrationMatch.student.displayName}
            </h4>
            <p className="text-[11px] text-rose-800/60 font-semibold mb-3">
              {celebrationMatch.student.institute} • {celebrationMatch.student.year}
            </p>

            <div className="p-3 mb-5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] uppercase tracking-wider font-bold text-rose-700 block">
                  Instagram Revealed
                </span>
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1 mt-0.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  @{celebrationMatch.student.instagramUsername}
                </span>
              </div>
              <a
                href={`https://instagram.com/${celebrationMatch.student.instagramUsername}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors shadow-xs"
              >
                Open Instagram
              </a>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setCelebrationMatch(null)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
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
