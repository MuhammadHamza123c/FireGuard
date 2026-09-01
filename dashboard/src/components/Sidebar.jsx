import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/detect',
    label: 'Fire Detect',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
  },
  {
    to: '/incidents',
    label: 'Incidents',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    to: '/map',
    label: 'Fire Map',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const [hasNearbyFire, setHasNearbyFire] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const checkNearbyFire = async () => {
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        const { latitude, longitude } = pos.coords;
        const { data } = await api.post('/nearest_fire', { latitude, longitude });
        if (data.nearest_fire) {
          setHasNearbyFire(true);
        } else {
          setHasNearbyFire(false);
        }
      } catch {
        setHasNearbyFire(false);
      }
    };

    checkNearbyFire();
    intervalRef.current = setInterval(checkNearbyFire, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleLinks = isLoggedIn ? links : links.filter((l) => l.to === '/map');

  const level = profile?.level || 'Bronze';
  const points = profile?.points || 0;
  const levelStyles = {
    Bronze: { color: 'from-amber-600 to-amber-400', text: 'text-amber-400', bar: 'from-amber-500 to-amber-300' },
    Silver: { color: 'from-slate-400 to-slate-200', text: 'text-slate-200', bar: 'from-slate-400 to-slate-200' },
    Gold: { color: 'from-yellow-500 to-amber-400', text: 'text-yellow-400', bar: 'from-yellow-500 to-amber-400' },
    Platinum: { color: 'from-violet-500 to-fuchsia-400', text: 'text-violet-300', bar: 'from-violet-500 to-fuchsia-400' },
  };
  const currentLevelStyle = levelStyles[level] || levelStyles.Bronze;
  const progress = level === 'Bronze' ? Math.min((points / 50) * 100, 100) : level === 'Silver' ? Math.min((points / 150) * 100, 100) : level === 'Gold' ? Math.min((points / 300) * 100, 100) : 100;

  return (
    <aside className="group/sidebar fixed left-0 top-0 bottom-0 z-50 w-20 overflow-hidden border-r border-white/5 bg-slate-950 backdrop-blur-2xl transition-all duration-300 hover:w-64 shadow-2xl">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950 pointer-events-none" />
      
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-red-500/40">
            <img src="/icon.png" alt="FireGuard" className="h-full w-full object-cover" />
          </div>

          <div className="overflow-hidden transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100">
            <div className="text-sm font-bold tracking-tight text-white">FireGuard</div>
            <div className="text-[10px] font-medium text-emerald-400">Live Alert</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2.5 py-4 overflow-y-auto">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `group/nav relative flex items-center gap-3 overflow-hidden rounded-lg px-2.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-500/25 via-orange-500/15 to-transparent text-white shadow-lg shadow-red-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                {link.icon}
                {link.to === '/map' && hasNearbyFire && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/60" />
                )}
              </span>
              <span className="overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/sidebar:opacity-100">
                {link.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 px-2.5 py-3 space-y-1.5">
          {isLoggedIn && (
            <>
              <div className="overflow-hidden rounded-lg bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-sm transition-all duration-300 border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 group-hover/sidebar:from-slate-800/60 group-hover/sidebar:to-slate-900/80 group-hover/sidebar:p-2.5 p-1.5">
                {/* Collapsed state - only avatar */}
                <div className="flex items-center justify-center">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${currentLevelStyle.color} text-xs font-bold text-white transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-yellow-500/40`}>
                    {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                </div>

                {/* Expanded state - full details */}
                <div className="hidden group-hover/sidebar:block mt-2.5 space-y-2">
                  <div>
                    <div className="truncate text-xs font-bold text-white">{user?.full_name || 'User'}</div>
                    <div className={`truncate text-[10px] font-medium ${currentLevelStyle.text}`}>{level}</div>
                  </div>

                  {profile && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Progress</span>
                        <span className="text-[10px] font-bold text-emerald-400">{points} pts</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/50">
                        <div className={`h-full rounded-full bg-gradient-to-r ${currentLevelStyle.bar} transition-all duration-500 shadow-lg shadow-yellow-500/30`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-r from-slate-800/30 to-slate-900/30 hover:from-red-500/20 hover:to-red-600/10 hover:border-red-500/30 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-red-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20 group-hover/sidebar:justify-start"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden group-hover/sidebar:inline whitespace-nowrap text-xs">Logout</span>
              </button>
            </>
          )}

          {!isLoggedIn && (
            <button
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-r from-slate-800/30 to-slate-900/30 hover:from-emerald-500/20 hover:to-emerald-600/10 hover:border-emerald-500/30 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-emerald-300 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 group-hover/sidebar:justify-start"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="hidden group-hover/sidebar:inline whitespace-nowrap text-xs">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
