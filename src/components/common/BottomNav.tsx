import { Flame, Sparkles, Trophy, User, Users } from 'lucide-react';
import React from 'react';
import { MainTab } from '../../types';

interface BottomNavProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  matchesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, matchesCount = 0 }) => {
  const tabs: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'matcher', label: 'Matcher', icon: Flame },
    { id: 'matchmaking', label: 'Matchmaking', icon: Users },
    { id: 'mymatches', label: 'My Matches', icon: Sparkles },
    { id: 'topmatches', label: 'Top Matches', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-rose-100/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(255,182,193,0.15)]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 ${
                isActive ? 'text-rose-600 scale-105' : 'text-rose-950/40 hover:text-rose-950/70'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-rose-50 text-rose-600 shadow-xs' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>

                {tab.id === 'mymatches' && matchesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                    {matchesCount > 9 ? '9+' : matchesCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? 'font-bold text-rose-700' : 'text-rose-900/50'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
