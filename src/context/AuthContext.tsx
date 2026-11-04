import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkIsAdmin, getUserProfile, updateUserProfile } from '../lib/database';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (uid: string, email?: string | null) => {
    try {
      const [profile, adminCheck] = await Promise.all([
        getUserProfile(uid),
        checkIsAdmin(uid, email),
      ]);
      setUserProfile(profile);
      setIsAdmin(adminCheck);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser.email);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await fetchProfile(res.user.uid, res.user.email);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.email);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfile(user.uid, updates);
    if (userProfile) {
      setUserProfile({ ...userProfile, ...updates });
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      if (userProfile?.usernameLowercase) {
        try {
          await deleteDoc(doc(db, 'usernames', userProfile.usernameLowercase));
        } catch (e) {
          console.warn('Non-fatal: could not free username reservation:', e);
        }
      }
      await updateUserProfile(user.uid, {
        accountStatus: 'deleted',
        bio: '[Account deleted]',
        profilePhotoURL: '',
      });
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Failed to delete account:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        signInWithGoogle,
        signOutUser,
        refreshUserProfile,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
