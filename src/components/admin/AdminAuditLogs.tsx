import { Clock, FileText, Shield, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getAdminAuditLogs } from '../../lib/database';
import { AuditLog } from '../../types';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAuditLogs(100)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-rose-900/50">Loading administrative audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif-display text-lg font-bold text-rose-950">
          Administrative Action Audit Log
        </h3>
        <p className="text-xs text-rose-800/60">
          Immutable event log of profile changes, suspensions, moderation decisions, and system toggles
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-rose-100 shadow-xs">
          <Shield className="w-8 h-8 text-rose-300 mx-auto mb-2" />
          <h4 className="font-serif-display text-base font-bold text-rose-950">No Administrative Actions Yet</h4>
          <p className="text-xs text-rose-800/60 mt-1">Actions taken in the admin portal will appear here automatically.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-xs divide-y divide-rose-50 overflow-hidden">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 hover:bg-rose-50/30 transition-colors flex items-start justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                    {log.action}
                  </span>
                  <span className="text-[11px] text-rose-900/50 font-medium">
                    by {log.adminEmail}
                  </span>
                </div>
                <p className="text-xs font-semibold text-rose-950 mt-1">{log.details}</p>
                {log.targetId && (
                  <p className="text-[10px] text-rose-900/40 font-mono">Target: {log.targetId}</p>
                )}
              </div>

              <span className="text-[10px] text-rose-900/40 whitespace-nowrap shrink-0 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
