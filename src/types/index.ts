export type Institute = 'SIBM' | 'SIDTM' | 'SSBF' | 'SIMC' | 'SSVAP' | 'SSSS';

export const INSTITUTES: Institute[] = ['SIBM', 'SIDTM', 'SSBF', 'SIMC', 'SSVAP', 'SSSS'];

export type AcademicYear = 'First Year' | 'Second Year';

export const ACADEMIC_YEARS: AcademicYear[] = ['First Year', 'Second Year'];

export type AccountStatus = 'active' | 'suspended' | 'deleted';

export type Gender = 'man' | 'woman';

export type InterestedIn = 'man' | 'woman' | 'everyone';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  usernameLowercase: string;
  institute: Institute;
  year: AcademicYear;
  bio: string;
  profilePhotoURL: string;
  instagramUsername: string;
  gender?: Gender;
  interestedIn?: InterestedIn;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  accountStatus: AccountStatus;
  profileCompleted: boolean;
  ageConfirmed: boolean;
  isAdmin?: boolean;
}

export interface LikeRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface PassRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface DatingMatch {
  id: string;
  userA: string;
  userB: string;
  userAUsername: string;
  userBUsername: string;
  userAInstagram: string;
  userBInstagram: string;
  userAPhotoURL: string;
  userBPhotoURL: string;
  userAInstitute: Institute;
  userBInstitute: Institute;
  userAYear: AcademicYear;
  userBYear: AcademicYear;
  createdAt: string;
  status: 'active' | 'unmatched';
}

export interface Nomination {
  id: string;
  nominatedBy: string;
  nominatorUsername?: string;
  personA: string;
  personB: string;
  personAName: string;
  personBName: string;
  personAInstitute: Institute;
  personBInstitute: Institute;
  personAYear: AcademicYear;
  personBYear: AcademicYear;
  personAPhotoURL?: string;
  personBPhotoURL?: string;
  personAIsUnregistered?: boolean;
  personBIsUnregistered?: boolean;
  registrationStatus: 'both_registered' | 'one_unregistered' | 'both_unregistered';
  consentStatus: 'approved' | 'pending' | 'declined';
  moderationStatus: 'active' | 'hidden' | 'removed';
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  yesPercentage: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoteRecord {
  id: string;
  nominationId: string;
  voterId: string;
  vote: 'YES' | 'NO';
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  reportedUserId: string;
  targetType: 'profile' | 'nomination';
  targetId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  collegeEmailDomains: string;
  isRegistrationOpen: boolean;
  enableMatcher: boolean;
  enableMatchmaking: boolean;
  enableCommunityVoting: boolean;
  enableTopMatches: boolean;
  isVotingClosed: boolean;
  minVotingThreshold: number;
  allowVoteChange: boolean;
  allowSelfNomination: boolean;
  updatedAt: string;
}

export interface StudentInvitation {
  id: string;
  username: string;
  email?: string;
  institute: Institute;
  year: AcademicYear;
  bio?: string;
  status: 'pending' | 'claimed';
  claimedByUid?: string;
  createdAt: string;
  claimedAt?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: string;
}

export type MainTab = 'matcher' | 'matchmaking' | 'mymatches' | 'topmatches' | 'profile';
