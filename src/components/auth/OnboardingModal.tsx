import { AlertCircle, Camera, Check, CheckCircle2, Instagram, Lock, Sparkles, Upload } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { checkUsernameAvailability, completeUserProfile, getSystemSettings } from '../../lib/database';
import { compressAndResizeImage } from '../../lib/imageUtils';
import { ACADEMIC_YEARS, AcademicYear, Gender, INSTITUTES, Institute, InterestedIn, SystemSetting } from '../../types';

export const OnboardingModal: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();

  const [systemSettings, setSystemSettings] = useState<SystemSetting | null>(null);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender>('man');
  const [interestedIn, setInterestedIn] = useState<InterestedIn>('woman');

  const [institute, setInstitute] = useState<Institute>('SIBM');
  const [year, setYear] = useState<AcademicYear>('First Year');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getSystemSettings().then(setSystemSettings);
  }, []);

  // Debounced real-time username availability check
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameStatus('taken');
      setUsernameError('3-20 characters, alphanumeric & underscores only');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(trimmed, user?.uid);
      if (res.available) {
        setUsernameStatus('available');
        setUsernameError(null);
      } else {
        setUsernameStatus('taken');
        setUsernameError(res.error || 'Username already taken');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, user?.uid]);

  // Handle Photo selection & client-side compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setCompressing(true);

    try {
      const compressed = await compressAndResizeImage(file, 600, 600, 0.82);
      setPhotoDataUrl(compressed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compress image';
      setPhotoError(msg);
    } finally {
      setCompressing(false);
    }
  };

  const isFormValid =
    usernameStatus === 'available' &&
    photoDataUrl !== null &&
    bio.trim().length > 0 &&
    bio.trim().length <= 200 &&
    institute &&
    year &&
    instagram.trim().length > 0 &&
    ageConfirmed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isFormValid) {
      setFormError('Please fill in all mandatory fields correctly.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await completeUserProfile(user.uid, user.email || '', {
        username: username.trim(),
        institute,
        year,
        bio: bio.trim(),
        profilePhotoURL: photoDataUrl!,
        instagramUsername: instagram.trim().replace(/^@/, ''),
        ageConfirmed,
        gender,
        interestedIn,
      });

      await refreshUserProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // If registration is closed
  if (systemSettings && systemSettings.isRegistrationOpen === false) {
    return (
      <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-rose-100 text-center animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-serif-display text-xl font-bold text-rose-950">Registration Closed</h3>
        <p className="text-xs text-rose-800/70 mt-2 leading-relaxed">
          New account registrations are temporarily paused by campus administration. Please check back when registration opens!
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 2: Complete Your Campus Profile</span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-rose-950">
            Welcome to Campus Cupid
          </h2>
          <p className="text-xs sm:text-sm text-rose-900/60 mt-1">
            All fields are mandatory to unlock dating discovery and community matchmaking.
          </p>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Profile Picture Upload */}
          <div>
            <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider mb-1.5">
              Profile Photo <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-rose-50 border-2 border-dashed border-rose-200 flex items-center justify-center overflow-hidden shrink-0">
                {photoDataUrl ? (
                  <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-rose-300" />
                )}
                {compressing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoDataUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-rose-900/50 mt-1">
                  JPEG, PNG, or WebP. Auto-compressed to &lt;150KB for fast loading.
                </p>
                {photoError && <p className="text-[11px] text-rose-600 font-medium mt-1">{photoError}</p>}
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                Username <span className="text-rose-500">*</span>
              </label>
              {usernameStatus === 'checking' && (
                <span className="text-[11px] text-rose-500">Checking...</span>
              )}
              {usernameStatus === 'available' && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Available
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. rohan_sharma"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-sm text-rose-950 placeholder-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all font-mono"
              />
            </div>
            {usernameError && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">{usernameError}</p>
            )}
          </div>

          {/* Institute & Year Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider mb-1">
                Institute <span className="text-rose-500">*</span>
              </label>
              <select
                value={institute}
                onChange={(e) => setInstitute(e.target.value as Institute)}
                className="w-full px-3 py-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-sm text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white font-medium"
              >
                {INSTITUTES.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider mb-1">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value as AcademicYear)}
                className="w-full px-3 py-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-sm text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white font-medium"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender Identity & Dating Preference */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100">
            {/* Gender Identity */}
            <div>
              <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider mb-1.5">
                I Identify As <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('man')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    gender === 'man'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-white text-rose-900 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <span>🙋‍♂️ Man</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('woman')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    gender === 'woman'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-white text-rose-900 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <span>🙋‍♀️ Woman</span>
                </button>
              </div>
            </div>

            {/* Dating Preference */}
            <div>
              <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider mb-1.5">
                I Am Looking For <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setInterestedIn('woman')}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    interestedIn === 'woman'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-white text-rose-900 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <span>Women</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInterestedIn('man')}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    interestedIn === 'man'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-white text-rose-900 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <span>Men</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInterestedIn('everyone')}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    interestedIn === 'everyone'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-white text-rose-900 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <span>Everyone</span>
                </button>
              </div>
              <p className="text-[10px] text-rose-800/60 mt-1">
                Matcher will show profiles matching your preference and display yours to people looking for you.
              </p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                Bio <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${bio.length > 200 ? 'text-rose-600 font-bold' : 'text-rose-900/40'}`}>
                {bio.length}/200
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other students what you're into, favorite campus hangout, music..."
              rows={2}
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-sm text-rose-950 placeholder-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white resize-none"
            />
          </div>

          {/* Instagram Username */}
          <div>
            <label className="block text-xs font-bold text-rose-950 uppercase tracking-wider mb-1">
              Instagram Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-rose-400 font-semibold text-sm">@</span>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value.replace(/^@/, '').trim())}
                placeholder="your.handle"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-rose-50/50 border border-rose-200 text-sm text-rose-950 placeholder-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white"
              />
            </div>
            <p className="text-[11px] text-rose-800/60 mt-1 flex items-center gap-1">
              <Instagram className="w-3 h-3 text-rose-500 shrink-0" />
              <span>Only revealed after a mutual dating match. Never shown publicly.</span>
            </p>
          </div>

          {/* 18+ Confirmation */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-400"
              />
              <span className="text-xs text-rose-950/80 leading-snug">
                I confirm that I am a college student aged <strong>18 years or older</strong>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-md shadow-rose-200 hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Enter Campus Cupid</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
