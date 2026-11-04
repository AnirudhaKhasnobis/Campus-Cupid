import { AlertTriangle, CheckCircle, Clock, ShieldAlert, UserX, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminReports, resolveReport, setAccountStatus } from '../../lib/database';
import { ReportRecord } from '../../types';

export const AdminReports: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getAdminReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (!currentAdmin) return;
    try {
      await resolveReport(reportId, status, currentAdmin.uid, currentAdmin.email);
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    } catch (err) {
      console.error('Error resolving report:', err);
    }
  };

  const handleSuspendUser = async (userId: string, reportId: string) => {
    if (!currentAdmin) return;
    try {
      await setAccountStatus(userId, 'suspended', currentAdmin.uid, currentAdmin.email);
      await resolveReport(reportId, 'resolved', currentAdmin.uid, currentAdmin.email);
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)));
    } catch (err) {
      console.error('Error suspending user from report:', err);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-rose-900/50">Loading student reports...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif-display text-lg font-bold text-rose-950">
          Misconduct & Moderation Reports
        </h3>
        <p className="text-xs text-rose-800/60">
          Student-submitted concerns regarding fake accounts, impersonation, or offensive behavior
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-rose-100 shadow-xs">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-serif-display text-base font-bold text-rose-950">All Clear!</h4>
          <p className="text-xs text-rose-800/60 mt-1">There are no pending reports in the queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-rose-950">{r.reason}</span>
                    <p className="text-[10px] text-rose-800/60 mt-0.5">
                      Target UID: <code className="font-mono bg-rose-50 px-1 py-0.5 rounded">{r.reportedUserId}</code>
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    r.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : r.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              {r.description && (
                <div className="p-3 rounded-2xl bg-rose-50/50 text-xs text-rose-900/80 leading-relaxed">
                  "{r.description}"
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-rose-50">
                <span className="text-rose-900/40 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" />
                  {new Date(r.createdAt).toLocaleString()}
                </span>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSuspendUser(r.reportedUserId, r.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Suspend Account</span>
                    </button>

                    <button
                      onClick={() => handleResolve(r.id, 'resolved')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Resolve</span>
                    </button>

                    <button
                      onClick={() => handleResolve(r.id, 'dismissed')}
                      className="px-2 py-1 rounded-lg text-rose-900/50 hover:text-rose-900 font-semibold cursor-pointer text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
