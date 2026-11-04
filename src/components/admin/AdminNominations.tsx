import {
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Filter,
  Heart,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { featureNomination, moderateNomination, setNominationConsent } from '../../lib/database';
import { Nomination } from '../../types';

interface AdminNominationsProps {
  nominations: Nomination[];
  onRefresh: () => void;
}

export const AdminNominations: React.FC<AdminNominationsProps> = ({ nominations, onRefresh }) => {
  const { userProfile: currentAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'removed'>('all');
  const [consentFilter, setConsentFilter] = useState<'all' | 'approved' | 'pending' | 'declined'>('all');

  const filtered = nominations.filter((nom) => {
    const matchesSearch =
      nom.personAName.toLowerCase().includes(search.toLowerCase()) ||
      nom.personBName.toLowerCase().includes(search.toLowerCase()) ||
      (nom.nominatorUsername && nom.nominatorUsername.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || nom.moderationStatus === statusFilter;
    const matchesConsent = consentFilter === 'all' || nom.consentStatus === consentFilter;
    return matchesSearch && matchesStatus && matchesConsent;
  });

  const handleModerate = async (id: string, status: 'active' | 'hidden' | 'removed') => {
    if (!currentAdmin) return;
    try {
      await moderateNomination(id, status, currentAdmin.uid, currentAdmin.email);
      onRefresh();
    } catch (err) {
      console.error('Error moderating pairing:', err);
    }
  };

  const handleConsent = async (id: string, consentStatus: 'approved' | 'pending' | 'declined') => {
    if (!currentAdmin) return;
    try {
      await setNominationConsent(id, consentStatus, currentAdmin.uid, currentAdmin.email);
      onRefresh();
    } catch (err) {
      console.error('Error setting consent:', err);
    }
  };

  const handleToggleFeature = async (id: string, currentFeatured?: boolean) => {
    if (!currentAdmin) return;
    try {
      await featureNomination(id, !currentFeatured, currentAdmin.uid, currentAdmin.email);
      onRefresh();
    } catch (err) {
      console.error('Error featuring pairing:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif-display text-lg font-bold text-rose-950">
          Pairing & Community Nomination Management
        </h3>
        <p className="text-xs text-rose-800/60">
          Review student nominations, feature pairings, and regulate community voting visibility
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3 rounded-2xl border border-rose-100 shadow-xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-rose-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student names or nominator..."
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-rose-50/40 border border-rose-100 text-xs text-rose-950 focus:ring-2 focus:ring-rose-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-900 font-semibold text-[11px]"
          >
            <option value="all">All Moderation Statuses</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="removed">Removed</option>
          </select>

          <select
            value={consentFilter}
            onChange={(e) => setConsentFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-900 font-semibold text-[11px]"
          >
            <option value="all">All Consent Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Consent</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/60 text-rose-900/70 border-b border-rose-100 uppercase text-[10px] font-extrabold tracking-wider">
              <tr>
                <th className="px-4 py-3">Couple Pairing</th>
                <th className="px-4 py-3">Institutes</th>
                <th className="px-4 py-3">Nominator</th>
                <th className="px-4 py-3">Votes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-rose-900/50">
                    No nominations found.
                  </td>
                </tr>
              ) : (
                filtered.map((nom) => (
                  <tr key={nom.id} className="hover:bg-rose-50/30 transition-colors">
                    {/* Couple Avatars & Names */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 shrink-0">
                          <img
                            src={nom.personAPhotoURL}
                            alt={nom.personAName}
                            className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                          />
                          <img
                            src={nom.personBPhotoURL}
                            alt={nom.personBName}
                            className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-rose-950 truncate max-w-[140px]">
                            @{nom.personAName} & @{nom.personBName}
                          </p>
                          {nom.featured && (
                            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 w-fit">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Institutes */}
                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-rose-900/70 font-medium">
                      {nom.personAInstitute} • {nom.personBInstitute}
                    </td>

                    {/* Nominator */}
                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-rose-900/70 font-mono">
                      @{nom.nominatorUsername || 'campus_cupid'}
                    </td>

                    {/* Vote Counts */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-emerald-600">{nom.yesVotes} YES</span> /{' '}
                      <span className="font-semibold text-rose-600">{nom.noVotes} NO</span>
                      <span className="text-[10px] text-rose-900/40 block">
                        {nom.yesPercentage}% approval ({nom.totalVotes} total)
                      </span>
                    </td>

                    {/* Status Badges */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize block w-fit mb-0.5 ${
                          nom.moderationStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {nom.moderationStatus}
                      </span>
                      <span className="text-[9px] text-rose-900/50 capitalize font-medium">
                        Consent: {nom.consentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Feature Toggle */}
                        <button
                          onClick={() => handleToggleFeature(nom.id, nom.featured)}
                          title={nom.featured ? 'Unfeature' : 'Feature on Top'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            nom.featured
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-rose-50 text-rose-400 hover:bg-rose-100'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${nom.featured ? 'fill-amber-500' : ''}`} />
                        </button>

                        {/* Hide / Unhide */}
                        {nom.moderationStatus === 'active' ? (
                          <button
                            onClick={() => handleModerate(nom.id, 'hidden')}
                            title="Hide from voting"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleModerate(nom.id, 'active')}
                            title="Unhide and make active"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Approve Consent */}
                        {nom.consentStatus !== 'approved' && (
                          <button
                            onClick={() => handleConsent(nom.id, 'approved')}
                            title="Approve Participation"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => handleModerate(nom.id, 'removed')}
                          title="Remove pairing"
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
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
    </div>
  );
};
