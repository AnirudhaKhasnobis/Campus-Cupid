import { HeartHandshake, ShieldCheck } from 'lucide-react';
import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onAdminClick?: () => void;
  isAdminView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onAdminClick, isAdminView }) => {
  const { userProfile, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-rose-100/80 px-4 py-3 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-sm shadow-rose-200">
            <HeartHandshake className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-display font-semibold text-lg text-rose-950 tracking-tight">
                Campus Cupid
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider">
                Symbiosis
              </span>
            </div>
            {userProfile?.institute && !isAdminView && (
              <p className="text-[11px] text-rose-800/60 font-medium">
                {userProfile.institute} • {userProfile.year}
              </p>
            )}
          </div>
        </div>

        {/* Right action: Admin badge or institute quick view */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onAdminClick}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                isAdminView
                  ? 'bg-rose-900 text-white border-rose-900 shadow-sm'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdminView ? 'Exit Admin' : 'Admin'}</span>
            </button>
          )}

          {userProfile?.profilePhotoURL ? (
            <img
              src={userProfile.profilePhotoURL}
              alt={userProfile.username}
              className="w-8 h-8 rounded-full object-cover border border-rose-200 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
              {userProfile?.username?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
