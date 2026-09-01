export default function StatsCard({ icon, label, value, color = 'gray', sub, trend }) {
  const colors = {
    red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    green: 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    gray: 'from-gray-500/20 to-gray-600/5 border-gray-500/20 text-gray-400',
  };

  const iconColors = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    gray: 'text-gray-400',
  };

  return (
    <div className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${colors[color]} animate-fadeInUp glass-hover`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gray-900/50 ${iconColors[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
