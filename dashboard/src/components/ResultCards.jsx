export default function ResultCards({ result }) {
  if (!result || result.error) {
    if (result?.error) {
      return (
        <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Detection Results
          </h3>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {result.error}
          </div>
        </div>
      );
    }
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">Waiting for detection</p>
          <p className="text-gray-600 text-sm mt-1">Upload a file or record to begin</p>
        </div>
      </div>
    );
  }

  const isFire = result.incident_confirmed || result.fire_detected;
  const status = result.incident_type || result.status || 'NO INCIDENT';

  return (
    <div className="glass-card rounded-2xl p-6 animate-fadeInUp">
      <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Detection Results
      </h3>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl mb-4 animate-fadeInUp ${
        isFire
          ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 border border-red-500/30'
          : 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isFire ? 'bg-red-500/20' : 'bg-green-500/20'
          }`}>
            {isFire ? (
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Status</div>
            <div className={`text-lg font-bold ${isFire ? 'text-red-400' : 'text-green-400'}`}>
              {status}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Bars */}
      <div className="space-y-3">
        <ConfidenceBar
          label="Fire Confidence"
          value={result.fire_confidence || 0}
          color="red"
          delay={100}
        />
        <ConfidenceBar
          label="Smoke Confidence"
          value={result.smoke_confidence || 0}
          color="amber"
          delay={200}
        />
      </div>

      {/* Location */}
      {result.city && (
        <div className="mt-4 p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 animate-slideInRight" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Location</span>
          </div>
          <div className="text-sm text-gray-300">
            {[result.city, result.region, result.country].filter(Boolean).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfidenceBar({ label, value, color, delay = 0 }) {
  const pct = (value * 100).toFixed(1);
  const barColor = color === 'red'
    ? 'bg-gradient-to-r from-red-600 to-red-400'
    : 'bg-gradient-to-r from-amber-600 to-amber-400';
  const textColor = color === 'red' ? 'text-red-400' : 'text-amber-400';
  const bgColor = color === 'red' ? 'bg-red-500/10' : 'bg-amber-500/10';
  const borderColor = color === 'red' ? 'border-red-500/20' : 'border-amber-500/20';

  return (
    <div
      className={`p-4 rounded-xl border ${bgColor} ${borderColor} animate-slideInRight`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(value * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
