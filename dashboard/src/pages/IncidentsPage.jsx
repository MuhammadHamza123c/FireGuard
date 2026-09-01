import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { generateIncidentPDF } from '../utils/generateIncidentPDF';
import api from '../api/axios';

export default function IncidentsPage() {
  const { fetchProfile } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data.incidents || []);
    } catch {
      setToast({ message: 'Failed to load incidents', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/incidents/${id}`, { status });
      setToast({ message: `Status updated to ${status}`, type: 'success' });
      fetchIncidents();
      fetchProfile();
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Update failed', type: 'error' });
    } finally {
      setUpdating(null);
    }
  };

  const deleteIncident = async (id) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    try {
      await api.delete(`/incidents/${id}`);
      setToast({ message: 'Incident deleted', type: 'success' });
    } catch {
      // silent — incident may already be gone
    } finally {
      fetchIncidents();
      fetchProfile();
    }
  };

  const filtered = filter === 'ALL' ? incidents : incidents.filter((i) => i.status === filter);

  const statusColors = {
    DETECTED: 'bg-red-500/10 text-red-300 border-red-500/20',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  };

  const statusMeta = {
    DETECTED: { label: 'Detected', accent: 'bg-red-500', glow: 'shadow-red-500/20' },
    IN_PROGRESS: { label: 'In Progress', accent: 'bg-amber-500', glow: 'shadow-amber-500/20' },
    RESOLVED: { label: 'Resolved', accent: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
  };

  const filters = [
    { key: 'ALL', label: 'All', count: incidents.length },
    { key: 'DETECTED', label: 'Detected', count: incidents.filter((i) => i.status === 'DETECTED').length },
    { key: 'IN_PROGRESS', label: 'In Progress', count: incidents.filter((i) => i.status === 'IN_PROGRESS').length },
    { key: 'RESOLVED', label: 'Resolved', count: incidents.filter((i) => i.status === 'RESOLVED').length },
  ];

  const stats = [
    { key: 'total', label: 'Total', value: incidents.length, color: 'from-red-500/20 to-orange-500/20' },
    { key: 'DETECTED', label: 'Detected', value: incidents.filter((i) => i.status === 'DETECTED').length, color: 'from-red-500/20 to-red-600/20' },
    { key: 'IN_PROGRESS', label: 'In Progress', value: incidents.filter((i) => i.status === 'IN_PROGRESS').length, color: 'from-amber-500/20 to-yellow-500/20' },
    { key: 'RESOLVED', label: 'Resolved', value: incidents.filter((i) => i.status === 'RESOLVED').length, color: 'from-emerald-500/20 to-green-600/20' },
  ];

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 shadow-lg shadow-red-500/20">
              <div className="h-6 w-6 rounded-full border border-white/40 bg-white/10" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-300/80">Operations</p>
              <h1 className="text-3xl font-bold tracking-tight text-white">Incidents</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const stats = {
                  total: incidents.length,
                  detected: incidents.filter((i) => i.status === 'DETECTED').length,
                  inProgress: incidents.filter((i) => i.status === 'IN_PROGRESS').length,
                  resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
                };
                const name = generateIncidentPDF(filtered, stats);
                setToast({ message: `PDF exported: ${name}`, type: 'success' });
              }}
              disabled={filtered.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            <button
              onClick={fetchIncidents}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.key} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <div className="h-4 w-4 rounded-full bg-white/60" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-500">{stat.label}</span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f.key ? 'bg-white/20' : 'bg-gray-700/60'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center text-center text-gray-400">
                <div>
                  <svg className="mx-auto mb-3 h-8 w-8 animate-spin text-red-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm">Loading incidents...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center text-gray-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                  <div className="h-8 w-8 rounded-md border border-white/20 bg-white/10" />
                </div>
                <p className="mt-4 text-lg font-medium text-white">No incidents found</p>
                <p className="mt-1 text-sm text-gray-400">Try a different filter or refresh the list.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered.map((inc, i) => {
                  const meta = statusMeta[inc.status] || statusMeta.DETECTED;
                  return (
                    <div key={inc.id} className="p-4 transition-all hover:bg-white/[0.02] sm:p-5" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.accent} bg-opacity-20 shadow-lg ${meta.glow}`}>
                            <div className="h-5 w-5 rounded-full border border-white/40 bg-white/10" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-white">{inc.incident_type}</h3>
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${statusColors[inc.status] || statusColors.DETECTED}`}>
                                {meta.label}
                              </span>
                            </div>

                            {inc.message && (
                              <p className="mb-3 max-w-2xl text-sm leading-6 text-gray-300">{inc.message}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                              <span className="rounded-full bg-white/5 px-2 py-1">Fire: {((inc.fire_confidence || 0) * 100).toFixed(0)}%</span>
                              <span className="rounded-full bg-white/5 px-2 py-1">Smoke: {((inc.smoke_confidence || 0) * 100).toFixed(0)}%</span>
                              {inc.city && <span className="rounded-full bg-white/5 px-2 py-1">{inc.city}{inc.region ? `, ${inc.region}` : ''}</span>}
                              <span className="rounded-full bg-white/5 px-2 py-1">{new Date(inc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          {inc.status === 'DETECTED' && (
                            <button
                              onClick={() => updateStatus(inc.id, 'IN_PROGRESS')}
                              disabled={updating === inc.id}
                              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
                            >
                              In Progress
                            </button>
                          )}
                          {(inc.status === 'DETECTED' || inc.status === 'IN_PROGRESS') && (
                            <button
                              onClick={() => updateStatus(inc.id, 'RESOLVED')}
                              disabled={updating === inc.id}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const stats = { total: 1, detected: inc.status === 'DETECTED' ? 1 : 0, inProgress: inc.status === 'IN_PROGRESS' ? 1 : 0, resolved: inc.status === 'RESOLVED' ? 1 : 0 };
                              generateIncidentPDF([inc], stats);
                              setToast({ message: 'Incident PDF exported', type: 'success' });
                            }}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400 transition hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-300"
                            title="Export PDF"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteIncident(inc.id)}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                            aria-label="Delete incident"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/10 to-orange-500/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-300">Priority</p>
              <h2 className="mt-3 text-xl font-bold text-white">Immediate Action</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Detected</span>
                    <span className="text-sm font-semibold text-white">{incidents.filter((i) => i.status === 'DETECTED').length}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">In Progress</span>
                    <span className="text-sm font-semibold text-white">{incidents.filter((i) => i.status === 'IN_PROGRESS').length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">Quick Notes</p>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-red-400" /> Prioritize newly detected incidents first.</li>
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-amber-400" /> Keep active investigations moving.</li>
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" /> Resolve closed reports to keep the queue clean.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
