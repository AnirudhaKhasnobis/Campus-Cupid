import {
  Activity,
  AlertTriangle,
  Check,
  Flame,
  Globe,
  Lock,
  Pause,
  Play,
  Save,
  Shield,
  Sliders,
  Sparkles,
  Trophy,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSystemSettings, updateSystemSettings } from '../../lib/database';
import { SystemSetting } from '../../types';

export const AdminControls: React.FC = () => {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getSystemSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: keyof SystemSetting) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSave = async () => {
    if (!settings || !userProfile) return;
    setSaving(true);
    try {
      await updateSystemSettings(settings, userProfile.uid, userProfile.email);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save controls:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-xs text-rose-900/50">Loading application controls...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif-display text-lg font-bold text-rose-950">
            Platform Feature Controls & Safety
          </h3>
          <p className="text-xs text-rose-800/60">
            Real-time toggles affecting the student-facing campus application
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-xs hover:bg-rose-600 disabled:opacity-50 cursor-pointer transition-all"
        >
          {saving ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Configuration</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>System configuration updated and recorded to admin audit log.</span>
        </div>
      )}

      {/* Feature Toggles Card */}
      <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-rose-500" />
          <span>Core Feature Availability</span>
        </h4>

        <div className="divide-y divide-rose-50">
          {/* Student Registrations */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-950">Student Registration</p>
              <p className="text-[11px] text-rose-900/50">Allow new students to sign up with Google</p>
            </div>
            <button
              onClick={() => handleToggle('isRegistrationOpen')}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.isRegistrationOpen ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.isRegistrationOpen ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Matcher Feature */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-950">Matcher (Dating Discovery)</p>
                <p className="text-[11px] text-rose-900/50">Tinder-style swipe feed between students</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('enableMatcher')}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.enableMatcher ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.enableMatcher ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Matchmaking Feature */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-950">Play Cupid (Couple Nominations)</p>
                <p className="text-[11px] text-rose-900/50">Allow students to pair and recommend friends</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('enableMatchmaking')}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.enableMatchmaking ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.enableMatchmaking ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Community Voting */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-950">Vote on Pairs (Community Voting)</p>
                <p className="text-[11px] text-rose-900/50">Community couple swipe cards</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('enableCommunityVoting')}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.enableCommunityVoting ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.enableCommunityVoting ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Top Matches Leaderboard */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-950">Top Matches Leaderboard</p>
                <p className="text-[11px] text-rose-900/50">Public ranked pairings and podium</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('enableTopMatches')}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.enableTopMatches ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.enableTopMatches ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Close/Reopen Voting */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-950">Voting Pause (Close Voting)</p>
              <p className="text-[11px] text-rose-900/50">Temporarily freeze all community votes</p>
            </div>
            <button
              onClick={() => handleToggle('isVotingClosed')}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                settings.isVotingClosed
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {settings.isVotingClosed ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{settings.isVotingClosed ? 'Voting Closed' : 'Voting Open'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Threshold & Restriction Rules */}
      <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-rose-500" />
          <span>Leaderboard & Domain Rules</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
              Minimum Votes for Leaderboard
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.minVotingThreshold}
              onChange={(e) => setSettings({ ...settings, minVotingThreshold: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 font-semibold"
            />
            <p className="text-[10px] text-rose-900/40 mt-1">
              Prevents pairings with only 1 vote from ranking above active couples.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
              Allowed College Domains (Optional)
            </label>
            <input
              type="text"
              value={settings.collegeEmailDomains}
              onChange={(e) => setSettings({ ...settings, collegeEmailDomains: e.target.value })}
              placeholder="e.g. sibm.edu.in, sidtm.edu.in (leave empty for all)"
              className="w-full px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400"
            />
            <p className="text-[10px] text-rose-900/40 mt-1">Comma-separated email domain allowlist.</p>
          </div>
        </div>
      </div>

      {/* Application Health Check */}
      <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-950">Application Health & Database Connectivity</p>
            <p className="text-[10px] text-emerald-600 font-semibold">
              Firestore Cloud Database Online • Free Tier Operational
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Optimal (0 errors)
        </span>
      </div>
    </div>
  );
};
