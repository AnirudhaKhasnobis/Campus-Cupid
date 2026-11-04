import { HeartHandshake, Lock, Sparkles, Trophy, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INSTITUTES } from '../../types';

export const LoginView: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FFF9FA] to-[#FFF0F3] flex flex-col justify-between px-4 py-8">
      {/* Top Branding */}
      <div className="max-w-md mx-auto w-full flex flex-col items-center text-center pt-8">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 p-0.5 shadow-xl shadow-rose-200/80 mb-5 animate-pulse">
          <div className="w-full h-full bg-white/10 rounded-[22px] flex items-center justify-center backdrop-blur-xs">
            <HeartHandshake className="w-8 h-8 text-white" />
          </div>
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest text-rose-500 bg-rose-100/80 px-3 py-1 rounded-full mb-3">
          Campus Exclusive • 18+
        </span>

        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-rose-950 tracking-tight mb-3">
          Campus Cupid
        </h1>

        <p className="text-sm sm:text-base text-rose-900/70 max-w-xs leading-relaxed mb-6">
          The dating and matchmaking network for university students. Discover classmates, play matchmaker, and vote on community couples.
        </p>

        {/* Participating Institutes Pill List */}
        <div className="w-full bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-rose-100/80 shadow-xs mb-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700/70 mb-2">
            6 Participating Institutes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {INSTITUTES.map((inst) => (
              <span
                key={inst}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50/80 text-rose-800 border border-rose-100/60"
              >
                {inst}
              </span>
            ))}
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-8">
          <div className="bg-white/80 rounded-2xl p-3 border border-rose-100/60 flex flex-col items-center text-center">
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-rose-900">Matcher</span>
            <span className="text-[10px] text-rose-800/60">Tinder-style swipe</span>
          </div>

          <div className="bg-white/80 rounded-2xl p-3 border border-rose-100/60 flex flex-col items-center text-center">
            <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center mb-1.5">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-rose-900">Matchmaking</span>
            <span className="text-[10px] text-rose-800/60">Pair two friends</span>
          </div>

          <div className="bg-white/80 rounded-2xl p-3 border border-rose-100/60 flex flex-col items-center text-center">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-rose-900">Top Matches</span>
            <span className="text-[10px] text-rose-800/60">Community vote</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="max-w-md mx-auto w-full flex flex-col items-center">
        {error && (
          <div className="w-full mb-3 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-pink-500 text-white font-bold text-base shadow-lg shadow-rose-300/60 hover:shadow-xl hover:shadow-rose-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G icon */}
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-rose-900/60 mt-4">
          <Lock className="w-3.5 h-3.5 text-rose-500" />
          <span>Private campus network • Instagram hidden until mutual match</span>
        </div>
      </div>
    </div>
  );
};
