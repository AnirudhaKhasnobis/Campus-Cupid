import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle,
  Filter,
  Heart,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  castVote,
  getCommunityNominations,
  getStudentDirectory,
  getSystemSettings,
  nominatePair,
  nominateUnregisteredPair
} from '../../lib/database';
import { AcademicYear, INSTITUTES, Institute, Nomination, SystemSetting, UserProfile } from '../../types';
import { DemoMatchmakingView } from './DemoMatchmakingView';

export const MatchmakingView: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'PLAY_CUPID' | 'VOTE_ON_PAIRS'>('VOTE_ON_PAIRS');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSetting | null>(null);

  // Directory State
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [search, setSearch] = useState('');
  const [instituteFilter, setInstituteFilter] = useState<Institute | 'All'>('All');
  const [yearFilter, setYearFilter] = useState<AcademicYear | 'All'>('All');
  const [sortBy, setSortBy] = useState<'username' | 'institute' | 'recent'>('recent');

  // Pair Nomination Workflow State
  const [selectedFirstPerson, setSelectedFirstPerson] = useState<UserProfile | null>(null);
  const [selectedSecondPerson, setSelectedSecondPerson] = useState<UserProfile | null>(null);
  const [previewingProfile, setPreviewingProfile] = useState<UserProfile | null>(null);
  const [showUnregisteredModal, setShowUnregisteredModal] = useState(false);
  const [unregisteredName, setUnregisteredName] = useState('');
  const [unregisteredInstitute, setUnregisteredInstitute] = useState<Institute>('SIBM');
  const [unregisteredYear, setUnregisteredYear] = useState<AcademicYear>('First Year');

  const [nominationStatus, setNominationStatus] = useState<{ submitting: boolean; error: string | null; success: boolean }>({
    submitting: false,
    error: null,
    success: false,
  });

  // Community Voting Swiping State
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'YES' | 'NO'>>({});
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [votingDirection, setVotingDirection] = useState<'left' | 'right' | null>(null);
  const [votingFeedback, setVotingFeedback] = useState<string | null>(null);

  // Load Settings
  useEffect(() => {
    getSystemSettings().then(setSystemSettings);
  }, []);

  // Load Directory
  const loadDirectory = async () => {
    if (!userProfile) return;
    setLoadingDirectory(true);
    try {
      const data = await getStudentDirectory({
        search,
        institute: instituteFilter,
        year: yearFilter,
        sortBy,
        excludeUid: selectedFirstPerson ? selectedFirstPerson.uid : undefined,
      });
      setStudents(data);
    } catch (err) {
      console.error('Failed to load directory:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'PLAY_CUPID') {
      loadDirectory();
    }
  }, [search, instituteFilter, yearFilter, sortBy, selectedFirstPerson, activeSubTab]);

  // Load Community Nominations
  const loadCommunityVoting = async () => {
    if (!userProfile) return;
    setLoadingVotes(true);
    try {
      const res = await getCommunityNominations(userProfile.uid);
      setNominations(res.nominations);
      setUserVotes(res.userVotes);
    } catch (err) {
      console.error('Failed to load community voting:', err);
    } finally {
      setLoadingVotes(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'VOTE_ON_PAIRS') {
      loadCommunityVoting();
    }
  }, [activeSubTab]);

  // Handle Registered Nomination Submission
  const handleConfirmNomination = async () => {
    if (!userProfile || !selectedFirstPerson || !selectedSecondPerson) return;
    setNominationStatus({ submitting: true, error: null, success: false });

    try {
      await nominatePair(userProfile, selectedFirstPerson, selectedSecondPerson);
      setNominationStatus({ submitting: false, error: null, success: true });
      setTimeout(() => {
        setSelectedFirstPerson(null);
        setSelectedSecondPerson(null);
        setNominationStatus({ submitting: false, error: null, success: false });
        setActiveSubTab('VOTE_ON_PAIRS');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to nominate pair';
      setNominationStatus({ submitting: false, error: msg, success: false });
    }
  };

  // Handle Unregistered Nomination Submission
  const handleConfirmUnregisteredNomination = async () => {
    if (!userProfile || !selectedFirstPerson || !unregisteredName.trim()) return;
    setNominationStatus({ submitting: true, error: null, success: false });

    try {
      await nominateUnregisteredPair(
        userProfile,
        selectedFirstPerson,
        unregisteredName.trim(),
        unregisteredInstitute,
        unregisteredYear
      );
      setNominationStatus({ submitting: false, error: null, success: true });
      setTimeout(() => {
        setSelectedFirstPerson(null);
        setShowUnregisteredModal(false);
        setUnregisteredName('');
        setNominationStatus({ submitting: false, error: null, success: false });
        setActiveSubTab('VOTE_ON_PAIRS');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to nominate unregistered person';
      setNominationStatus({ submitting: false, error: msg, success: false });
    }
  };

  // Active unvoted pairing for VOTE ON PAIRS
  const currentPairing = nominations.find((n) => !userVotes[n.id]);

  // Handle Cast Vote with swipe physics
  const handleVote = async (voteValue: 'YES' | 'NO') => {
    if (!userProfile || !currentPairing) return;
    const pairingId = currentPairing.id;

    if (systemSettings?.isVotingClosed) {
      setVotingFeedback('Community voting is temporarily paused by administrators.');
      setTimeout(() => setVotingFeedback(null), 2500);
      return;
    }

    try {
      setVotingDirection(voteValue === 'YES' ? 'right' : 'left');
      setUserVotes((prev) => ({ ...prev, [pairingId]: voteValue }));

      const updated = await castVote(pairingId, userProfile.uid, voteValue);
      setNominations((prev) => prev.map((n) => (n.id === pairingId ? updated : n)));
      setVotingFeedback(voteValue === 'YES' ? '💖 Voted YES: Great Match!' : '❌ Voted NO: Not a Match');
      setTimeout(() => {
        setVotingFeedback(null);
        setVotingDirection(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error casting vote';
      setVotingFeedback(msg);
      setTimeout(() => setVotingFeedback(null), 3000);
    }
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleVote('YES');
    } else if (info.offset.x < -100) {
      handleVote('NO');
    }
  };

  // Feature Disabled Check
  if (systemSettings && systemSettings.enableMatchmaking === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif-display text-xl font-bold text-rose-950">Matchmaking Maintenance</h3>
        <p className="text-xs text-rose-800/70 max-w-xs mt-1 leading-relaxed">
          The matchmaking and voting features are currently paused by campus administrators. Please check back soon!
        </p>
      </div>
    );
  }

  // Active Demo Mode
  if (isDemoMode) {
    return <DemoMatchmakingView onExitDemo={() => setIsDemoMode(false)} />;
  }

  return (
    <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-4 py-3 pb-24">
      {/* Interactive Try Demo Entry Point */}
      <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 border border-amber-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-rose-950 truncate">Matchmaking Demo Mode</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 shrink-0">
                Sandboxed
              </span>
            </div>
            <p className="text-[11px] text-rose-900/70 truncate">
              Test Cupid nomination, 2-student consent & voting with 5 fictional students
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

      {/* Segmented Control: VOTE ON PAIRS (Default) and PLAY CUPID */}
      <div className="flex bg-rose-100/70 p-1 rounded-2xl mb-4 border border-rose-200/60 shadow-xs">
        <button
          onClick={() => setActiveSubTab('VOTE_ON_PAIRS')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'VOTE_ON_PAIRS'
              ? 'bg-white text-rose-800 shadow-sm'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>VOTE ON PAIRS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PLAY_CUPID')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'PLAY_CUPID'
              ? 'bg-white text-rose-800 shadow-sm'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>PLAY CUPID</span>
        </button>
      </div>

      {/* Floating Indicator when Person 1 is selected in Step 1 */}
      {selectedFirstPerson && !selectedSecondPerson && !showUnregisteredModal && (
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-3.5 mb-4 shadow-md flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <img
              src={selectedFirstPerson.profilePhotoURL}
              alt={selectedFirstPerson.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
            <div>
              <p className="text-[10px] uppercase font-bold text-rose-100">Step 2: Choose Partner For</p>
              <p className="text-xs font-black">@{selectedFirstPerson.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowUnregisteredModal(true)}
              className="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-white font-semibold cursor-pointer"
            >
              Not on app?
            </button>
            <button
              onClick={() => setSelectedFirstPerson(null)}
              className="text-xs bg-black/20 hover:bg-black/30 px-2 py-1 rounded-lg text-white font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: PLAY CUPID (STUDENT DIRECTORY & PAIR NOMINATION) */}
      {activeSubTab === 'PLAY_CUPID' && (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-rose-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classmates by username or bio..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-rose-100 text-xs text-rose-950 placeholder-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-xs"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-rose-900/40 font-bold shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" />
            </span>

            {/* Institute Filter */}
            <select
              value={instituteFilter}
              onChange={(e) => setInstituteFilter(e.target.value as Institute | 'All')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-100 text-rose-900 font-semibold text-[11px] shrink-0"
            >
              <option value="All">All Institutes</option>
              {INSTITUTES.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value as AcademicYear | 'All')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-100 text-rose-900 font-semibold text-[11px] shrink-0"
            >
              <option value="All">All Years</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'username' | 'institute' | 'recent')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-100 text-rose-900 font-semibold text-[11px] shrink-0"
            >
              <option value="recent">Recently Joined</option>
              <option value="username">A-Z Username</option>
              <option value="institute">Institute</option>
            </select>
          </div>

          {/* Directory Student List */}
          {loadingDirectory ? (
            <div className="py-12 text-center text-xs text-rose-900/50">Loading directory...</div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-rose-100">
              <p className="text-xs text-rose-900/60 font-medium">No students found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {students.map((student) => (
                <div
                  key={student.uid}
                  className="bg-white rounded-2xl p-3 border border-rose-100 shadow-xs flex items-center justify-between gap-3 hover:border-rose-200 transition-all"
                >
                  <div
                    onClick={() => setPreviewingProfile(student)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <img
                      src={student.profilePhotoURL}
                      alt={student.username}
                      className="w-12 h-12 rounded-xl object-cover border border-rose-100 shrink-0 shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-rose-950 truncate">@{student.username}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700">
                          {student.institute}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-900/60 truncate mt-0.5">{student.bio}</p>
                    </div>
                  </div>

                  {/* Match Button */}
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
          )}
        </div>
      )}

      {/* SUB-TAB 2: VOTE ON PAIRS (COMMUNITY PAIR SWIPING) */}
      {activeSubTab === 'VOTE_ON_PAIRS' && (
        <div className="flex-1 flex flex-col items-center justify-between w-full">
          {votingFeedback && (
            <div className="w-full mb-3 p-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold text-center animate-in fade-in shadow-xs">
              {votingFeedback}
            </div>
          )}

          {loadingVotes ? (
            <div className="py-20 text-center text-xs text-rose-900/50">Loading community pairings...</div>
          ) : currentPairing ? (
            <div className="w-full flex flex-col items-center">
              {/* Couple Card with Swipe Physics */}
              <div className="relative w-full aspect-[3/4] max-h-[520px] flex items-center justify-center">
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
                      {/* Person A Photo */}
                      <div className="relative h-full overflow-hidden border-r border-white/50">
                        <img
                          src={currentPairing.personAPhotoURL}
                          alt={currentPairing.personAName}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-2 text-white">
                          <p className="text-xs font-black truncate drop-shadow-xs">@{currentPairing.personAName}</p>
                          <p className="text-[10px] text-white/80 font-medium">
                            {currentPairing.personAInstitute} • {currentPairing.personAYear}
                          </p>
                        </div>
                      </div>

                      {/* Heart Connecting Badge in Center */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                        <Heart className="w-5 h-5 fill-white" />
                      </div>

                      {/* Person B Photo */}
                      <div className="relative h-full overflow-hidden">
                        <img
                          src={currentPairing.personBPhotoURL}
                          alt={currentPairing.personBName}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-2 right-3 text-white">
                          <p className="text-xs font-black truncate drop-shadow-xs">@{currentPairing.personBName}</p>
                          <p className="text-[10px] text-white/80 font-medium">
                            {currentPairing.personBInstitute} • {currentPairing.personBYear}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Question & Live Community Stats */}
                    <div className="p-4 bg-white text-center">
                      <p className="text-xs font-extrabold uppercase tracking-widest text-rose-500 mb-1">
                        DO THEY MAKE A GOOD MATCH?
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-900/60 mt-2 px-2">
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

              {/* Visible YES and NO buttons for easy voting */}
              <div className="w-full flex items-center justify-center gap-8 mt-5">
                <button
                  onClick={() => handleVote('NO')}
                  className="w-16 h-16 rounded-full bg-white text-rose-400 border border-rose-100 shadow-lg shadow-rose-100/80 flex items-center justify-center hover:scale-105 active:scale-95 hover:text-rose-600 transition-all cursor-pointer"
                >
                  <ThumbsDown className="w-7 h-7" />
                </button>

                <button
                  onClick={() => handleVote('YES')}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-xl shadow-rose-300/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <ThumbsUp className="w-7 h-7" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty State for Community Voting: Exactly matching prompt specification */
            <div className="w-full py-16 rounded-3xl bg-white/80 border border-dashed border-rose-200 flex flex-col items-center justify-center p-8 text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-rose-950 tracking-tight">
                YOU'RE ALL CAUGHT UP!
              </h3>
              <p className="text-xs text-rose-800/70 max-w-xs mt-1.5 leading-relaxed">
                More campus pairings are on their way.
              </p>
              <button
                onClick={loadCommunityVoting}
                className="mt-5 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-rose-300 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check for New Pairings</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* FULL PROFILE PREVIEW MODAL */}
      {previewingProfile && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="relative aspect-square w-full">
              <img
                src={previewingProfile.profilePhotoURL}
                alt={previewingProfile.username}
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
                  @{previewingProfile.username}
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

      {/* STEP 3 & 4: REGISTERED PAIR NOMINATION CONFIRMATION */}
      {selectedFirstPerson && selectedSecondPerson && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 fill-rose-600" />
            </div>

            <h3 className="font-serif-display text-2xl font-bold text-rose-950">Confirm Couple Nomination</h3>
            <p className="text-xs text-rose-800/70 mt-1 mb-5">
              Recommend this couple to the campus community for voting!
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
                <span>Pairing nominated successfully!</span>
              </div>
            )}

            {/* Side-by-Side Couple Preview */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                <img
                  src={selectedFirstPerson.profilePhotoURL}
                  alt={selectedFirstPerson.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs mx-auto mb-2"
                />
                <p className="text-xs font-bold text-rose-950 truncate">@{selectedFirstPerson.username}</p>
                <p className="text-[10px] text-rose-800/70 font-medium">
                  {selectedFirstPerson.institute} • {selectedFirstPerson.year}
                </p>
                <p className="text-[10px] text-rose-900/60 mt-1 line-clamp-2">{selectedFirstPerson.bio}</p>
              </div>

              <div className="p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-center">
                <img
                  src={selectedSecondPerson.profilePhotoURL}
                  alt={selectedSecondPerson.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs mx-auto mb-2"
                />
                <p className="text-xs font-bold text-rose-950 truncate">@{selectedSecondPerson.username}</p>
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

      {/* UNREGISTERED STUDENT NOMINATION MODAL */}
      {showUnregisteredModal && selectedFirstPerson && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 mx-auto flex items-center justify-center mb-2">
              <UserPlus className="w-5 h-5" />
            </div>

            <h3 className="font-serif-display text-xl font-bold text-rose-950">Nominate Classmate</h3>
            <p className="text-xs text-rose-800/70 mt-1 mb-4 leading-relaxed">
              Pair @{selectedFirstPerson.username} with someone not yet registered on Campus Cupid.
            </p>

            {nominationStatus.error && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {nominationStatus.error}
              </div>
            )}

            <div className="space-y-3 text-left mb-5">
              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={unregisteredName}
                  onChange={(e) => setUnregisteredName(e.target.value)}
                  placeholder="e.g. Ananya Patel"
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Institute
                </label>
                <select
                  value={unregisteredInstitute}
                  onChange={(e) => setUnregisteredInstitute(e.target.value as Institute)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 font-medium"
                >
                  {INSTITUTES.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Academic Year
                </label>
                <select
                  value={unregisteredYear}
                  onChange={(e) => setUnregisteredYear(e.target.value as AcademicYear)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 font-medium"
                >
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmUnregisteredNomination}
                disabled={nominationStatus.submitting || !unregisteredName.trim()}
                className="w-full py-3 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-wider hover:bg-rose-600 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {nominationStatus.submitting ? 'Submitting...' : 'MATCH THESE TWO'}
              </button>

              <button
                onClick={() => setShowUnregisteredModal(false)}
                className="w-full py-2 text-xs font-semibold text-rose-900/60 hover:text-rose-900 cursor-pointer"
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
