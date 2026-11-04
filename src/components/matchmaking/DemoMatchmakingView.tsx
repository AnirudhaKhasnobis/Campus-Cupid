import confetti from 'canvas-confetti';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Heart,
  RotateCcw,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import React, { useState } from 'react';
import {
  castDemoVote,
  createDemoNomination,
  DemoNomination,
  DemoStudent,
  loadDemoState,
  resetDemoState
} from '../../lib/demoMatchmaking';

interface DemoMatchmakingViewProps {
  onExitDemo: () => void;
}

export const DemoMatchmakingView: React.FC<DemoMatchmakingViewProps> = ({ onExitDemo }) => {
  const [demoState, setDemoState] = useState(loadDemoState);
  const [activeSubTab, setActiveSubTab] = useState<'VOTE_ON_PAIRS' | 'PLAY_CUPID' | 'TOP_MATCHES'>('VOTE_ON_PAIRS');

  // Play Cupid Workflow State
  const [search, setSearch] = useState('');
  const [selectedFirstPerson, setSelectedFirstPerson] = useState<DemoStudent | null>(null);
  const [selectedSecondPerson, setSelectedSecondPerson] = useState<DemoStudent | null>(null);
  const [previewingProfile, setPreviewingProfile] = useState<DemoStudent | null>(null);

  const [nominationStatus, setNominationStatus] = useState<{
    submitting: boolean;
    error: string | null;
    success: boolean;
  }>({
    submitting: false,
    error: null,
    success: false,
  });

  // Voting State
  const [votingDirection, setVotingDirection] = useState<'left' | 'right' | null>(null);
  const [votingFeedback, setVotingFeedback] = useState<string | null>(null);

  // Filtered Students for Play Cupid Directory
  const filteredStudents = demoState.students.filter((student) => {
    if (selectedFirstPerson && student.id === selectedFirstPerson.id) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      student.displayName.toLowerCase().includes(term) ||
      student.institute.toLowerCase().includes(term) ||
      student.bio.toLowerCase().includes(term)
    );
  });

  // Public pairings algorithmically served in Vote on Pairs (not searchable)
  const votablePairings = demoState.nominations.filter((n) => n.publiclyVotable);
  const currentPairing = votablePairings.find((n) => !demoState.userVotes[n.id]);

  // Top Matches Leaderboard
  const sortedLeaderboard = [...demoState.nominations].sort((a, b) => {
    if (b.yesVotes !== a.yesVotes) return b.yesVotes - a.yesVotes;
    return b.yesPercentage - a.yesPercentage;
  });

  // Handle Nomination Confirmation
  const handleConfirmNomination = () => {
    if (!selectedFirstPerson || !selectedSecondPerson) return;
    setNominationStatus({ submitting: true, error: null, success: false });

    try {
      const res = createDemoNomination(selectedFirstPerson, selectedSecondPerson);
      setDemoState(res.state);
      setNominationStatus({
        submitting: false,
        error: null,
        success: true,
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EC4899', '#3B82F6'],
      });

      setTimeout(() => {
        setSelectedFirstPerson(null);
        setSelectedSecondPerson(null);
        setNominationStatus({ submitting: false, error: null, success: false });
        // Automatically switch back to Vote on Pairs where the new pair is immediately visible
        setActiveSubTab('VOTE_ON_PAIRS');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error nominating pair';
      setNominationStatus({ submitting: false, error: msg, success: false });
    }
  };

  // Handle Voting
  const handleVote = (voteValue: 'YES' | 'NO') => {
    if (!currentPairing) return;
    try {
      setVotingDirection(voteValue === 'YES' ? 'right' : 'left');
      const res = castDemoVote(currentPairing.id, voteValue);
      setDemoState(res.state);
      setVotingFeedback(voteValue === 'YES' ? '💖 Demo Vote: YES' : '❌ Demo Vote: NO');

      if (voteValue === 'YES') {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#FF4D6D', '#FF758F'],
        });
      }

      setTimeout(() => {
        setVotingFeedback(null);
        setVotingDirection(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error voting in demo';
      setVotingFeedback(msg);
      setTimeout(() => setVotingFeedback(null), 2500);
    }
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleVote('YES');
    } else if (info.offset.x < -100) {
      handleVote('NO');
    }
  };

  // Reset Demo State
  const handleResetDemo = () => {
    const reset = resetDemoState();
    setDemoState(reset);
    setSelectedFirstPerson(null);
    setSelectedSecondPerson(null);
    setPreviewingProfile(null);
    setVotingFeedback('Demo reset to original state!');
    setTimeout(() => setVotingFeedback(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-4 py-3 pb-24">
      {/* DEMO HEADER BANNER */}
      <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide uppercase">Matchmaking Demo Mode</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-white text-rose-700">
                Sandboxed
              </span>
            </div>
            <p className="text-[10px] text-white/90">Fictional profiles • Isolated client storage</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetDemo}
            title="Reset Demo data"
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

      {/* DEMO SUB-TABS (VOTE ON PAIRS DEFAULT - NO CONSENT TAB) */}
      <div className="grid grid-cols-3 bg-rose-100/70 p-1 rounded-2xl mb-4 border border-rose-200/60 shadow-xs text-center">
        <button
          onClick={() => setActiveSubTab('VOTE_ON_PAIRS')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'VOTE_ON_PAIRS'
              ? 'bg-white text-rose-800 shadow-sm'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          Vote Pairs
        </button>

        <button
          onClick={() => setActiveSubTab('PLAY_CUPID')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'PLAY_CUPID'
              ? 'bg-white text-rose-800 shadow-sm'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          Play Cupid
        </button>

        <button
          onClick={() => setActiveSubTab('TOP_MATCHES')}
          className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'TOP_MATCHES'
              ? 'bg-white text-rose-800 shadow-sm'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          Top Ranks
        </button>
      </div>

      {/* Floating step indicator when Step 1 is chosen in Play Cupid */}
      {selectedFirstPerson && !selectedSecondPerson && activeSubTab === 'PLAY_CUPID' && (
        <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-2xl p-3 mb-3 shadow-md flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <img
              src={selectedFirstPerson.profilePhotoURL}
              alt={selectedFirstPerson.displayName}
              className="w-9 h-9 rounded-full object-cover border-2 border-white"
            />
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-100">Step 2: Choose Partner For</p>
              <p className="text-xs font-black">
                {selectedFirstPerson.displayName} ({selectedFirstPerson.institute})
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFirstPerson(null)}
            className="text-xs bg-black/20 hover:bg-black/30 px-2 py-1 rounded-lg text-white font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* TAB 1: VOTE ON PAIRS (DEFAULT - ALGORITHMIC CARD FEED, NOT SEARCHABLE) */}
      {activeSubTab === 'VOTE_ON_PAIRS' && (
        <div className="flex-1 flex flex-col items-center justify-between w-full">
          {votingFeedback && (
            <div className="w-full mb-3 p-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold text-center animate-in fade-in shadow-xs">
              {votingFeedback}
            </div>
          )}

          {currentPairing ? (
            <div className="w-full flex flex-col items-center">
              {/* Couple Card */}
              <div className="relative w-full aspect-[3/4] max-h-[490px] flex items-center justify-center">
                <AnimatePresence>
                  <motion.div
                    key={currentPairing.id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.02 }}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{
                      x: votingDirection === 'right' ? 300 : votingDirection === 'left' ? -300 : 0,
                      opacity: 0,
                      transition: { duration: 0.25 },
                    }}
                    className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl bg-white border border-rose-100 flex flex-col cursor-grab active:cursor-grabbing select-none"
                  >
                    {/* Top Side-by-Side Photos */}
                    <div className="relative flex-1 w-full grid grid-cols-2 bg-rose-50">
                      {/* Person A */}
                      <div className="relative h-full overflow-hidden border-r border-white/50">
                        <img
                          src={currentPairing.personAPhotoURL}
                          alt={currentPairing.personAName}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-2 text-white">
                          <p className="text-xs font-black truncate drop-shadow-xs">{currentPairing.personAName}</p>
                          <p className="text-[10px] text-white/80 font-medium">
                            {currentPairing.personAInstitute} • {currentPairing.personAYear}
                          </p>
                        </div>
                      </div>

                      {/* Heart Badge */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                        <Heart className="w-5 h-5 fill-white" />
                      </div>

                      {/* Person B */}
                      <div className="relative h-full overflow-hidden">
                        <img
                          src={currentPairing.personBPhotoURL}
                          alt={currentPairing.personBName}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-2 right-3 text-white">
                          <p className="text-xs font-black truncate drop-shadow-xs">{currentPairing.personBName}</p>
                          <p className="text-[10px] text-white/80 font-medium">
                            {currentPairing.personBInstitute} • {currentPairing.personBYear}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Question & Stats */}
                    <div className="p-4 bg-white text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Algorithmic Pairing
                        </span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Demo Pair
                        </span>
                      </div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-rose-500">
                        DO THEY MAKE A GOOD MATCH?
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-900/60 mt-2 px-1">
                        <span>Approval: {currentPairing.yesPercentage}% YES</span>
                        <span>{currentPairing.totalVotes} total votes</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-rose-100 overflow-hidden mt-1 flex">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${currentPairing.yesPercentage}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Voting buttons */}
              <div className="w-full flex items-center justify-center gap-8 mt-4">
                <button
                  onClick={() => handleVote('NO')}
                  className="w-14 h-14 rounded-full bg-white text-rose-400 border border-rose-100 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 hover:text-rose-600 transition-all cursor-pointer"
                >
                  <ThumbsDown className="w-6 h-6" />
                </button>

                <button
                  onClick={() => handleVote('YES')}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-300/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <ThumbsUp className="w-6 h-6" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full py-12 rounded-3xl bg-white border border-dashed border-rose-200 flex flex-col items-center justify-center p-6 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif-display text-lg font-bold text-rose-950">
                You've Voted On All Available Demo Pairs!
              </h3>
              <p className="text-xs text-rose-800/70 max-w-xs mt-1 leading-relaxed">
                Nominate two fictional students in <b>Play Cupid</b> to immediately add a new couple card to this voting feed.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setActiveSubTab('PLAY_CUPID')}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all cursor-pointer"
                >
                  Go to Play Cupid
                </button>
                <button
                  onClick={handleResetDemo}
                  className="px-3.5 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200 transition-all cursor-pointer"
                >
                  Reset Demo Votes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAY CUPID (SEARCH & NOMINATE FICTIONAL STUDENTS) */}
      {activeSubTab === 'PLAY_CUPID' && (
        <div className="space-y-3">
          {/* Informational Header */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Demo Student Directory (5 Fictional Profiles)
            </p>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              Select student 1, click <b>MATCH WITH</b>, then pick student 2 to confirm your couple nomination.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-rose-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Alex, Sam, Taylor, Jordan, Casey..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-rose-100 text-xs text-rose-950 placeholder-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-xs"
            />
          </div>

          {/* Student List */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl p-3 border border-rose-100 shadow-xs flex items-center justify-between gap-3 hover:border-rose-200 transition-all"
              >
                <div
                  onClick={() => setPreviewingProfile(student)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <img
                    src={student.profilePhotoURL}
                    alt={student.displayName}
                    className="w-12 h-12 rounded-xl object-cover border border-rose-100 shrink-0 shadow-xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-rose-950 truncate">{student.displayName}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700">
                        {student.institute}
                      </span>
                      <span className="text-[10px] text-rose-900/50">{student.year}</span>
                    </div>
                    <p className="text-[11px] text-rose-900/60 truncate mt-0.5">{student.bio}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!selectedFirstPerson) {
                      setSelectedFirstPerson(student);
                    } else {
                      setSelectedSecondPerson(student);
                    }
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all border border-rose-200 hover:border-rose-500 cursor-pointer flex items-center gap-1"
                >
                  <span>{selectedFirstPerson ? 'Select' : 'Match'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TOP MATCHES DEMO LEADERBOARD */}
      {activeSubTab === 'TOP_MATCHES' && (
        <div className="space-y-3">
          {/* Badge Notice */}
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-center justify-between">
            <div>
              <p className="font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Demo Top Matches Leaderboard
              </p>
              <p className="text-[11px] text-rose-800/70">Ranked by highest YES votes and approval percentage</p>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 shrink-0">
              DEMO DATA
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedLeaderboard.map((nom, index) => (
              <div
                key={nom.id}
                className="bg-white rounded-2xl p-3 border border-rose-100 shadow-xs flex items-center justify-between gap-3"
              >
                {/* Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    index === 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : index === 1
                      ? 'bg-slate-100 text-slate-700 border border-slate-300'
                      : index === 2
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  #{index + 1}
                </div>

                {/* Couple Photos & Info */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="flex -space-x-2 shrink-0">
                    <img
                      src={nom.personAPhotoURL}
                      alt={nom.personAName}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <img
                      src={nom.personBPhotoURL}
                      alt={nom.personBName}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-rose-950 truncate">
                      {nom.personAName} & {nom.personBName}
                    </p>
                    <p className="text-[10px] text-rose-900/60 truncate">
                      {nom.personAInstitute} + {nom.personBInstitute}
                    </p>
                  </div>
                </div>

                {/* Vote Statistics */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-rose-600 block">
                    {nom.yesPercentage}% YES
                  </span>
                  <span className="text-[10px] text-rose-900/60">
                    {nom.yesVotes} yes • {nom.noVotes} no
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULL PROFILE PREVIEW MODAL */}
      {previewingProfile && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="relative aspect-square w-full">
              <img
                src={previewingProfile.profilePhotoURL}
                alt={previewingProfile.displayName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewingProfile(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-serif-display text-xl font-bold text-rose-950">
                  {previewingProfile.displayName}
                </h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {previewingProfile.institute}
                </span>
              </div>
              <p className="text-xs font-semibold text-rose-900/50 mt-0.5">{previewingProfile.year}</p>
              <p className="text-xs text-rose-900/80 mt-3 leading-relaxed">{previewingProfile.bio}</p>

              {/* MATCH WITH BUTTON */}
              <button
                onClick={() => {
                  setSelectedFirstPerson(previewingProfile);
                  setPreviewingProfile(null);
                }}
                className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>MATCH WITH</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: NOMINATION CONFIRMATION */}
      {selectedFirstPerson && selectedSecondPerson && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 fill-rose-600" />
            </div>

            <h3 className="font-serif-display text-2xl font-bold text-rose-950">Confirm Demo Nomination</h3>
            <p className="text-xs text-rose-800/70 mt-1 mb-5">
              Recommend this fictional pair to the campus community!
            </p>

            {nominationStatus.error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{nominationStatus.error}</span>
              </div>
            )}

            {nominationStatus.success && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Pairing nominated and visible on Vote on Pairs!</span>
              </div>
            )}

            {/* Side-by-Side Couple Preview */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                <img
                  src={selectedFirstPerson.profilePhotoURL}
                  alt={selectedFirstPerson.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs mx-auto mb-2"
                />
                <p className="text-xs font-bold text-rose-950 truncate">{selectedFirstPerson.displayName}</p>
                <p className="text-[10px] text-rose-800/70 font-medium">
                  {selectedFirstPerson.institute} • {selectedFirstPerson.year}
                </p>
                <p className="text-[10px] text-rose-900/60 mt-1 line-clamp-2">{selectedFirstPerson.bio}</p>
              </div>

              <div className="p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-center">
                <img
                  src={selectedSecondPerson.profilePhotoURL}
                  alt={selectedSecondPerson.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs mx-auto mb-2"
                />
                <p className="text-xs font-bold text-rose-950 truncate">{selectedSecondPerson.displayName}</p>
                <p className="text-[10px] text-rose-800/70 font-medium">
                  {selectedSecondPerson.institute} • {selectedSecondPerson.year}
                </p>
                <p className="text-[10px] text-rose-900/60 mt-1 line-clamp-2">{selectedSecondPerson.bio}</p>
              </div>
            </div>

            {/* Action Buttons: MATCH THESE TWO and CANCEL */}
            <div className="space-y-2">
              <button
                onClick={handleConfirmNomination}
                disabled={nominationStatus.submitting || nominationStatus.success}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-200 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {nominationStatus.submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>MATCH THESE TWO</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedSecondPerson(null)}
                disabled={nominationStatus.submitting}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-rose-900/60 hover:text-rose-900 cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
