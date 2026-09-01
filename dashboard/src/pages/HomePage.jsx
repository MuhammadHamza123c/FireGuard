import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function FireParticle({ style }) {
  const isEmber = style.type === 'ember';
  const isSmoke = style.type === 'smoke';

  if (isEmber) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          width: style.size,
          height: style.size,
          left: style.x,
          top: style.y,
          borderRadius: '50%',
          background: style.color,
          boxShadow: `0 0 ${parseInt(style.size) * 2}px ${style.color}, 0 0 ${parseInt(style.size) * 4}px ${style.color}`,
          animation: `ember-rise ${style.duration}s ease-out infinite`,
          animationDelay: `${style.delay}s`,
        }}
      />
    );
  }

  if (isSmoke) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          width: style.size,
          height: style.size,
          left: style.x,
          top: style.y,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(120,120,120,0.12) 0%, transparent 70%)`,
          filter: 'blur(8px)',
          animation: `smoke-rise ${style.duration}s ease-out infinite`,
          animationDelay: `${style.delay}s`,
        }}
      />
    );
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: style.size,
        height: parseInt(style.size) * 1.4 + 'px',
        left: style.x,
        top: style.y,
        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        background: `radial-gradient(ellipse at bottom, ${style.color} 0%, ${style.color}88 40%, transparent 70%)`,
        boxShadow: `0 0 ${parseInt(style.size)}px ${style.color}66`,
        animation: `flame-dance ${style.duration}s ease-in-out infinite`,
        animationDelay: `${style.delay}s`,
      }}
    />
  );
}

function FloatingOrb({ className }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none animate-pulse ${className}`} />;
}

const FEATURES = [
  {
    title: 'AI Fire Detection',
    desc: 'Upload an image or video and our YOLO-powered model instantly detects fire and smoke with high confidence scores.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
    ),
    gradient: 'from-red-500 to-orange-600',
    ring: 'ring-red-500/20',
    bg: 'bg-red-500/5',
  },
  {
    title: 'Live Fire Map',
    desc: 'Interactive satellite map with real-time fire markers, live WebSocket alerts, weather overlay, and OSRM routing.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    ),
    gradient: 'from-blue-500 to-cyan-500',
    ring: 'ring-blue-500/20',
    bg: 'bg-blue-500/5',
  },
  {
    title: 'Instant Alerts',
    desc: 'Every new fire report broadcasts instantly to all connected users via WebSocket — zero delay, zero misses.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    ),
    gradient: 'from-amber-500 to-yellow-500',
    ring: 'ring-amber-500/20',
    bg: 'bg-amber-500/5',
  },
  {
    title: 'Community System',
    desc: 'Report fires, earn responsibility points, and climb through Bronze, Silver, Gold, and Platinum citizen levels.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    ),
    gradient: 'from-emerald-500 to-green-500',
    ring: 'ring-emerald-500/20',
    bg: 'bg-emerald-500/5',
  },
  {
    title: 'Weather Overlay',
    desc: 'Real-time temperature, humidity, and wind data from Open-Meteo API displayed directly on the fire map.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
    ),
    gradient: 'from-violet-500 to-purple-500',
    ring: 'ring-violet-500/20',
    bg: 'bg-violet-500/5',
  },
  {
    title: 'Nearest Fire Routing',
    desc: 'Find the closest active fire within 10km and get OSRM-powered driving directions in one click.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ),
    gradient: 'from-rose-500 to-pink-500',
    ring: 'ring-rose-500/20',
    bg: 'bg-rose-500/5',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Detect',
    desc: 'Upload an image or video from any device. Our AI scans it in real-time.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ),
  },
  {
    num: '02',
    title: 'Report',
    desc: 'Add location, message, and details. Your report goes live instantly with file upload.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    ),
  },
  {
    num: '03',
    title: 'Respond',
    desc: 'All users see the fire on the live map with alerts, weather, and routing to the scene.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ),
  },
];

const STATS = [
  { value: '< 2s', label: 'Detection Speed' },
  { value: '94%+', label: 'Accuracy' },
  { value: '24/7', label: 'Monitoring' },
  { value: '10km', label: 'Search Radius' },
];

const LEVELS = [
  { name: 'Bronze', points: '0', color: 'from-amber-700 to-amber-900', ring: 'ring-amber-700/30' },
  { name: 'Silver', points: '50', color: 'from-gray-300 to-gray-500', ring: 'ring-gray-400/30' },
  { name: 'Gold', points: '150', color: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400/30' },
  { name: 'Platinum', points: '300', color: 'from-cyan-300 to-blue-400', ring: 'ring-cyan-400/30' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [particles, setParticles] = useState([]);
  const [activeFeature, setActiveFeature] = useState(0);

  const handleStartAction = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  useEffect(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#f59e0b', '#fb923c', '#fbbf24'];
    const emberColors = ['#ff6b35', '#ff4500', '#ff8c00', '#ffa500'];

    const flames = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      type: 'flame',
      x: `${10 + Math.random() * 80}%`,
      y: `${55 + Math.random() * 45}%`,
      size: `${6 + Math.random() * 10}px`,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 5 + Math.random() * 7,
      delay: Math.random() * 8,
    }));

    const embers = Array.from({ length: 12 }, (_, i) => ({
      id: 100 + i,
      type: 'ember',
      x: `${15 + Math.random() * 70}%`,
      y: `${60 + Math.random() * 40}%`,
      size: `${2 + Math.random() * 3}px`,
      color: emberColors[Math.floor(Math.random() * emberColors.length)],
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 10,
    }));

    const smokes = Array.from({ length: 6 }, (_, i) => ({
      id: 200 + i,
      type: 'smoke',
      x: `${20 + Math.random() * 60}%`,
      y: `${40 + Math.random() * 30}%`,
      size: `${30 + Math.random() * 40}px`,
      duration: 10 + Math.random() * 8,
      delay: Math.random() * 12,
    }));

    setParticles([...flames, ...embers, ...smokes]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveFeature((p) => (p + 1) % FEATURES.length), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.16),_transparent_20%),#030712] text-white overflow-hidden relative">
      <style>{`
        @keyframes flame-dance {
          0% { transform: translateY(0) translateX(0) scale(1) rotate(0deg); opacity: 0; }
          5% { opacity: 0.8; }
          25% { transform: translateY(-25vh) translateX(12px) scale(0.9) rotate(5deg); opacity: 0.7; }
          50% { transform: translateY(-50vh) translateX(-8px) scale(0.7) rotate(-3deg); opacity: 0.5; }
          75% { transform: translateY(-75vh) translateX(15px) scale(0.4) rotate(8deg); opacity: 0.2; }
          100% { transform: translateY(-105vh) translateX(-5px) scale(0.15) rotate(0deg); opacity: 0; }
        }
        @keyframes ember-rise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translateY(-40vh) translateX(20px) scale(0.8); opacity: 0.9; }
          100% { transform: translateY(-105vh) translateX(-15px) scale(0.2); opacity: 0; }
        }
        @keyframes smoke-rise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 0.15; }
          50% { transform: translateY(-35vh) translateX(-25px) scale(2.5); opacity: 0.08; }
          100% { transform: translateY(-80vh) translateX(30px) scale(4); opacity: 0; }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes hero-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .hero-glow { animation: hero-glow 4s ease-in-out infinite; }
        .grid-bg {
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-pulse 6s ease-in-out infinite;
        }
        .shimmer-btn { position: relative; overflow: hidden; }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
          animation: shimmer 3s infinite;
        }
        .nav-pill {
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .feature-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.5), rgba(5, 9, 18, 0.72));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 35%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .feature-card.is-active::before,
        .feature-card:hover::before {
          opacity: 1;
        }
        .primary-action {
          box-shadow: 0 18px 40px rgba(239, 68, 68, 0.28);
        }
        .primary-action:hover {
          box-shadow: 0 24px 54px rgba(239, 68, 68, 0.34);
        }
        .secondary-action {
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 25px rgba(15, 23, 42, 0.3);
        }
        .stats-tile {
          background: linear-gradient(180deg, rgba(2, 6, 23, 0.72), rgba(15, 23, 42, 0.5));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .cta-panel {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.38));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
      `}</style>

      {/* ── Background particles ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <FireParticle key={p.id} style={p} />
        ))}
      </div>

      {/* ── Grid background ── */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* ── Orbs ── */}
      <FloatingOrb className="w-[500px] h-[500px] bg-red-500/8 -top-40 -left-40" />
      <FloatingOrb className="w-[600px] h-[600px] bg-orange-500/5 top-1/3 -right-60" />
      <FloatingOrb className="w-[400px] h-[400px] bg-amber-500/5 bottom-0 left-1/3" />

      {/* ── Navbar ── */}
      <nav className="relative z-20 px-4 pt-5 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_18px_48px_rgba(2,6,23,0.72)] backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-[0_10px_24px_rgba(239,68,68,0.35)] ring-1 ring-white/10">
                <img src="/icon.png" alt="FireWatch" className="h-full w-full object-cover" />
              </div>
              <span className="text-lg font-bold tracking-[-0.05em] text-white">FireWatch</span>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => navigate('/map')}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:bg-white/[0.04] hover:text-white"
              >
                Live Map
              </button>
              <button
                onClick={handleStartAction}
                className="rounded-xl bg-gradient-to-r from-red-500 via-red-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(239,68,68,0.32)] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_14px_30px_rgba(239,68,68,0.38)]"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════ */}
      {/* ── HERO ── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 pt-20 md:pt-32 pb-28 md:pb-40 max-w-7xl mx-auto">
        {/* Hero glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-red-500/15 via-orange-500/8 to-transparent rounded-full blur-3xl hero-glow pointer-events-none" />

        <div className="relative text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm mb-10 shadow-[0_0_30px_rgba(239,68,68,0.08)]">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">AI-Powered Fire Detection System</span>
          </div>

          {/* Heading — elegant single flow */}
          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-extrabold leading-[1.1] tracking-tight mb-8">
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">Wildfires</span>
            <span className="text-white/90"> Detected in </span>
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">Real-Time</span>
          </h1>

          {/* Sub */}
          <p className="text-base md:text-lg text-gray-400/90 max-w-2xl mx-auto mb-12 leading-relaxed">
            Real-time fire and smoke detection powered by YOLO AI. Citizens report incidents,
            track active fires on an interactive satellite map, and help their communities stay safe.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartAction}
              className="primary-action shimmer-btn group w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold transition-all duration-300 hover:-translate-y-0.5 text-sm"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Reporting
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </span>
            </button>
            <button
              onClick={() => navigate('/map')}
              className="secondary-action w-full sm:w-auto px-10 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-bold transition-all duration-300 text-sm flex items-center justify-center gap-2.5 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              Explore Live Map
            </button>
          </div>
        </div>

        {/* Stats ticker */}
        <div className="relative mt-24 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {STATS.map((s, i) => (
              <div key={i} className="stats-tile backdrop-blur-sm px-6 py-6 text-center group hover:bg-white/[0.02] transition-colors duration-300">
                <div className="text-2xl md:text-3xl font-black text-white mb-1">{s.value}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-8 max-w-5xl">
          <div className="rounded-[28px] border border-white/[0.08] bg-slate-950/70 p-3 shadow-[0_25px_60px_rgba(2,6,23,0.6)] backdrop-blur-xl md:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">

              {/* ── Map Preview ── */}
              <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#020817]">
                {/* Satellite-style background */}
                <div className="absolute inset-0" style={{
                  background: 'radial-gradient(circle at 30% 40%, rgba(15,60,30,0.5) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(20,50,25,0.4) 0%, transparent 35%), radial-gradient(circle at 50% 50%, rgba(10,40,20,0.3) 0%, transparent 50%), #0a1a0f'
                }} />

                {/* Animated grid */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(rgba(74,222,128,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.15) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }} />

                {/* Terrain texture */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `radial-gradient(ellipse at 20% 30%, rgba(34,120,50,0.3) 0%, transparent 30%),
                    radial-gradient(ellipse at 65% 55%, rgba(30,100,40,0.25) 0%, transparent 25%),
                    radial-gradient(ellipse at 40% 70%, rgba(25,90,35,0.2) 0%, transparent 35%),
                    radial-gradient(ellipse at 80% 25%, rgba(35,110,45,0.2) 0%, transparent 20%)`
                }} />

                {/* Road network */}
                <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 300" preserveAspectRatio="none">
                  <path d="M0,150 Q100,120 200,160 T400,140" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" strokeDasharray="6,4" />
                  <path d="M50,0 Q80,100 120,200 T180,300" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="4,6" />
                  <path d="M250,0 Q280,80 300,180 T350,300" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="4,6" />
                  <path d="M0,80 Q150,60 300,100 T400,90" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="3,5" />
                </svg>

                {/* Fire markers with pulse */}
                <div className="absolute left-[22%] top-[35%]">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute -inset-2 rounded-full bg-red-500/30" />
                    <div className="relative h-3.5 w-3.5 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,1),0_0_32px_rgba(239,68,68,0.5)]" />
                  </div>
                </div>
                <div className="absolute left-[52%] top-[28%]">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-orange-500/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                    <div className="absolute -inset-2 rounded-full bg-orange-500/30" />
                    <div className="relative h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_16px_rgba(249,115,22,1),0_0_32px_rgba(249,115,22,0.5)]" />
                  </div>
                </div>
                <div className="absolute right-[20%] top-[50%]">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-amber-400/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    <div className="absolute -inset-2 rounded-full bg-amber-400/30" />
                    <div className="relative h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,1),0_0_32px_rgba(251,191,36,0.5)]" />
                  </div>
                </div>

                {/* Spread radius circles */}
                <div className="absolute left-[22%] top-[35%] -translate-x-1/2 -translate-y-1/2">
                  <div className="w-[120px] h-[120px] rounded-full border border-dashed border-red-400/30" />
                  <div className="absolute inset-4 rounded-full border border-dashed border-red-400/20" />
                </div>

                {/* Animated route line */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#22c55e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M80,220 Q120,180 160,170 Q200,160 220,130 Q240,100 260,105" fill="none" stroke="url(#routeGrad)" strokeWidth="2.5" strokeDasharray="8,5" strokeLinecap="round">
                    <animate attributeName="stroke-dashoffset" from="26" to="0" dur="1.5s" repeatCount="indefinite" />
                  </path>
                  {/* User dot */}
                  <circle cx="80" cy="220" r="5" fill="#3b82f6" stroke="white" strokeWidth="2">
                    <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="80" cy="220" r="12" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                </svg>

                {/* User location label */}
                <div className="absolute left-[14%] bottom-[18%] flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-slate-950/80 px-2.5 py-1.5 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <span className="text-[9px] font-medium text-blue-300 uppercase tracking-wider">You</span>
                </div>

                {/* Top-left badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur-sm">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white">Live Fire Map</span>
                </div>

                {/* Bottom-right stats */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <div className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur-sm text-center">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-red-400 font-medium">Active</div>
                    <div className="text-lg font-black text-white">3</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur-sm text-center">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-emerald-400 font-medium">Radius</div>
                    <div className="text-lg font-black text-white">10<span className="text-xs font-medium text-gray-400">km</span></div>
                  </div>
                </div>

                {/* Scale bar */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1 backdrop-blur-sm">
                  <div className="w-12 h-px bg-white/40" />
                  <span className="text-[8px] text-gray-400 font-medium">2km</span>
                </div>
              </div>

              {/* ── Alerts Panel ── */}
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 md:p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Active Alerts</div>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {[
                      { title: 'North Ridge', meta: 'Hotspot detected', time: '8 min ago', dist: '2.1km', status: 'DETECTED', color: 'red' },
                      { title: 'Forest Zone 3', meta: 'Smoke warning', time: '2 min ago', dist: '4.7km', status: 'IN PROGRESS', color: 'orange' },
                      { title: 'Cedar Hills', meta: 'Fire response active', time: '12 min ago', dist: '8.3km', status: 'IN PROGRESS', color: 'amber' },
                    ].map((alert, idx) => (
                      <div key={idx} className="group rounded-xl border border-white/[0.05] bg-slate-900/50 p-3 hover:border-white/[0.1] hover:bg-slate-900/70 transition-all duration-300 cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`relative mt-0.5`}>
                              <span className={`block h-2 w-2 rounded-full bg-${alert.color}-500`} />
                              {idx === 0 && <span className={`absolute inset-0 h-2 w-2 rounded-full bg-${alert.color}-500 animate-ping`} />}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white group-hover:text-red-200 transition-colors">{alert.title}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{alert.meta}</div>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${alert.status === 'DETECTED' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {alert.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.03]">
                          <span className="text-[10px] text-slate-500">{alert.time}</span>
                          <span className="text-[10px] font-medium text-slate-400">{alert.dist}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/map')}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(239,68,68,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(239,68,68,0.35)]"
                >
                  View Live Map
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── FEATURES ── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 font-medium uppercase tracking-widest mb-6">
            Features
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
            Everything You Need
          </h2>
          <p className="text-gray-400/80 max-w-lg mx-auto text-base leading-relaxed">
            A complete fire detection and emergency response platform built for communities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveFeature(i)}
              className={`feature-card group relative rounded-2xl border p-7 transition-all duration-500 cursor-default ${
                activeFeature === i
                  ? `is-active bg-white/[0.04] border-white/[0.12] shadow-xl ${f.ring} ring-1`
                  : 'bg-white/[0.015] border-white/[0.05] hover:border-white/[0.1]'
              }`}
            >
              <div className={`w-[52px] h-[52px] rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white shadow-lg shadow-black/20 mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2.5 text-white">{f.title}</h3>
              <p className="text-sm text-gray-400/80 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── HOW IT WORKS ── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-24 md:py-32 max-w-6xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 font-medium uppercase tracking-widest mb-6">
            Process
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
            How It Works
          </h2>
          <p className="text-gray-400/80 max-w-lg mx-auto text-base leading-relaxed">
            Three simple steps from detection to community-wide response.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {STEPS.map((s, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px">
                  <div className="w-full h-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/10" />
                </div>
              )}

              <div className="relative text-center px-4">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 group-hover:bg-white/[0.06] group-hover:border-white/[0.12] transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative text-gray-400 group-hover:text-white transition-colors duration-300">
                    {s.icon}
                  </div>
                </div>
                <div className="text-xs font-bold text-white/20 tracking-[0.3em] uppercase mb-3">Step {s.num}</div>
                <h3 className="text-xl font-bold mb-2.5 text-white">{s.title}</h3>
                <p className="text-sm text-gray-400/80 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── CITIZEN LEVELS ── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-24 md:py-32 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 font-medium uppercase tracking-widest mb-6">
            Responsibility
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
            Earn Your Level
          </h2>
          <p className="text-gray-400/80 max-w-lg mx-auto text-base leading-relaxed">
            Report fires and earn points. Your level reflects your commitment to community safety.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LEVELS.map((l, i) => (
            <div key={i} className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 text-center group hover:border-white/[0.12] transition-all duration-300`}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${l.gradient} mx-auto mb-4 flex items-center justify-center shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{l.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{l.points}+ points</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── CTA ── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-24 md:py-32 max-w-5xl mx-auto">
        <div className="cta-panel relative rounded-3xl border border-white/[0.06] overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-500/10 rounded-full blur-3xl" />

          <div className="relative px-8 md:px-16 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">
              Ready to Make a<br />
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Difference?
              </span>
            </h2>
            <p className="text-gray-400/80 max-w-md mx-auto mb-10 text-base leading-relaxed">
              Join citizens helping protect their communities from fire hazards. Every report counts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartAction}
                className="primary-action shimmer-btn group w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold transition-all duration-300 text-sm"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Create Free Account
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
              </button>
              <button
                onClick={() => navigate('/map')}
                className="secondary-action w-full sm:w-auto px-10 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-bold transition-all duration-300 text-sm"
              >
                Explore Map
              </button>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
