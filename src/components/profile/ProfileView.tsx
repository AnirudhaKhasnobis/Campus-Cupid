import {
  AlertTriangle,
  Camera,
  Check,
  Edit2,
  Instagram,
  LogOut,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { compressAndResizeImage } from '../../lib/imageUtils';
import { Gender, InterestedIn } from '../../types';

export const ProfileView: React.FC = () => {
  const { userProfile, updateProfile, signOutUser, deleteAccount } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [instagram, setInstagram] = useState(userProfile?.instagramUsername || '');
  const [gender, setGender] = useState<Gender>(userProfile?.gender || 'man');
  const [interestedIn, setInterestedIn] = useState<InterestedIn>(userProfile?.interestedIn || 'woman');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!userProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        bio: bio.trim(),
        instagramUsername: instagram.trim().replace(/^@/, ''),
        gender,
        interestedIn,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const compressed = await compressAndResizeImage(file, 600, 600, 0.82);
      await updateProfile({ profilePhotoURL: compressed });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      setPhotoError(msg);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error('Error deleting account:', err);
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="font-serif-display text-2xl font-bold text-rose-950">My Profile</h2>
        <p className="text-xs text-rose-800/60 mt-0.5">Manage your campus dating information</p>
      </div>

      {saveSuccess && (
        <div className="p-2.5 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-5 text-center">
        {/* Avatar with Change Overlay */}
        <div className="relative w-28 h-28 mx-auto">
          <img
            src={userProfile.profilePhotoURL}
            alt={userProfile.username}
            className="w-full h-full rounded-full object-cover border-4 border-rose-100 shadow-md"
          />
          <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-rose-600 transition-colors">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
          {uploadingPhoto && (
            <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {photoError && <p className="text-xs text-rose-600">{photoError}</p>}

        {/* Username & Institute Badges */}
        <div>
          <h3 className="font-serif-display text-2xl font-bold text-rose-950">
            @{userProfile.username}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              {userProfile.institute}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-100">
              {userProfile.year}
            </span>
          </div>
        </div>

        {/* Edit or View State */}
        {!isEditing ? (
          <div className="space-y-3 pt-2 text-left">
            <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800/60 block mb-1">
                Bio
              </span>
              <p className="text-xs text-rose-950 leading-relaxed font-medium">{userProfile.bio}</p>
            </div>

            {/* Gender & Matcher Preference Chips */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800/60 block mb-0.5">
                  I Identify As
                </span>
                <span className="text-xs font-bold text-rose-950">
                  {userProfile.gender === 'woman' ? '🙋‍♀️ Woman' : '🙋‍♂️ Man'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800/60 block mb-0.5">
                  Looking For
                </span>
                <span className="text-xs font-bold text-rose-950">
                  {userProfile.interestedIn === 'woman'
                    ? 'Women (Girls)'
                    : userProfile.interestedIn === 'man'
                    ? 'Men (Boys)'
                    : 'Everyone'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800/60 block">
                  Instagram
                </span>
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1 mt-0.5">
                  <Instagram className="w-3.5 h-3.5 text-rose-500" />
                  @{userProfile.instagramUsername}
                </span>
              </div>
              <span className="text-[10px] text-rose-900/50 bg-white px-2 py-1 rounded-md border border-rose-100">
                Mutual match only
              </span>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Bio & Preferences</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5 pt-2 text-left">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-rose-900/80 uppercase tracking-wider">
                  Bio
                </label>
                <span className="text-[10px] text-rose-900/40">{bio.length}/200</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white resize-none"
              />
            </div>

            {/* Gender Identity & Dating Preference in Edit Form */}
            <div className="space-y-3 p-3 rounded-2xl bg-rose-50/40 border border-rose-100">
              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase tracking-wider mb-1">
                  I Identify As
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('man')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      gender === 'woman'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-white text-rose-900 border-rose-200 hover:border-rose-300'
                    }`}
                  >
                    <span>🙋‍♀️ Woman</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase tracking-wider mb-1">
                  I Am Looking For
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInterestedIn('woman')}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      interestedIn === 'everyone'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-white text-rose-900 border-rose-200 hover:border-rose-300'
                    }`}
                  >
                    <span>Everyone</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-rose-900/80 uppercase tracking-wider mb-1">
                Instagram Handle
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-rose-400 text-xs">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, '').trim())}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-900/60 hover:bg-rose-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !bio.trim() || !instagram.trim()}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-xs hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Settings Actions */}
      <div className="mt-4 space-y-3">
        <button
          onClick={signOutUser}
          className="w-full py-3 rounded-2xl bg-white border border-rose-100 text-rose-700 text-xs font-bold hover:bg-rose-50 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>

        {/* Prominent Account Deletion Section */}
        <div className="p-4 rounded-3xl bg-rose-50/60 border border-rose-200/80 text-left">
          <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5 mb-1">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Danger Zone</span>
          </h4>
          <p className="text-[11px] text-rose-900/60 mb-3 leading-relaxed">
            Permanently delete your profile from the dating discovery pool, unmatch connections, and release your username.
          </p>
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl bg-white border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif-display text-xl font-bold text-rose-950">Delete Account?</h3>
            <p className="text-xs text-rose-800/70 mt-1 mb-5 leading-relaxed">
              This will permanently delete your profile, remove you from matcher cards, unmatch all dating connections, and release @{userProfile.username}. This action cannot be undone.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <span>Yes, Delete My Account</span>
                )}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="w-full py-2 text-xs font-semibold text-rose-900/60 hover:text-rose-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
