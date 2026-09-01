import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password, fullName);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] px-4 py-10 text-white">
      <div className="auth-bg" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="auth-panel hidden rounded-[32px] border border-white/10 bg-white/4 p-8 shadow-2xl shadow-red-500/10 backdrop-blur-xl lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 shadow-lg shadow-red-500/20">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-red-300/80">Emergency AI</div>
              <h1 className="text-2xl font-bold text-white">FireGuard</h1>
            </div>
          </div>

          <div className="mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-200">
              Live detection network
            </div>
            <h2 className="max-w-md text-4xl font-black leading-tight text-white">
              Respond faster to wildfire threats.
            </h2>
            <p className="max-w-lg text-base leading-7 text-slate-300">
              Monitor active fires, assess spread risks, and coordinate emergency response with real-time intelligence built for rapid action.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-2xl font-black text-white">2.4s</div>
              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">Detection</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-2xl font-black text-white">94%</div>
              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">Accuracy</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-2xl font-black text-white">24/7</div>
              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">Monitoring</div>
            </div>
          </div>
        </div>

        <div className="auth-card relative rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 shadow-lg shadow-red-500/25">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black tracking-tight text-white">{isSignup ? 'Create account' : 'Welcome back'}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {isSignup ? 'Join the wildfire response network.' : 'Sign in to continue monitoring alerts.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-fadeInUp">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 transition-all focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 transition-all focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 transition-all focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {!isSignup && (
              <div className="flex items-center justify-between text-sm text-slate-400">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-red-500 focus:ring-red-500/30" />
                  Remember me
                </label>
                <button type="button" className="text-red-300 transition hover:text-red-200">Forgot password?</button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10">{loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="font-semibold text-red-300 transition hover:text-red-200"
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
