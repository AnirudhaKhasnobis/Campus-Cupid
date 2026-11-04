import {
  Activity,
  ArrowLeft,
  BarChart3,
  Flame,
  Heart,
  PieChart,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminAnalytics,
  getAdminUsersList,
  getCommunityNominations
} from '../../lib/database';
import { INSTITUTES, Nomination, UserProfile } from '../../types';
import { AdminAccounts } from './AdminAccounts';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminControls } from './AdminControls';
import { AdminNominations } from './AdminNominations';
import { AdminReports } from './AdminReports';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'charts' | 'accounts' | 'nominations' | 'controls' | 'reports' | 'audit'
  >('overview');

  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days' | '90days' | 'all'>('all');

  // Analytics State
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Nominations State
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loadingNominations, setLoadingNominations] = useState(false);

  const fetchAnalytics = async (filter = timeFilter) => {
    setLoadingAnalytics(true);
    try {
      const data = await getAdminAnalytics(filter);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const list = await getAdminUsersList();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchNominations = async () => {
    if (!userProfile) return;
    setLoadingNominations(true);
    try {
      const res = await getCommunityNominations(userProfile.uid);
      setNominations(res.nominations);
    } catch (err) {
      console.error('Failed to load nominations:', err);
    } finally {
      setLoadingNominations(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
      fetchUsers();
      fetchNominations();
    }
  }, [isAdmin]);

  const handleTimeFilterChange = (filter: 'today' | '7days' | '30days' | '90days' | 'all') => {
    setTimeFilter(filter);
    fetchAnalytics(filter);
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-serif-display text-xl font-bold text-rose-950">Access Restricted</h3>
        <p className="text-xs text-rose-800/70 max-w-xs mt-1 leading-relaxed">
          The administrator dashboard is strictly protected. Only authorized college administrators may access this portal.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 cursor-pointer shadow-xs"
        >
          Return to Application
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 py-4 pb-28 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-800 hover:text-rose-950 px-3 py-1.5 rounded-xl bg-white border border-rose-100 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Student App</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 text-white text-xs font-bold shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>MNC Afterhours Admin</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-rose-100 shadow-xs overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'charts'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics & Charts</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'accounts'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('nominations')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'nominations'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Pairings ({nominations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('controls')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'controls'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-rose-900/60 hover:text-rose-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* 5.1 OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {loadingAnalytics ? (
            <div className="py-16 text-center text-xs text-rose-900/50">Computing live statistics...</div>
          ) : analytics ? (
            <>
              {/* Top 4 Primary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* User Stats Card */}
                <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
                  <div className="flex items-center justify-between text-rose-500 mb-1">
                    <span className="text-[10px] font-bold uppercase text-rose-800/60">Registered</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-black text-rose-950">{analytics.totalUsers}</span>
                  <div className="mt-1 flex flex-col text-[10px] text-rose-900/60 font-medium">
                    <span className="text-emerald-600 font-bold">{analytics.activeUsers} Active</span>
                    <span>+{analytics.newToday} today • +{analytics.newThisWeek} this week</span>
                  </div>
                </div>

                {/* Dating Stats Card */}
                <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
                  <div className="flex items-center justify-between text-pink-500 mb-1">
                    <span className="text-[10px] font-bold uppercase text-rose-800/60">Dating Swipes</span>
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-black text-rose-950">{analytics.totalLikes + analytics.totalPasses}</span>
                  <div className="mt-1 flex flex-col text-[10px] text-rose-900/60 font-medium">
                    <span className="text-rose-700 font-bold">{analytics.totalLikes} Likes ({analytics.totalPasses} passes)</span>
                    <span>{analytics.swipingUsersCount} students swiping</span>
                  </div>
                </div>

                {/* Mutual Matches Card */}
                <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
                  <div className="flex items-center justify-between text-rose-600 mb-1">
                    <span className="text-[10px] font-bold uppercase text-rose-800/60">Mutual Matches</span>
                    <Heart className="w-4 h-4 fill-rose-600" />
                  </div>
                  <span className="text-2xl font-black text-rose-950">{analytics.totalMatches}</span>
                  <div className="mt-1 flex flex-col text-[10px] text-rose-900/60 font-medium">
                    <span className="text-emerald-600 font-bold">{analytics.matchConversionRate}% Conversion</span>
                    <span>Both swiped right</span>
                  </div>
                </div>

                {/* Matchmaking Card */}
                <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
                  <div className="flex items-center justify-between text-amber-500 mb-1">
                    <span className="text-[10px] font-bold uppercase text-rose-800/60">Nominations</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-black text-rose-950">{analytics.totalNominations}</span>
                  <div className="mt-1 flex flex-col text-[10px] text-rose-900/60 font-medium">
                    <span className="text-amber-700 font-bold">{analytics.totalVotes} Community Votes</span>
                    <span>{analytics.approvedNominations} approved pairings</span>
                  </div>
                </div>
              </div>

              {/* 6 Campus Institutes Distribution */}
              <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 mb-3 flex items-center justify-between">
                  <span>6 Campus Institutes Distribution</span>
                  <span className="text-[11px] font-bold text-rose-900/50">{analytics.totalUsers} Students</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {INSTITUTES.map((inst) => (
                    <div key={inst} className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                      <span className="text-xs font-bold text-rose-900 block">{inst}</span>
                      <span className="text-xl font-black text-rose-950 mt-1 block">
                        {analytics.instituteCounts[inst] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Year Distribution */}
              <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 mb-3">
                  Academic Year Split
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">First Year</span>
                      <span className="text-[11px] text-rose-900/50">Undergraduate & Postgrad</span>
                    </div>
                    <span className="text-2xl font-black text-rose-950">{analytics.yearCounts['First Year'] || 0}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">Second Year</span>
                      <span className="text-[11px] text-rose-900/50">Senior Batches</span>
                    </div>
                    <span className="text-2xl font-black text-rose-950">{analytics.yearCounts['Second Year'] || 0}</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* 5.2 ANALYTICS & INTERACTIVE CHARTS */}
      {activeTab === 'charts' && analytics && (
        <AdminAnalyticsCharts
          analytics={analytics}
          timeFilter={timeFilter}
          onTimeFilterChange={handleTimeFilterChange}
          onRefresh={() => fetchAnalytics(timeFilter)}
          loading={loadingAnalytics}
        />
      )}

      {/* 5.3 ACCOUNT MANAGEMENT */}
      {activeTab === 'accounts' && (
        <AdminAccounts
          users={users}
          onRefresh={() => {
            fetchUsers();
            fetchAnalytics();
          }}
        />
      )}

      {/* 5.5 & 5.6 PAIRING NOMINATIONS & VOTING */}
      {activeTab === 'nominations' && (
        <AdminNominations
          nominations={nominations}
          onRefresh={() => {
            fetchNominations();
            fetchAnalytics();
          }}
        />
      )}

      {/* 5.4 APPLICATION CONTROLS */}
      {activeTab === 'controls' && <AdminControls />}

      {/* 5.7 USER REPORTS */}
      {activeTab === 'reports' && <AdminReports />}

      {/* AUDIT LOGS */}
      {activeTab === 'audit' && <AdminAuditLogs />}
    </div>
  );
};
