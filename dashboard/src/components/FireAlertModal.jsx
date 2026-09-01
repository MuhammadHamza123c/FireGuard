import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function FireAlertModal({ result, onClose, onSaved }) {
  const { fetchProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const recordingWaves = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    height: 4 + (i * 7 + 13) % 20,
    delay: i * 0.08,
    duration: 0.4 + (i % 5) * 0.1,
  })), []);

  const audioWaves = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    height: 4 + (i * 11 + 7) % 24,
  })), []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = mr;
      mr.start(100);
      setRecording(true);
      setRecordTime(0);

      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch {
      // silent
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setRecording(false);
  }, []);

  const removeAudio = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setPlaying(false);
  };

  const togglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (playing) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const canSave = message.trim() || audioBlob;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      }).catch(() => null);

      let finalAudioUrl = null;
      if (audioBlob) {
        const fd = new FormData();
        fd.append('file', audioBlob, 'voice_note.webm');
        const uploadRes = await api.post('/upload_audio', fd);
        finalAudioUrl = uploadRes.data.audio_url || null;
      }

      await api.post('/fire_alert', {
        incident_type: result.incident_type || result.status || 'FIRE DETECTED',
        fire_confidence: result.fire_confidence || 0,
        smoke_confidence: result.smoke_confidence || 0,
        latitude: pos?.coords.latitude || result.latitude || null,
        longitude: pos?.coords.longitude || result.longitude || null,
        city: result.city || null,
        region: result.region || null,
        country: result.country || null,
        source: result.frames_processed ? 'video' : 'image',
        file_url: result.file_url || result.output_video || null,
        audio_url: finalAudioUrl,
        message: message.trim() || (finalAudioUrl ? 'Voice report' : ''),
      });

      setSaved(true);
      fetchProfile();
      onSaved?.();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (!result) return null;
  const isFire = result.incident_confirmed || result.fire_detected;
  if (!isFire) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="glass rounded-2xl w-full max-w-md p-5 relative z-10 animate-fadeInUp max-h-[85vh] overflow-y-auto">
        {saved ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Report Saved</h3>
            <p className="text-gray-400 mb-6">Your fire incident report has been submitted.</p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition-all">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulseGlow">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Fire Detected</h3>
                  <p className="text-xs text-gray-400">Immediate action required</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Type</span>
                <span className="text-white font-medium">{result.incident_type || 'FIRE DETECTED'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fire Confidence</span>
                <span className="text-red-400 font-medium">{((result.fire_confidence || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Smoke Confidence</span>
                <span className="text-amber-400 font-medium">{((result.smoke_confidence || 0) * 100).toFixed(1)}%</span>
              </div>
              {result.city && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white font-medium">{[result.city, result.region].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Help Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="Describe the situation..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-700/50" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-700/50" />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Voice Note</label>
              {!audioUrl && !recording && (
                <button
                  onClick={startRecording}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-dashed border-gray-600 bg-gray-900/30 px-4 py-4 text-sm font-medium text-gray-400 hover:border-red-500/40 hover:text-red-300 hover:bg-red-500/5 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Tap to Record Voice
                </button>
              )}

              {recording && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                      </span>
                      <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Recording</span>
                    </div>
                    <span className="text-sm font-mono text-red-300">{formatTime(recordTime)}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-3 h-6">
                    {recordingWaves.map((w, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-red-500/60 animate-pulse"
                        style={{
                          height: `${w.height}px`,
                          animationDelay: `${w.delay}s`,
                          animationDuration: `${w.duration}s`,
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={stopRecording}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition-all"
                  >
                    <div className="h-3 w-3 rounded-sm bg-red-500" />
                    Stop
                  </button>
                </div>
              )}

              {audioUrl && !recording && (
                <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-300">Voice Note</span>
                    </div>
                    <button onClick={removeAudio} className="text-gray-500 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <audio
                    ref={audioPlayerRef}
                    src={audioUrl}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                    >
                      {playing ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                      ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="h-8 flex items-center gap-[3px]">
                        {audioWaves.map((w, i) => (
                          <div key={i} className="w-1 rounded-full bg-emerald-500/40" style={{ height: `${w.height}px` }} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 shrink-0">{formatTime(recordTime)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
