import { AcademicYear, Gender, Institute, InterestedIn } from '../types';

export interface DemoStudent {
  id: string;
  username: string;
  displayName: string;
  institute: Institute;
  year: AcademicYear;
  bio: string;
  profilePhotoURL: string;
  instagramUsername: string;
  gender: Gender;
  interestedIn: InterestedIn;
  hasLikedCurrentUser?: boolean;
}

export interface DemoNomination {
  id: string;
  nominatedBy: string;
  nominatorUsername: string;
  personAId: string;
  personBId: string;
  personAName: string;
  personBName: string;
  personAInstitute: Institute;
  personBInstitute: Institute;
  personAYear: AcademicYear;
  personBYear: AcademicYear;
  personAPhotoURL: string;
  personBPhotoURL: string;
  personABio: string;
  personBBio: string;
  publiclyVotable: boolean;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  yesPercentage: number;
  createdAt: string;
}

export interface DemoState {
  students: DemoStudent[];
  nominations: DemoNomination[];
  userVotes: Record<string, 'YES' | 'NO'>;
  demoUserId: string;
  demoUsername: string;
}

export const FICTIONAL_STUDENTS: DemoStudent[] = [
  {
    id: 'demo_alex',
    username: 'alex',
    displayName: 'Alex',
    institute: 'SIDTM',
    year: 'First Year',
    bio: 'Digital tech innovator & telecom enthusiast. Loves rooftop coffee, indie podcasts, and tech debates.',
    profilePhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    instagramUsername: 'alex_sidtm',
    gender: 'woman',
    interestedIn: 'man',
    hasLikedCurrentUser: true,
  },
  {
    id: 'demo_sam',
    username: 'sam',
    displayName: 'Sam',
    institute: 'SIBM',
    year: 'Second Year',
    bio: 'Management consultant in the making. Weekend badminton champion, case study nerd, and vinyl collector.',
    profilePhotoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    instagramUsername: 'sam_sibm',
    gender: 'man',
    interestedIn: 'woman',
    hasLikedCurrentUser: false,
  },
  {
    id: 'demo_taylor',
    username: 'taylor',
    displayName: 'Taylor',
    institute: 'SIMC',
    year: 'First Year',
    bio: 'Visual storyteller and documentary filmmaker. 35mm film photographer searching for campus stories.',
    profilePhotoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    instagramUsername: 'taylor_creates',
    gender: 'woman',
    interestedIn: 'man',
    hasLikedCurrentUser: true,
  },
  {
    id: 'demo_jordan',
    username: 'jordan',
    displayName: 'Jordan',
    institute: 'SSBF',
    year: 'Second Year',
    bio: 'Banking & fintech enthusiast. Cold brew fanatic, amateur chef, and training for the Pune half-marathon.',
    profilePhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    instagramUsername: 'jordan_ssbf',
    gender: 'man',
    interestedIn: 'woman',
    hasLikedCurrentUser: false,
  },
  {
    id: 'demo_casey',
    username: 'casey',
    displayName: 'Casey',
    institute: 'SSVAP',
    year: 'Second Year',
    bio: 'Visual artist and typography lover. Passionate about sustainable fashion, cat memes, and film scores.',
    profilePhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    instagramUsername: 'casey_art',
    gender: 'woman',
    interestedIn: 'everyone',
    hasLikedCurrentUser: true,
  },
];

const INITIAL_NOMINATIONS: DemoNomination[] = [
  {
    id: 'demo_nom_sam_taylor',
    nominatedBy: 'demo_cupid',
    nominatorUsername: 'campus_matchmaker',
    personAId: 'demo_sam',
    personBId: 'demo_taylor',
    personAName: 'Sam',
    personBName: 'Taylor',
    personAInstitute: 'SIBM',
    personBInstitute: 'SIMC',
    personAYear: 'Second Year',
    personBYear: 'First Year',
    personAPhotoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    personBPhotoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    personABio: 'Management consultant in the making. Weekend badminton champion and vinyl collector.',
    personBBio: 'Visual storyteller and documentary filmmaker. 35mm film photographer.',
    publiclyVotable: true,
    yesVotes: 24,
    noVotes: 5,
    totalVotes: 29,
    yesPercentage: 83,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_nom_jordan_casey',
    nominatedBy: 'demo_cupid',
    nominatorUsername: 'hostel_friend',
    personAId: 'demo_jordan',
    personBId: 'demo_casey',
    personAName: 'Jordan',
    personBName: 'Casey',
    personAInstitute: 'SSBF',
    personBInstitute: 'SSVAP',
    personAYear: 'Second Year',
    personBYear: 'Second Year',
    personAPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    personBPhotoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    personABio: 'Banking & fintech enthusiast. Cold brew fanatic and amateur chef.',
    personBBio: 'Visual artist and typography lover. Passionate about sustainable fashion.',
    publiclyVotable: true,
    yesVotes: 18,
    noVotes: 7,
    totalVotes: 25,
    yesPercentage: 72,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_nom_alex_jordan',
    nominatedBy: 'demo_cupid',
    nominatorUsername: 'campus_insider',
    personAId: 'demo_alex',
    personBId: 'demo_jordan',
    personAName: 'Alex',
    personBName: 'Jordan',
    personAInstitute: 'SIDTM',
    personBInstitute: 'SSBF',
    personAYear: 'First Year',
    personBYear: 'Second Year',
    personAPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    personBPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    personABio: 'Digital tech innovator & telecom enthusiast. Loves rooftop coffee and indie podcasts.',
    personBBio: 'Banking & fintech enthusiast. Cold brew fanatic, amateur chef.',
    publiclyVotable: true,
    yesVotes: 14,
    noVotes: 4,
    totalVotes: 18,
    yesPercentage: 78,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_STORAGE_KEY = 'campus_cupid_demo_state_v3';
const DEMO_MATCHER_KEY = 'campus_cupid_demo_matcher_v1';

export function getInitialDemoState(): DemoState {
  return {
    students: FICTIONAL_STUDENTS,
    nominations: INITIAL_NOMINATIONS,
    userVotes: {},
    demoUserId: 'demo_user_guest',
    demoUsername: 'DemoUser',
  };
}

export function loadDemoState(): DemoState {
  if (typeof window === 'undefined') return getInitialDemoState();
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDemoState();
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as DemoState;
  } catch (err) {
    console.error('Failed to load demo state:', err);
    return getInitialDemoState();
  }
}

export function saveDemoState(state: DemoState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save demo state:', err);
  }
}

export function resetDemoState(): DemoState {
  const initial = getInitialDemoState();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
  }
  return initial;
}

export function createDemoNomination(
  personA: DemoStudent,
  personB: DemoStudent,
  nominatorUsername = 'You (Demo User)'
): { state: DemoState; nomination: DemoNomination } {
  const state = loadDemoState();
  const pairKey = `demo_nom_${[personA.id, personB.id].sort().join('_')}`;

  const existing = state.nominations.find((n) => n.id === pairKey);
  if (existing) {
    throw new Error(`This pairing of ${personA.displayName} & ${personB.displayName} has already been nominated in Demo Mode!`);
  }

  const newNomination: DemoNomination = {
    id: pairKey,
    nominatedBy: state.demoUserId,
    nominatorUsername,
    personAId: personA.id,
    personBId: personB.id,
    personAName: personA.displayName,
    personBName: personB.displayName,
    personAInstitute: personA.institute,
    personBInstitute: personB.institute,
    personAYear: personA.year,
    personBYear: personB.year,
    personAPhotoURL: personA.profilePhotoURL,
    personBPhotoURL: personB.profilePhotoURL,
    personABio: personA.bio,
    personBBio: personB.bio,
    publiclyVotable: true,
    yesVotes: 1,
    noVotes: 0,
    totalVotes: 1,
    yesPercentage: 100,
    createdAt: new Date().toISOString(),
  };

  const updatedState: DemoState = {
    ...state,
    nominations: [newNomination, ...state.nominations],
  };

  saveDemoState(updatedState);
  return { state: updatedState, nomination: newNomination };
}

export function castDemoVote(
  nominationId: string,
  voteValue: 'YES' | 'NO'
): { state: DemoState; updatedNomination: DemoNomination } {
  const state = loadDemoState();

  if (state.userVotes[nominationId]) {
    throw new Error('You have already voted on this demo pairing.');
  }

  let targetNom = state.nominations.find((n) => n.id === nominationId);
  if (!targetNom) {
    throw new Error('Demo nomination not found');
  }

  const newYes = voteValue === 'YES' ? targetNom.yesVotes + 1 : targetNom.yesVotes;
  const newNo = voteValue === 'NO' ? targetNom.noVotes + 1 : targetNom.noVotes;
  const newTotal = newYes + newNo;
  const newPercentage = newTotal > 0 ? Math.round((newYes / newTotal) * 100) : 0;

  const updatedNom: DemoNomination = {
    ...targetNom,
    yesVotes: newYes,
    noVotes: newNo,
    totalVotes: newTotal,
    yesPercentage: newPercentage,
  };

  const updatedState: DemoState = {
    ...state,
    nominations: state.nominations.map((n) => (n.id === nominationId ? updatedNom : n)),
    userVotes: {
      ...state.userVotes,
      [nominationId]: voteValue,
    },
  };

  saveDemoState(updatedState);
  return { state: updatedState, updatedNomination: updatedNom };
}

// ==========================================
// DEMO MATCHER LOGIC & STORAGE
// ==========================================

export interface DemoMatcherMatch {
  id: string;
  student: DemoStudent;
  createdAt: string;
}

export interface DemoMatcherState {
  candidates: DemoStudent[];
  swipedIds: string[];
  matches: DemoMatcherMatch[];
}

export function getInitialDemoMatcherState(): DemoMatcherState {
  return {
    candidates: [...FICTIONAL_STUDENTS],
    swipedIds: [],
    matches: [],
  };
}

export function loadDemoMatcherState(): DemoMatcherState {
  if (typeof window === 'undefined') return getInitialDemoMatcherState();
  try {
    const raw = localStorage.getItem(DEMO_MATCHER_KEY);
    if (!raw) {
      const initial = getInitialDemoMatcherState();
      localStorage.setItem(DEMO_MATCHER_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as DemoMatcherState;
  } catch (err) {
    console.error('Failed to load demo matcher state:', err);
    return getInitialDemoMatcherState();
  }
}

export function saveDemoMatcherState(state: DemoMatcherState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_MATCHER_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save demo matcher state:', err);
  }
}

export function resetDemoMatcherState(): DemoMatcherState {
  const initial = getInitialDemoMatcherState();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_MATCHER_KEY);
    localStorage.setItem(DEMO_MATCHER_KEY, JSON.stringify(initial));
  }
  return initial;
}

export function recordDemoMatcherSwipe(
  candidate: DemoStudent,
  direction: 'like' | 'pass'
): { state: DemoMatcherState; isMatch: boolean; match?: DemoMatcherMatch } {
  const state = loadDemoMatcherState();

  const isMatch = direction === 'like' && !!candidate.hasLikedCurrentUser;
  const matchRecord: DemoMatcherMatch | undefined = isMatch
    ? {
        id: `demo_match_${candidate.id}_${Date.now()}`,
        student: candidate,
        createdAt: new Date().toISOString(),
      }
    : undefined;

  const updatedState: DemoMatcherState = {
    ...state,
    swipedIds: [...state.swipedIds, candidate.id],
    matches: matchRecord ? [matchRecord, ...state.matches] : state.matches,
  };

  saveDemoMatcherState(updatedState);
  return { state: updatedState, isMatch, match: matchRecord };
}
