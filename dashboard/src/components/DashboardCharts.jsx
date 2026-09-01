import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';

const STATUS_COLORS = {
  DETECTED: '#ef4444',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#22c55e',
};

const TYPE_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#3b82f6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[11px] font-medium text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color || '#fff' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardCharts({ incidents }) {
  const statusData = useMemo(() => {
    const counts = { DETECTED: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    incidents.forEach((inc) => { counts[inc.status] = (counts[inc.status] || 0) + 1; });
    return [
      { name: 'Detected', value: counts.DETECTED, color: STATUS_COLORS.DETECTED },
      { name: 'In Progress', value: counts.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
      { name: 'Resolved', value: counts.RESOLVED, color: STATUS_COLORS.RESOLVED },
    ].filter((d) => d.value > 0);
  }, [incidents]);

  const typeData = useMemo(() => {
    const counts = {};
    incidents.forEach((inc) => {
      const t = inc.incident_type || 'Unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, fullName: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [incidents]);

  const timelineData = useMemo(() => {
    const dayMap = {};
    incidents.forEach((inc) => {
      const d = new Date(inc.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dayMap[key]) dayMap[key] = { date: key, fires: 0, smoke: 0, total: 0 };
      dayMap[key].total++;
      if (inc.incident_type?.includes('FIRE')) dayMap[key].fires++;
      else dayMap[key].smoke++;
    });
    return Object.values(dayMap).slice(-14);
  }, [incidents]);

  const confidenceData = useMemo(() => {
    if (!incidents.length) return [];
    return incidents.slice(0, 20).map((inc, i) => ({
      name: `#${i + 1}`,
      fire: ((inc.fire_confidence || 0) * 100).toFixed(0),
      smoke: ((inc.smoke_confidence || 0) * 100).toFixed(0),
    }));
  }, [incidents]);

  if (!incidents.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Status Distribution (Pie) */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
        <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
          Status Distribution
        </h2>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {statusData.map((d, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-gray-400">{d.name}</span>
                <span className="text-xs font-bold text-white ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Types (Bar) */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
        <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Incident Types
        </h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={typeData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
              {typeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline (Area) */}
      {timelineData.length > 1 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Fire Trend (Last 14 Days)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="gradFire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSmoke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="fires" name="Fire" stroke="#ef4444" fill="url(#gradFire)" strokeWidth={2} />
              <Area type="monotone" dataKey="smoke" name="Smoke" stroke="#f59e0b" fill="url(#gradSmoke)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confidence Levels (Bar) */}
      {confidenceData.length > 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
          <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Confidence Levels
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={confidenceData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="fire" name="Fire %" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={10} />
              <Bar dataKey="smoke" name="Smoke %" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
