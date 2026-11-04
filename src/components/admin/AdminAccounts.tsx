import {
  AlertTriangle,
  Camera,
  Check,
  Edit2,
  Mail,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  adminDeleteUserPermanently,
  adminEditUserProfile,
  createStudentInvitation,
  setAccountStatus
} from '../../lib/database';
import { compressAndResizeImage } from '../../lib/imageUtils';
import { ACADEMIC_YEARS, AcademicYear, AccountStatus, INSTITUTES, Institute, UserProfile } from '../../types';

interface AdminAccountsProps {
  users: UserProfile[];
  onRefresh: () => void;
}

export const AdminAccounts: React.FC<AdminAccountsProps> = ({ users, onRefresh }) => {
  const { userProfile: currentAdmin } = useAuth();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [instituteFilter, setInstituteFilter] = useState<Institute | 'All'>('All');
  const [yearFilter, setYearFilter] = useState<AcademicYear | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'All'>('All');

  // Selected Profile for detail / edit
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInstitute, setEditInstitute] = useState<Institute>('SIBM');
  const [editYear, setEditYear] = useState<AcademicYear>('First Year');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add User / Pre-invitation Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteInstitute, setInviteInstitute] = useState<Institute>('SIBM');
  const [inviteYear, setInviteYear] = useState<AcademicYear>('First Year');
  const [inviteBio, setInviteBio] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesInstitute = instituteFilter === 'All' || u.institute === instituteFilter;
    const matchesYear = yearFilter === 'All' || u.year === yearFilter;
    const matchesStatus = statusFilter === 'All' || u.accountStatus === statusFilter;
    return matchesSearch && matchesInstitute && matchesYear && matchesStatus;
  });

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditBio(user.bio);
    setEditInstitute(user.institute);
    setEditYear(user.year);
    setEditPhoto(user.profilePhotoURL);
    setIsEditing(true);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !currentAdmin) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await adminEditUserProfile(
        selectedUser.uid,
        {
          username: editUsername.trim(),
          bio: editBio.trim(),
          institute: editInstitute,
          year: editYear,
          profilePhotoURL: editPhoto || selectedUser.profilePhotoURL,
        },
        currentAdmin.uid,
        currentAdmin.email
      );
      setIsEditing(false);
      setSelectedUser(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleSuspend = async (user: UserProfile) => {
    if (!currentAdmin) return;
    const nextStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await setAccountStatus(user.uid, nextStatus, currentAdmin.uid, currentAdmin.email);
      onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeletePermanently = async () => {
    if (!userToDelete || !currentAdmin) return;
    setDeleting(true);
    try {
      await adminDeleteUserPermanently(userToDelete.uid, currentAdmin.uid, currentAdmin.email);
      setUserToDelete(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to permanently delete user:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !inviteUsername.trim()) return;
    setInviting(true);
    try {
      await createStudentInvitation(
        {
          username: inviteUsername.trim(),
          email: inviteEmail.trim() || undefined,
          institute: inviteInstitute,
          year: inviteYear,
          bio: inviteBio.trim() || undefined,
        },
        currentAdmin.uid,
        currentAdmin.email
      );
      setInviteSuccess(`Created invitation for @${inviteUsername.trim()}`);
      setTimeout(() => {
        setInviteSuccess(null);
        setShowAddUserModal(false);
        setInviteUsername('');
        setInviteEmail('');
        setInviteBio('');
      }, 1500);
    } catch (err) {
      console.error('Error creating invitation:', err);
    } finally {
      setInviting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file, 600, 600, 0.82);
      setEditPhoto(compressed);
    } catch (err) {
      console.error('Photo compression error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar with Add Student Invitation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif-display text-lg font-bold text-rose-950">
            Student Account Management
          </h3>
          <p className="text-xs text-rose-800/60">
            {filteredUsers.length} of {users.length} total registered students
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Student Account</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3 rounded-2xl border border-rose-100 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-rose-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by username or email..."
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-rose-50/40 border border-rose-100 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Institute Filter */}
          <select
            value={instituteFilter}
            onChange={(e) => setInstituteFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-900 font-semibold text-[11px]"
          >
            <option value="All">All Institutes</option>
            {INSTITUTES.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-900 font-semibold text-[11px]"
          >
            <option value="All">All Years</option>
            <option value="First Year">First Year</option>
            <option value="Second Year">Second Year</option>
          </select>

          {/* Account Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-900 font-semibold text-[11px]"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/60 text-rose-900/70 border-b border-rose-100 uppercase text-[10px] font-extrabold tracking-wider">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Institute & Year</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-rose-900/50">
                    No accounts found matching your query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-rose-50/30 transition-colors">
                    {/* Student Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.profilePhotoURL}
                          alt={u.username}
                          className="w-9 h-9 rounded-xl object-cover border border-rose-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-rose-950 truncate">@{u.username}</p>
                          <p className="text-[10px] text-rose-900/50 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Institute & Year */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-rose-900">{u.institute}</span>
                      <span className="text-[10px] text-rose-900/50 block">{u.year}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          u.accountStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : u.accountStatus === 'suspended'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-rose-900/60 font-medium">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Profile"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleSuspend(u)}
                          title={u.accountStatus === 'suspended' ? 'Reactivate' : 'Suspend'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.accountStatus === 'suspended'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {u.accountStatus === 'suspended' ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setUserToDelete(u)}
                          title="Permanently Delete Account"
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 my-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif-display text-lg font-bold text-rose-950">
                Edit Student Profile
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {editError}
              </div>
            )}

            {/* Photo Preview & Replace */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-rose-200 shrink-0">
                <img
                  src={editPhoto || selectedUser.profilePhotoURL}
                  alt={selectedUser.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <label className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 cursor-pointer inline-flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Replace Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-rose-900/40 mt-1">Compressed to &lt;150KB automatically</p>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Institute
                </label>
                <select
                  value={editInstitute}
                  onChange={(e) => setEditInstitute(e.target.value as Institute)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 font-medium"
                >
                  {INSTITUTES.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Year
                </label>
                <select
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value as AcademicYear)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 font-medium"
                >
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Bio ({editBio.length}/200)
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/40 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-900/60 hover:bg-rose-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit || !editUsername.trim()}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {savingEdit ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-serif-display text-xl font-bold text-rose-950">
              Permanently Delete Account?
            </h3>

            <p className="text-xs text-rose-800/70 mt-2 mb-4 leading-relaxed">
              This action is <strong>irreversible</strong>. It will remove <strong>@{userToDelete.username}</strong>, free their username, erase their likes, passes, and unmatch mutual connections without leaving orphaned data.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleDeletePermanently}
                disabled={deleting}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Account Permanently'}
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                className="w-full py-2 text-xs font-semibold text-rose-900/60 hover:text-rose-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER / PRE-INVITATION MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-2">
              <UserPlus className="w-5 h-5" />
            </div>

            <h3 className="font-serif-display text-lg font-bold text-rose-950">Add Student Invitation</h3>
            <p className="text-xs text-rose-800/70 mt-1 mb-4">
              Pre-configure a student profile. When the student signs in via Google, they will claim this username.
            </p>

            {inviteSuccess && (
              <div className="p-2.5 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-center gap-1.5 font-semibold">
                <Check className="w-4 h-4" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvitation} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Reserved Username *
                </label>
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. priya_deshmukh"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Student Email (Optional)
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@sibm.edu.in"
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                    Institute
                  </label>
                  <select
                    value={inviteInstitute}
                    onChange={(e) => setInviteInstitute(e.target.value as Institute)}
                    className="w-full px-2.5 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 font-medium"
                  >
                    {INSTITUTES.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                    Year
                  </label>
                  <select
                    value={inviteYear}
                    onChange={(e) => setInviteYear(e.target.value as AcademicYear)}
                    className="w-full px-2.5 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 font-medium"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-900/80 uppercase mb-1">
                  Optional Bio Notes
                </label>
                <textarea
                  value={inviteBio}
                  onChange={(e) => setInviteBio(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="Pre-set bio description..."
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-900/60 hover:bg-rose-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteUsername.trim()}
                  className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {inviting ? 'Saving...' : 'Create Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
