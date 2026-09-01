import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import DashboardCharts from '../components/DashboardCharts';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import useNotifications from '../hooks/useNotifications';

const LEVEL_THRESHOLDS = [
  { name: 'Bronze', min: 0, color: 'from-amber-700 to-amber-900', icon: '🥉' },
  { name: 'Silver', min: 50, color: 'from-gray-300 to-gray-500', icon: '🥈' },
  { name: 'Gold', min: 150, color: 'from-yellow-400 to-amber-500', icon: '🥇' },
  { name: 'Platinum', min: 300, color: 'from-cyan-300 to-blue-400', icon: '💎' },
];

function getLevel(points) {
  let level = LEVEL_THRESHOLDS[0];
  for (const l of LEVEL_THRESHOLDS) {
    if (points >= l.min) level = l;
  }
  return level;
}

function getNextLevel(points) {
  for (const l of LEVEL_THRESHOLDS) {
    if (points < l.min) return l;
  }
  return null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enabled: notificationsEnabled, toggle: toggleNotifications } = useNotifications();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data.incidents || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: incidents.length,
    detected: incidents.filter((i) => i.status === 'DETECTED').length,
    inProgress: incidents.filter((i) => i.status === 'IN_PROGRESS').length,
    resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
  };

  const recentIncidents = incidents.slice(0, 5);
  const points = profile?.points || 0;
  const currentLevel = getLevel(points);
  const nextLevel = getNextLevel(points);
  const progress = nextLevel ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  const statusConfig = {
    DETECTED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
    IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
    RESOLVED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-400' },
  };

  const statCards = [
    { label: 'Total Reports', value: stats.total, color: 'from-blue-500/15 to-blue-600/5', border: 'border-blue-500/15', text: 'text-blue-400', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Active Fires', value: stats.detected, color: 'from-red-500/15 to-red-600/5', border: 'border-red-500/15', text: 'text-red-400', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
    { label: 'In Progress', value: stats.inProgress, color: 'from-amber-500/15 to-amber-600/5', border: 'border-amber-500/15', text: 'text-amber-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Resolved', value: stats.resolved, color: 'from-green-500/15 to-green-600/5', border: 'border-green-500/15', text: 'text-green-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{getGreeting()}{user?.full_name ? `, ${user.full_name}` : ''}</h1>
              <p className="text-sm text-gray-500">Here's your fire detection overview</p>
            </div>
          </div>
          <button
            onClick={toggleNotifications}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${notificationsEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]'}`}
          >
            {notificationsEnabled ? (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            )}
            <span className="hidden sm:inline">{notificationsEnabled ? 'Alerts ON' : 'Enable Alerts'}</span>
            <div className={`w-8 h-4.5 rounded-full transition-all duration-300 flex items-center px-0.5 ${notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${notificationsEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className={`rounded-2xl bg-gradient-to-br ${s.color} border ${s.border} p-5 hover:scale-[1.02] transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gray-900/40 ${s.text}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-0.5">{s.value}</div>
            <div className="text-xs text-gray-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <Link to="/detect" className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 flex items-center gap-4 hover:bg-white/[0.04] hover:border-red-500/20 transition-all duration-300">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Fire Detection</h3>
            <p className="text-xs text-gray-500">Upload image or record video</p>
          </div>
          <svg className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>

        <Link to="/map" className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 flex items-center gap-4 hover:bg-white/[0.04] hover:border-green-500/20 transition-all duration-300">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">Live Fire Map</h3>
            <p className="text-xs text-gray-500">View active fires & routes</p>
          </div>
          <svg className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>

      {/* ── Charts ── */}
      <DashboardCharts incidents={incidents} />

      {/* ── Citizen Score + Recent ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Citizen Score */}
        {profile && (
          <div className="lg:col-span-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
            <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              Citizen Score
            </h2>

            {/* Level display */}
            <div className="text-center mb-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentLevel.color} mx-auto mb-3 flex items-center justify-center shadow-lg ring-1 ring-white/10 text-2xl`}>
                {currentLevel.icon}
              </div>
              <div className="text-lg font-bold text-white">{currentLevel.name}</div>
              <div className="text-xs text-gray-500">{points} points</div>
            </div>

            {/* Progress to next level */}
            {nextLevel && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{currentLevel.name}</span>
                  <span>{nextLevel.name} ({nextLevel.min})</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Reports', value: profile.total_reports || 0, color: 'text-white' },
                { label: 'Verified', value: profile.verified_reports || 0, color: 'text-green-400' },
                { label: 'False', value: profile.false_reports || 0, color: 'text-red-400' },
              ].map((s, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Incidents */}
        <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Recent Incidents
            </h2>
            <Link to="/incidents" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
              View All
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin w-5 h-5 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-gray-600">Loading incidents...</p>
            </div>
          ) : recentIncidents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-sm text-gray-500 mb-1">No incidents yet</p>
              <Link to="/detect" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Start detecting →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentIncidents.map((inc, i) => {
                const sc = statusConfig[inc.status] || statusConfig.DETECTED;
                return (
                  <div
                    key={inc.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group"
                  >
                    {/* Type icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      inc.incident_type?.includes('FIRE') ? 'bg-red-500/10' : 'bg-amber-500/10'
                    }`}>
                      <svg className={`w-4 h-4 ${inc.incident_type?.includes('FIRE') ? 'text-red-400' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{inc.incident_type}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span>{new Date(inc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-gray-700">·</span>
                        <span>{new Date(inc.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        {inc.city && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="truncate">{inc.city}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text} border ${sc.border} flex-shrink-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {inc.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
