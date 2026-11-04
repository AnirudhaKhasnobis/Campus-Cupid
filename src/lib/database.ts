import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import {
  AcademicYear,
  AccountStatus,
  AuditLog,
  BlockRecord,
  DatingMatch,
  Gender,
  Institute,
  InterestedIn,
  LikeRecord,
  Nomination,
  PassRecord,
  ReportRecord,
  StudentInvitation,
  SystemSetting,
  UserProfile,
  VoteRecord
} from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';

const USERS_COL = 'users';
const USERNAMES_COL = 'usernames';
const LIKES_COL = 'likes';
const PASSES_COL = 'passes';
const MATCHES_COL = 'datingMatches';
const NOMINATIONS_COL = 'nominations';
const VOTES_COL = 'votes';
const REPORTS_COL = 'reports';
const BLOCKS_COL = 'blocks';
const ADMINS_COL = 'admins';
const SETTINGS_COL = 'settings';
const INVITATIONS_COL = 'invitations';
const AUDIT_LOGS_COL = 'auditLogs';

/**
 * Validates whether a username is available.
 */
export async function checkUsernameAvailability(username: string, currentUid?: string): Promise<{ available: boolean; error?: string }> {
  const sanitized = username.trim().toLowerCase();
  if (!sanitized) {
    return { available: false, error: 'Username is required' };
  }
  if (sanitized.length < 3 || sanitized.length > 20) {
    return { available: false, error: 'Username must be between 3 and 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
    return { available: false, error: 'Only letters, numbers, and underscores allowed' };
  }

  try {
    const docRef = doc(db, USERNAMES_COL, sanitized);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { available: true };
    }
    const data = snap.data();
    if (currentUid && data.uid === currentUid) {
      return { available: true };
    }
    return { available: false, error: 'Username is already taken' };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, USERNAMES_COL);
    return { available: false, error: 'Error checking username' };
  }
}

/**
 * Complete user profile on first onboarding.
 */
export async function completeUserProfile(
  uid: string,
  email: string,
  profileData: {
    username: string;
    institute: Institute;
    year: 'First Year' | 'Second Year';
    bio: string;
    profilePhotoURL: string;
    instagramUsername: string;
    ageConfirmed: boolean;
    gender: Gender;
    interestedIn: InterestedIn;
  }
): Promise<UserProfile> {
  const usernameLower = profileData.username.trim().toLowerCase();
  const now = new Date().toISOString();

  const userProfile: UserProfile = {
    uid,
    email,
    username: profileData.username.trim(),
    usernameLowercase: usernameLower,
    institute: profileData.institute,
    year: profileData.year,
    bio: profileData.bio.trim(),
    profilePhotoURL: profileData.profilePhotoURL,
    instagramUsername: profileData.instagramUsername.trim().replace(/^@/, ''),
    gender: profileData.gender,
    interestedIn: profileData.interestedIn,
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    accountStatus: 'active',
    profileCompleted: true,
    ageConfirmed: profileData.ageConfirmed,
  };

  try {
    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, USERNAMES_COL, usernameLower);
      const userRef = doc(db, USERS_COL, uid);

      const usernameSnap = await transaction.get(usernameRef);
      if (usernameSnap.exists() && usernameSnap.data().uid !== uid) {
        throw new Error('Username is already taken. Please pick another.');
      }

      transaction.set(usernameRef, {
        uid,
        username: profileData.username.trim(),
        createdAt: now,
      });

      transaction.set(userRef, userProfile);
    });

    return userProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, USERS_COL);
    throw error;
  }
}

/**
 * Fetch a user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COL, uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COL}/${uid}`);
    return null;
  }
}

/**
 * Check if user is an admin
 */
export async function checkIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (email === 'khasnobisanirudha@gmail.com') return true;
  try {
    const snap = await getDoc(doc(db, ADMINS_COL, uid));
    return snap.exists();
  } catch {
    return false;
  }
}

/**
 * Updates an existing user profile
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COL, uid);
    const now = new Date().toISOString();
    await updateDoc(userRef, {
      ...updates,
      updatedAt: now,
      lastActiveAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COL}/${uid}`);
  }
}

/**
 * Evaluates bidirectional gender preference compatibility:
 * 1. Candidate's gender matches currentUser's interestedIn preference
 * 2. CurrentUser's gender matches candidate's interestedIn preference
 */
export function isGenderPreferenceMatch(currentUser: UserProfile, candidate: UserProfile): boolean {
  // Check currentUser's preference towards candidate
  if (currentUser.interestedIn && currentUser.interestedIn !== 'everyone') {
    if (candidate.gender && candidate.gender !== currentUser.interestedIn) {
      return false;
    }
  }

  // Check candidate's preference towards currentUser
  if (candidate.interestedIn && candidate.interestedIn !== 'everyone') {
    if (currentUser.gender && currentUser.gender !== candidate.interestedIn) {
      return false;
    }
  }

  return true;
}

/**
 * Fetches discovery profiles for dating matcher.
 * Filters out:
 * - Current user
 * - Suspended or deleted users
 * - Users the current user already liked or passed
 * - Blocked relationships
 * - Existing mutual matches
 * - Profiles that do not match mutual gender & dating preferences
 */
export async function getDiscoveryProfiles(
  currentUserOrUid: UserProfile | string,
  limitCount = 20
): Promise<UserProfile[]> {
  const currentUid = typeof currentUserOrUid === 'string' ? currentUserOrUid : currentUserOrUid.uid;
  const currentUserObj = typeof currentUserOrUid === 'string' ? null : currentUserOrUid;

  const excludedUids = new Set<string>();
  excludedUids.add(currentUid);

  // Safely collect excluded UIDs from previous interactions without letting any single query crash the feed
  await Promise.allSettled([
    // Likes given by user
    getDocs(query(collection(db, LIKES_COL), where('fromUserId', '==', currentUid)))
      .then((snap) => snap.docs.forEach((d) => excludedUids.add(d.data().toUserId)))
      .catch((err) => console.warn('Non-fatal: could not fetch user likes', err)),

    // Passes given by user
    getDocs(query(collection(db, PASSES_COL), where('fromUserId', '==', currentUid)))
      .then((snap) => snap.docs.forEach((d) => excludedUids.add(d.data().toUserId)))
      .catch((err) => console.warn('Non-fatal: could not fetch user passes', err)),

    // Users blocked by current user
    getDocs(query(collection(db, BLOCKS_COL), where('blockerId', '==', currentUid)))
      .then((snap) => snap.docs.forEach((d) => excludedUids.add(d.data().blockedUserId)))
      .catch((err) => console.warn('Non-fatal: could not fetch blocked users', err)),

    // Users who blocked current user
    getDocs(query(collection(db, BLOCKS_COL), where('blockedUserId', '==', currentUid)))
      .then((snap) => snap.docs.forEach((d) => excludedUids.add(d.data().blockerId)))
      .catch((err) => console.warn('Non-fatal: could not fetch blocked-by users', err)),

    // Existing active matches as user A
    getDocs(query(collection(db, MATCHES_COL), where('userA', '==', currentUid)))
      .then((snap) => snap.docs.forEach((d) => {
        const data = d.data();
        if (data.status === 'active') excludedUids.add(data.userB);
      }))
      .catch((err) => console.warn('Non-fatal: could not fetch matches A', err)),

    // Existing active matches as user B
    getDocs(query(collection(db, MATCHES_COL), where('userB', '==', currentUid)))
      .then((snap) => snap.docs.forEach((d) => {
        const data = d.data();
        if (data.status === 'active') excludedUids.add(data.userA);
      }))
      .catch((err) => console.warn('Non-fatal: could not fetch matches B', err)),
  ]);

  try {
    // Single-field query on accountStatus - does NOT require a composite index
    const usersSnap = await getDocs(
      query(
        collection(db, USERS_COL),
        where('accountStatus', '==', 'active'),
        limit(120)
      )
    );

    const candidates: UserProfile[] = [];
    usersSnap.docs.forEach((d) => {
      const profile = d.data() as UserProfile;
      if (profile.profileCompleted && !excludedUids.has(profile.uid)) {
        // Enforce bidirectional gender preference matching
        if (!currentUserObj || isGenderPreferenceMatch(currentUserObj, profile)) {
          candidates.push(profile);
        }
      }
    });

    // Randomize candidates to offer a fresh discovery feed
    candidates.sort(() => Math.random() - 0.5);
    return candidates.slice(0, limitCount);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COL);
    return [];
  }
}

/**
 * Record a Like or Pass and check for mutual match atomically.
 */
export async function recordSwipe(
  currentUser: UserProfile,
  targetUser: UserProfile,
  direction: 'like' | 'pass'
): Promise<{ isMatch: boolean; match?: DatingMatch }> {
  const currentUid = currentUser.uid;
  const targetUid = targetUser.uid;
  const now = new Date().toISOString();

  if (direction === 'pass') {
    const passId = `${currentUid}_${targetUid}`;
    try {
      await setDoc(doc(db, PASSES_COL, passId), {
        id: passId,
        fromUserId: currentUid,
        toUserId: targetUid,
        createdAt: now,
      });
      return { isMatch: false };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, PASSES_COL);
      return { isMatch: false };
    }
  }

  // Direction is 'like'
  const likeId = `${currentUid}_${targetUid}`;
  const reverseLikeId = `${targetUid}_${currentUid}`;

  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Save current like
      const likeRef = doc(db, LIKES_COL, likeId);
      transaction.set(likeRef, {
        id: likeId,
        fromUserId: currentUid,
        toUserId: targetUid,
        createdAt: now,
      });

      // 2. Check if target user has liked current user
      const reverseLikeRef = doc(db, LIKES_COL, reverseLikeId);
      const reverseLikeSnap = await transaction.get(reverseLikeRef);

      if (reverseLikeSnap.exists()) {
        // Mutual Match! Create unique bidirectional match document
        const matchId = [currentUid, targetUid].sort().join('_');
        const matchRef = doc(db, MATCHES_COL, matchId);

        const matchRecord: DatingMatch = {
          id: matchId,
          userA: currentUid,
          userB: targetUid,
          userAUsername: currentUser.username,
          userBUsername: targetUser.username,
          userAInstagram: currentUser.instagramUsername,
          userBInstagram: targetUser.instagramUsername,
          userAPhotoURL: currentUser.profilePhotoURL,
          userBPhotoURL: targetUser.profilePhotoURL,
          userAInstitute: currentUser.institute,
          userBInstitute: targetUser.institute,
          userAYear: currentUser.year,
          userBYear: targetUser.year,
          createdAt: now,
          status: 'active',
        };

        transaction.set(matchRef, matchRecord);
        return { isMatch: true, match: matchRecord };
      }

      return { isMatch: false };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, LIKES_COL);
    return { isMatch: false };
  }
}

/**
 * Fetch student directory for matchmaking
 */
export async function getStudentDirectory(options: {
  search?: string;
  institute?: Institute | 'All';
  year?: AcademicYear | 'All';
  sortBy?: 'username' | 'institute' | 'recent';
  excludeUid?: string;
}): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, USERS_COL),
      where('accountStatus', '==', 'active'),
      limit(150)
    );
    const snap = await getDocs(q);
    let students = snap.docs
      .map((d) => d.data() as UserProfile)
      .filter((s) => s.profileCompleted === true);

    if (options.excludeUid) {
      students = students.filter((s) => s.uid !== options.excludeUid);
    }

    if (options.institute && options.institute !== 'All') {
      students = students.filter((s) => s.institute === options.institute);
    }

    if (options.year && options.year !== 'All') {
      students = students.filter((s) => s.year === options.year);
    }

    if (options.search && options.search.trim()) {
      const term = options.search.trim().toLowerCase();
      students = students.filter(
        (s) => s.username.toLowerCase().includes(term) || s.bio.toLowerCase().includes(term)
      );
    }

    if (options.sortBy === 'username') {
      students.sort((a, b) => a.username.localeCompare(b.username));
    } else if (options.sortBy === 'institute') {
      students.sort((a, b) => a.institute.localeCompare(b.institute));
    } else {
      // Recent
      students.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return students;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COL);
    return [];
  }
}

/**
 * Submit a couple nomination for registered students
 */
export async function nominatePair(
  nominator: UserProfile,
  personA: UserProfile,
  personB: UserProfile
): Promise<Nomination> {
  if (personA.uid === personB.uid) {
    throw new Error('Nominated students must be different individuals.');
  }

  // Consistent pair key regardless of order
  const pairKey = [personA.uid, personB.uid].sort().join('_');
  const now = new Date().toISOString();

  try {
    return await runTransaction(db, async (transaction) => {
      const existingNominationRef = doc(db, NOMINATIONS_COL, pairKey);
      const existingSnap = await transaction.get(existingNominationRef);

      if (existingSnap.exists()) {
        throw new Error('This pairing has already been nominated!');
      }

      const nomination: Nomination = {
        id: pairKey,
        nominatedBy: nominator.uid,
        nominatorUsername: nominator.username,
        personA: personA.uid,
        personB: personB.uid,
        personAName: personA.username,
        personBName: personB.username,
        personAInstitute: personA.institute,
        personBInstitute: personB.institute,
        personAYear: personA.year,
        personBYear: personB.year,
        personAPhotoURL: personA.profilePhotoURL,
        personBPhotoURL: personB.profilePhotoURL,
        registrationStatus: 'both_registered',
        consentStatus: 'approved',
        moderationStatus: 'active',
        yesVotes: 0,
        noVotes: 0,
        totalVotes: 0,
        yesPercentage: 0,
        featured: false,
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(existingNominationRef, nomination);
      return nomination;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, NOMINATIONS_COL);
    throw error;
  }
}

/**
 * Nominate an unregistered student by name
 */
export async function nominateUnregisteredPair(
  nominator: UserProfile,
  registeredPerson: UserProfile,
  unregisteredName: string,
  institute: Institute,
  year: AcademicYear
): Promise<Nomination> {
  const sanitizedName = unregisteredName.trim();
  if (!sanitizedName) throw new Error('Unregistered student name is required');

  const unregId = `unreg_${sanitizedName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
  const pairKey = [registeredPerson.uid, unregId].sort().join('_');
  const now = new Date().toISOString();

  try {
    const nomRef = doc(db, NOMINATIONS_COL, pairKey);
    const snap = await getDoc(nomRef);
    if (snap.exists()) {
      throw new Error('This pairing has already been nominated!');
    }

    const nomination: Nomination = {
      id: pairKey,
      nominatedBy: nominator.uid,
      nominatorUsername: nominator.username,
      personA: registeredPerson.uid,
      personB: unregId,
      personAName: registeredPerson.username,
      personBName: sanitizedName,
      personAInstitute: registeredPerson.institute,
      personBInstitute: institute,
      personAYear: registeredPerson.year,
      personBYear: year,
      personAPhotoURL: registeredPerson.profilePhotoURL,
      personBPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      personBIsUnregistered: true,
      registrationStatus: 'one_unregistered',
      consentStatus: 'pending', // Kept pending until claimed and consented
      moderationStatus: 'active',
      yesVotes: 0,
      noVotes: 0,
      totalVotes: 0,
      yesPercentage: 0,
      featured: false,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(nomRef, nomination);
    return nomination;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, NOMINATIONS_COL);
    throw error;
  }
}

/**
 * Fetch nominations for Community Voting
 */
export async function getCommunityNominations(voterId: string): Promise<{ nominations: Nomination[]; userVotes: Record<string, 'YES' | 'NO'> }> {
  try {
    const [nomsSnap, votesSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, NOMINATIONS_COL),
          where('moderationStatus', '==', 'active'),
          limit(100)
        )
      ),
      getDocs(query(collection(db, VOTES_COL), where('voterId', '==', voterId))),
    ]);

    const userVotes: Record<string, 'YES' | 'NO'> = {};
    votesSnap.docs.forEach((d) => {
      const voteData = d.data() as VoteRecord;
      userVotes[voteData.nominationId] = voteData.vote;
    });

    const nominations = nomsSnap.docs
      .map((d) => d.data() as Nomination)
      .filter((n) => n.consentStatus === 'approved');
    return { nominations, userVotes };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, NOMINATIONS_COL);
    return { nominations: [], userVotes: {} };
  }
}

/**
 * Cast a community vote (YES or NO) on a couple pairing
 */
export async function castVote(
  nominationId: string,
  voterId: string,
  voteValue: 'YES' | 'NO'
): Promise<Nomination> {
  const voteDocId = `${nominationId}_${voterId}`;
  const now = new Date().toISOString();

  try {
    return await runTransaction(db, async (transaction) => {
      const voteRef = doc(db, VOTES_COL, voteDocId);
      const voteSnap = await transaction.get(voteRef);

      if (voteSnap.exists()) {
        throw new Error('You have already voted on this pairing.');
      }

      const nomRef = doc(db, NOMINATIONS_COL, nominationId);
      const nomSnap = await transaction.get(nomRef);

      if (!nomSnap.exists()) {
        throw new Error('Nomination no longer exists.');
      }

      const nomData = nomSnap.data() as Nomination;
      const newYes = voteValue === 'YES' ? nomData.yesVotes + 1 : nomData.yesVotes;
      const newNo = voteValue === 'NO' ? nomData.noVotes + 1 : nomData.noVotes;
      const newTotal = newYes + newNo;
      const newPercentage = newTotal > 0 ? Math.round((newYes / newTotal) * 100) : 0;

      transaction.set(voteRef, {
        id: voteDocId,
        nominationId,
        voterId,
        vote: voteValue,
        createdAt: now,
      });

      const updatedNom: Partial<Nomination> = {
        yesVotes: newYes,
        noVotes: newNo,
        totalVotes: newTotal,
        yesPercentage: newPercentage,
        updatedAt: now,
      };

      transaction.update(nomRef, updatedNom);
      return { ...nomData, ...updatedNom };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, VOTES_COL);
    throw error;
  }
}

/**
 * Fetch Top Matches Leaderboard
 */
export async function getTopMatches(
  sortBy: 'yesVotes' | 'percentage' | 'totalVotes' = 'yesVotes',
  timeframe: 'weekly' | 'allTime' = 'allTime',
  minVotes = 3
): Promise<Nomination[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, NOMINATIONS_COL),
        where('moderationStatus', '==', 'active'),
        limit(100)
      )
    );

    let list = snap.docs
      .map((d) => d.data() as Nomination)
      .filter((n) => n.consentStatus === 'approved');

    // Apply weekly timeframe filter if selected
    if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      list = list.filter((item) => item.createdAt >= sevenDaysAgo || (item.updatedAt && item.updatedAt >= sevenDaysAgo));
    }

    // Apply ranking formula:
    // When sorting by percentage, enforce minimum voting threshold
    if (sortBy === 'percentage') {
      list.sort((a, b) => {
        if (a.totalVotes >= minVotes && b.totalVotes < minVotes) return -1;
        if (b.totalVotes >= minVotes && a.totalVotes < minVotes) return 1;
        if (b.yesPercentage !== a.yesPercentage) return b.yesPercentage - a.yesPercentage;
        return b.yesVotes - a.yesVotes;
      });
    } else if (sortBy === 'totalVotes') {
      list.sort((a, b) => b.totalVotes - a.totalVotes || b.yesVotes - a.yesVotes);
    } else {
      // Default: Most YES votes, with yesPercentage as tiebreaker
      list.sort((a, b) => b.yesVotes - a.yesVotes || b.yesPercentage - a.yesPercentage);
    }

    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, NOMINATIONS_COL);
    return [];
  }
}

/**
 * Fetch user's mutual dating matches
 */
export async function getMutualMatches(userId: string): Promise<DatingMatch[]> {
  try {
    const [snapA, snapB] = await Promise.all([
      getDocs(query(collection(db, MATCHES_COL), where('userA', '==', userId))),
      getDocs(query(collection(db, MATCHES_COL), where('userB', '==', userId))),
    ]);

    const matchesMap = new Map<string, DatingMatch>();
    snapA.docs.forEach((d) => {
      const data = d.data() as DatingMatch;
      if (data.status === 'active') matchesMap.set(d.id, data);
    });
    snapB.docs.forEach((d) => {
      const data = d.data() as DatingMatch;
      if (data.status === 'active') matchesMap.set(d.id, data);
    });

    const matches = Array.from(matchesMap.values());
    matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MATCHES_COL);
    return [];
  }
}

/**
 * Unmatch a user
 */
export async function unmatchUser(matchId: string): Promise<void> {
  try {
    await updateDoc(doc(db, MATCHES_COL, matchId), {
      status: 'unmatched',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${MATCHES_COL}/${matchId}`);
  }
}

/**
 * Block a user
 */
export async function blockUser(blockerId: string, blockedUserId: string): Promise<void> {
  const blockId = `${blockerId}_${blockedUserId}`;
  try {
    await setDoc(doc(db, BLOCKS_COL, blockId), {
      id: blockId,
      blockerId,
      blockedUserId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, BLOCKS_COL);
  }
}

/**
 * Submit misconduct report
 */
export async function submitReport(
  reporterId: string,
  reportedUserId: string,
  targetType: 'profile' | 'nomination',
  targetId: string,
  reason: string,
  description?: string
): Promise<void> {
  const reportId = `${reporterId}_${Date.now()}`;
  try {
    await setDoc(doc(db, REPORTS_COL, reportId), {
      id: reportId,
      reporterId,
      reportedUserId,
      targetType,
      targetId,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, REPORTS_COL);
  }
}

/**
 * System Settings
 */
export async function getSystemSettings(): Promise<SystemSetting> {
  const defaultSettings: SystemSetting = {
    id: 'config',
    collegeEmailDomains: '',
    isRegistrationOpen: true,
    enableMatcher: true,
    enableMatchmaking: true,
    enableCommunityVoting: true,
    enableTopMatches: true,
    isVotingClosed: false,
    minVotingThreshold: 3,
    allowVoteChange: false,
    allowSelfNomination: false,
    updatedAt: new Date().toISOString(),
  };

  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, 'config'));
    if (!snap.exists()) {
      return defaultSettings;
    }
    return { ...defaultSettings, ...(snap.data() as SystemSetting) };
  } catch (err) {
    console.error('Failed to get settings:', err);
    return defaultSettings;
  }
}

export async function updateSystemSettings(
  updates: Partial<SystemSetting>,
  adminId: string,
  adminEmail: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    await setDoc(doc(db, SETTINGS_COL, 'config'), {
      ...updates,
      updatedAt: now,
    }, { merge: true });

    await recordAdminAuditLog(
      adminId,
      adminEmail,
      'UPDATE_SYSTEM_SETTINGS',
      `Updated settings: ${Object.keys(updates).join(', ')}`,
      'config'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COL}/config`);
  }
}

/**
 * Admin: Record audit log entry
 */
export async function recordAdminAuditLog(
  adminId: string,
  adminEmail: string,
  action: string,
  details: string,
  targetId?: string
): Promise<void> {
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const log: AuditLog = {
      id,
      adminId,
      adminEmail,
      action,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    await setDoc(doc(db, AUDIT_LOGS_COL, id), log);
  } catch (e) {
    console.error('Failed to record audit log:', e);
  }
}

export async function getAdminAuditLogs(limitCount = 50): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(query(collection(db, AUDIT_LOGS_COL), limit(limitCount)));
    const logs = snap.docs.map((d) => d.data() as AuditLog);
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, AUDIT_LOGS_COL);
    return [];
  }
}

/**
 * Admin: Get live platform analytics with historical timeline breakdowns
 */
export async function getAdminAnalytics(timeFilter: 'today' | '7days' | '30days' | '90days' | 'all' = 'all') {
  try {
    const [usersSnap, likesSnap, passesSnap, matchesSnap, nomsSnap, votesSnap, reportsSnap] = await Promise.all([
      getDocs(collection(db, USERS_COL)),
      getDocs(collection(db, LIKES_COL)),
      getDocs(collection(db, PASSES_COL)),
      getDocs(collection(db, MATCHES_COL)),
      getDocs(collection(db, NOMINATIONS_COL)),
      getDocs(collection(db, VOTES_COL)),
      getDocs(collection(db, REPORTS_COL)),
    ]);

    let users = usersSnap.docs.map((d) => d.data() as UserProfile);
    let nominations = nomsSnap.docs.map((d) => d.data() as Nomination);
    let votes = votesSnap.docs.map((d) => d.data() as VoteRecord);
    let reports = reportsSnap.docs.map((d) => d.data() as ReportRecord);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Filter calculations
    let timeThreshold = 0;
    if (timeFilter === 'today') timeThreshold = oneDayAgo;
    else if (timeFilter === '7days') timeThreshold = sevenDaysAgo;
    else if (timeFilter === '30days') timeThreshold = thirtyDaysAgo;
    else if (timeFilter === '90days') timeThreshold = now - 90 * 24 * 60 * 60 * 1000;

    const filteredUsers = timeThreshold > 0
      ? users.filter((u) => new Date(u.createdAt).getTime() >= timeThreshold)
      : users;

    const newToday = users.filter((u) => new Date(u.createdAt).getTime() >= oneDayAgo).length;
    const newThisWeek = users.filter((u) => new Date(u.createdAt).getTime() >= sevenDaysAgo).length;
    const newThisMonth = users.filter((u) => new Date(u.createdAt).getTime() >= thirtyDaysAgo).length;

    const instituteCounts: Record<string, number> = {
      SIBM: 0,
      SIDTM: 0,
      SSBF: 0,
      SIMC: 0,
      SSVAP: 0,
      SSSS: 0,
    };

    const yearCounts: Record<string, number> = {
      'First Year': 0,
      'Second Year': 0,
    };

    let activeUsers = 0;
    let suspendedUsers = 0;
    let deletedUsers = 0;

    users.forEach((u) => {
      if (u.institute && instituteCounts[u.institute] !== undefined) {
        instituteCounts[u.institute]++;
      }
      if (u.year && yearCounts[u.year] !== undefined) {
        yearCounts[u.year]++;
      }
      if (u.accountStatus === 'active') activeUsers++;
      else if (u.accountStatus === 'suspended') suspendedUsers++;
      else if (u.accountStatus === 'deleted') deletedUsers++;
    });

    const totalLikes = likesSnap.size;
    const totalPasses = passesSnap.size;
    const totalMatches = matchesSnap.size;
    const matchConversionRate = totalLikes > 0 ? ((totalMatches * 2) / totalLikes) * 100 : 0;

    const totalYesVotes = votes.filter((v) => v.vote === 'YES').length;
    const totalNoVotes = votes.filter((v) => v.vote === 'NO').length;

    // Distinct users who swiped
    const swipingUsers = new Set<string>();
    likesSnap.docs.forEach((d) => swipingUsers.add(d.data().fromUserId));
    passesSnap.docs.forEach((d) => swipingUsers.add(d.data().fromUserId));

    // Nominations status breakdown
    const pendingNominations = nominations.filter((n) => n.consentStatus === 'pending').length;
    const approvedNominations = nominations.filter((n) => n.consentStatus === 'approved').length;
    const rejectedNominations = nominations.filter((n) => n.consentStatus === 'declined' || n.moderationStatus === 'removed').length;
    const unregisteredNominations = nominations.filter((n) => n.registrationStatus !== 'both_registered').length;

    // Timeline series for registration growth
    const dailyRegistrationsMap: Record<string, number> = {};
    users.forEach((u) => {
      const dateKey = u.createdAt ? u.createdAt.split('T')[0] : 'Unknown';
      dailyRegistrationsMap[dateKey] = (dailyRegistrationsMap[dateKey] || 0) + 1;
    });

    const registrationGrowthSeries = Object.keys(dailyRegistrationsMap)
      .sort()
      .map((date) => ({ date, count: dailyRegistrationsMap[date] }));

    // Top 5 popular pairings by YES votes
    const popularPairings = [...nominations]
      .sort((a, b) => b.yesVotes - a.yesVotes)
      .slice(0, 5)
      .map((n) => ({
        pair: `@${n.personAName} & @${n.personBName}`,
        yesVotes: n.yesVotes,
        totalVotes: n.totalVotes,
        percentage: n.yesPercentage,
      }));

    return {
      totalUsers: users.length,
      filteredUsersCount: filteredUsers.length,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      swipingUsersCount: swipingUsers.size,
      instituteCounts,
      yearCounts,
      totalLikes,
      totalPasses,
      totalMatches,
      matchConversionRate: Math.round(matchConversionRate * 10) / 10,
      totalNominations: nominations.length,
      pendingNominations,
      approvedNominations,
      rejectedNominations,
      registeredNominations: nominations.length - unregisteredNominations,
      unregisteredNominations,
      totalVotes: votes.length,
      totalYesVotes,
      totalNoVotes,
      pendingReports: reports.filter((r) => r.status === 'pending').length,
      registrationGrowthSeries,
      popularPairings,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin/analytics');
    throw error;
  }
}

/**
 * Admin: Get all accounts
 */
export async function getAdminUsersList(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(query(collection(db, USERS_COL), limit(250)));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COL);
    return [];
  }
}

/**
 * Admin: Edit student profile completely
 */
export async function adminEditUserProfile(
  uid: string,
  updates: {
    username?: string;
    bio?: string;
    institute?: Institute;
    year?: AcademicYear;
    profilePhotoURL?: string;
  },
  adminId: string,
  adminEmail: string
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COL, uid);
    const existingSnap = await getDoc(userRef);
    if (!existingSnap.exists()) throw new Error('User not found');
    const existing = existingSnap.data() as UserProfile;

    const now = new Date().toISOString();
    const finalUpdates: any = { ...updates, updatedAt: now };

    // If username changed, handle index reservation
    if (updates.username && updates.username.toLowerCase() !== existing.usernameLowercase) {
      const newLower = updates.username.toLowerCase().trim();
      const newRef = doc(db, USERNAMES_COL, newLower);
      const newSnap = await getDoc(newRef);
      if (newSnap.exists() && newSnap.data().uid !== uid) {
        throw new Error('Username is already taken by another student');
      }

      await deleteDoc(doc(db, USERNAMES_COL, existing.usernameLowercase));
      await setDoc(newRef, { uid, username: updates.username.trim(), createdAt: now });
      finalUpdates.username = updates.username.trim();
      finalUpdates.usernameLowercase = newLower;
    }

    await updateDoc(userRef, finalUpdates);

    await recordAdminAuditLog(
      adminId,
      adminEmail,
      'EDIT_USER_PROFILE',
      `Modified profile for @${existing.username}: ${Object.keys(updates).join(', ')}`,
      uid
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${uid}`);
    throw error;
  }
}

/**
 * Admin: Permanently delete account with complete cleanup
 */
export async function adminDeleteUserPermanently(
  uid: string,
  adminId: string,
  adminEmail: string
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COL, uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const userData = snap.data() as UserProfile;

    // 1. Delete username reservation
    if (userData.usernameLowercase) {
      try {
        await deleteDoc(doc(db, USERNAMES_COL, userData.usernameLowercase));
      } catch (e) {
        console.error('Failed to free username:', e);
      }
    }

    // 2. Cascade delete likes & passes from this user
    const [likesSnap, passesSnap, matchesASnap, matchesBSnap] = await Promise.all([
      getDocs(query(collection(db, LIKES_COL), where('fromUserId', '==', uid))),
      getDocs(query(collection(db, PASSES_COL), where('fromUserId', '==', uid))),
      getDocs(query(collection(db, MATCHES_COL), where('userA', '==', uid))),
      getDocs(query(collection(db, MATCHES_COL), where('userB', '==', uid))),
    ]);

    const batch = writeBatch(db);
    likesSnap.docs.forEach((d) => batch.delete(d.ref));
    passesSnap.docs.forEach((d) => batch.delete(d.ref));
    matchesASnap.docs.forEach((d) => batch.update(d.ref, { status: 'unmatched' }));
    matchesBSnap.docs.forEach((d) => batch.update(d.ref, { status: 'unmatched' }));

    // Delete user profile document
    batch.delete(userRef);
    await batch.commit();

    await recordAdminAuditLog(
      adminId,
      adminEmail,
      'PERMANENT_DELETE_USER',
      `Permanently deleted user @${userData.username} (${userData.email})`,
      uid
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COL}/${uid}`);
    throw error;
  }
}

/**
 * Admin: Change user account status
 */
export async function setAccountStatus(
  uid: string,
  status: AccountStatus,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COL, uid), {
      accountStatus: status,
      updatedAt: new Date().toISOString(),
    });

    if (adminId && adminEmail) {
      await recordAdminAuditLog(
        adminId,
        adminEmail,
        'CHANGE_ACCOUNT_STATUS',
        `Changed account status to '${status}'`,
        uid
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COL}/${uid}`);
  }
}

/**
 * Admin: Create student invitation
 */
export async function createStudentInvitation(
  data: {
    username: string;
    email?: string;
    institute: Institute;
    year: AcademicYear;
    bio?: string;
  },
  adminId: string,
  adminEmail: string
): Promise<StudentInvitation> {
  const usernameClean = data.username.trim().toLowerCase();
  const invitationId = `inv_${usernameClean}`;
  const now = new Date().toISOString();

  const invitation: StudentInvitation = {
    id: invitationId,
    username: data.username.trim(),
    email: data.email?.trim() || '',
    institute: data.institute,
    year: data.year,
    bio: data.bio?.trim() || '',
    status: 'pending',
    createdAt: now,
  };

  try {
    await setDoc(doc(db, INVITATIONS_COL, invitationId), invitation);
    await recordAdminAuditLog(
      adminId,
      adminEmail,
      'CREATE_INVITATION',
      `Created invitation for @${data.username} (${data.institute})`,
      invitationId
    );
    return invitation;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${INVITATIONS_COL}/${invitationId}`);
    throw error;
  }
}

export async function getStudentInvitations(): Promise<StudentInvitation[]> {
  try {
    const snap = await getDocs(query(collection(db, INVITATIONS_COL), limit(100)));
    return snap.docs.map((d) => d.data() as StudentInvitation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, INVITATIONS_COL);
    return [];
  }
}

/**
 * Admin: Moderate nomination
 */
export async function moderateNomination(
  nominationId: string,
  status: 'active' | 'hidden' | 'removed',
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, NOMINATIONS_COL, nominationId), {
      moderationStatus: status,
      updatedAt: new Date().toISOString(),
    });

    if (adminId && adminEmail) {
      await recordAdminAuditLog(
        adminId,
        adminEmail,
        'MODERATE_NOMINATION',
        `Changed moderation status of pairing to '${status}'`,
        nominationId
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NOMINATIONS_COL}/${nominationId}`);
  }
}

/**
 * Admin: Feature or unfeature pairing
 */
export async function featureNomination(
  nominationId: string,
  featured: boolean,
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, NOMINATIONS_COL, nominationId), {
      featured,
      updatedAt: new Date().toISOString(),
    });

    if (adminId && adminEmail) {
      await recordAdminAuditLog(
        adminId,
        adminEmail,
        'FEATURE_NOMINATION',
        `${featured ? 'Featured' : 'Unfeatured'} pairing`,
        nominationId
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NOMINATIONS_COL}/${nominationId}`);
  }
}

/**
 * Admin: Set nomination consent
 */
export async function setNominationConsent(
  nominationId: string,
  consentStatus: 'approved' | 'pending' | 'declined',
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, NOMINATIONS_COL, nominationId), {
      consentStatus,
      updatedAt: new Date().toISOString(),
    });

    if (adminId && adminEmail) {
      await recordAdminAuditLog(
        adminId,
        adminEmail,
        'UPDATE_NOMINATION_CONSENT',
        `Set consent status to '${consentStatus}'`,
        nominationId
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NOMINATIONS_COL}/${nominationId}`);
  }
}

/**
 * Admin: Get all reports
 */
export async function getAdminReports(): Promise<ReportRecord[]> {
  try {
    const snap = await getDocs(query(collection(db, REPORTS_COL), limit(100)));
    return snap.docs.map((d) => d.data() as ReportRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REPORTS_COL);
    return [];
  }
}

/**
 * Admin: Resolve report
 */
export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  adminId?: string,
  adminEmail?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, REPORTS_COL, reportId), {
      status,
    });

    if (adminId && adminEmail) {
      await recordAdminAuditLog(
        adminId,
        adminEmail,
        'RESOLVE_REPORT',
        `Marked report as '${status}'`,
        reportId
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COL}/${reportId}`);
  }
}
