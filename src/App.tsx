import React, { useEffect, useState } from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginView } from './components/auth/LoginView';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { BottomNav } from './components/common/BottomNav';
import { Header } from './components/common/Header';
import { MatcherFeed } from './components/matcher/MatcherFeed';
import { MatchmakingView } from './components/matchmaking/MatchmakingView';
import { MyMatchesView } from './components/mymatches/MyMatchesView';
import { ProfileView } from './components/profile/ProfileView';
import { TopMatchesView } from './components/topmatches/TopMatchesView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getMutualMatches } from './lib/database';
import { MainTab } from './types';

const MainApp: React.FC = () => {
  const { user, userProfile, loading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<MainTab>('matcher');
  const [isAdminView, setIsAdminView] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);

  // Check URL pathname for direct /admin deep-link
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setIsAdminView(true);
    }
  }, []);

  // Fetch mutual matches count for bottom nav notification badge
  const updateMatchesBadge = async () => {
    if (userProfile?.uid) {
      try {
        const matches = await getMutualMatches(userProfile.uid);
        setMatchesCount(matches.length);
      } catch (e) {
        console.error('Error fetching badge count:', e);
      }
    }
  };

  useEffect(() => {
    updateMatchesBadge();
  }, [userProfile?.uid, currentTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F9] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-3xl bg-rose-500 text-white flex items-center justify-center animate-pulse shadow-lg shadow-rose-200">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <p className="mt-4 text-xs font-bold tracking-widest text-rose-950 uppercase">
          Campus Cupid
        </p>
      </div>
    );
  }

  // Not signed in -> Landing Page
  if (!user) {
    return <LoginView />;
  }

  // Signed in but incomplete profile -> Mandatory Onboarding Modal
  if (!userProfile || !userProfile.profileCompleted) {
    return (
      <div className="min-h-screen bg-[#FFF8F9] flex flex-col items-center justify-center">
        <OnboardingModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F9] flex flex-col font-sans text-rose-950 antialiased selection:bg-rose-200 selection:text-rose-900">
      {/* Top Header */}
      <Header
        onAdminClick={() => setIsAdminView(!isAdminView)}
        isAdminView={isAdminView}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {isAdminView ? (
          <AdminDashboard
            onBack={() => {
              setIsAdminView(false);
              window.history.pushState({}, '', '/');
            }}
          />
        ) : (
          <>
            {currentTab === 'matcher' && <MatcherFeed onMatchCreated={updateMatchesBadge} />}
            {currentTab === 'matchmaking' && <MatchmakingView />}
            {currentTab === 'mymatches' && <MyMatchesView />}
            {currentTab === 'topmatches' && <TopMatchesView />}
            {currentTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden in Admin Mode) */}
      {!isAdminView && (
        <BottomNav
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          matchesCount={matchesCount}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
