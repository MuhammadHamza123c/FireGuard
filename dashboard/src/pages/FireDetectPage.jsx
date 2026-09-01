import { useState, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import ResultCards from '../components/ResultCards';
import FireAlertModal from '../components/FireAlertModal';
import Toast from '../components/Toast';
import api from '../api/axios';

export default function FireDetectPage() {
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const handleResult = (data) => {
    setResult(data);
    if (data.error) {
      setToast({ message: data.error, type: 'error' });
      return;
    }
    const isFire = data.incident_confirmed || data.fire_detected;
    if (isFire) {
      setShowModal(true);
      setToast({ message: 'Fire incident detected!', type: 'warning' });
    } else {
      setToast({ message: 'No fire or smoke detected', type: 'success' });
    }
  };

  return (
    <Layout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            AI Detection Active
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">
            Fire <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">Detection</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
            Upload an image or record a video to detect fire and smoke using real-time AI analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <FileUpload onResult={handleResult} />
            <WebcamRecorder onResult={handleResult} />
          </div>

          <div className="min-w-0">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-2 shadow-[0_30px_90px_rgba(2,6,23,0.7)] backdrop-blur-xl">
              <ResultCards result={result} />
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <FireAlertModal
          result={result}
          onClose={() => setShowModal(false)}
          onSaved={() => setToast({ message: 'Report saved successfully', type: 'success' })}
        />
      )}
    </Layout>
  );
}

function FileUpload({ onResult }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) handleFile(f);
  };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      }).catch(() => null);

      const fd = new FormData();
      fd.append('file', file);
      if (pos) {
        fd.append('latitude', pos.coords.latitude);
        fd.append('longitude', pos.coords.longitude);
      }

      const isVideo = file.type.startsWith('video/');
      const res = await api.post(isVideo ? '/video_processing' : '/image_processing', fd);
      onResult(res.data);
    } catch (err) {
      onResult({ error: err.response?.data?.detail || 'Detection failed' });
    } finally {
      setLoading(false);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
  };

  const isVideo = file?.type.startsWith('video/');

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/10">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Upload Media</h3>
          <p className="text-xs text-slate-500">Image or video file</p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-[24px] border-2 border-dashed transition-all duration-300 p-8 text-center ${
          dragOver
            ? 'border-red-400/60 bg-red-500/10 scale-[1.01]'
            : file
              ? 'border-white/10 bg-slate-900/50'
              : 'border-slate-700/60 bg-slate-900/30 hover:border-red-400/40 hover:bg-slate-900/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />

        {file ? (
          <div className="relative mx-auto inline-block max-w-full">
            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/80 p-2">
              {isVideo ? (
                <video src={preview} controls className="mx-auto max-h-64 rounded-xl object-cover" />
              ) : (
                <img src={preview} alt="Preview" className="mx-auto max-h-64 rounded-xl object-cover" />
              )}
            </div>
            <button
              onClick={clearFile}
              className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-500 hover:scale-110"
            >
              ×
            </button>
            <div className="mt-3 text-xs text-slate-400">
              {file.name} <span className="text-slate-600">·</span> {(file.size / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
              <svg className="w-9 h-9 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200">Drop your file here</p>
              <p className="mt-1 text-sm text-slate-500">or click to browse</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-600">
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">PNG</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">JPG</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">WEBP</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">MP4</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50">WEBM</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={handleDetect}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(239,68,68,0.35)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_20px_50px_rgba(239,68,68,0.45)] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {isVideo ? 'Processing video...' : 'Analyzing image...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Detect Fire
            </>
          )}
        </button>
      )}
    </div>
  );
}

function WebcamRecorder({ onResult }) {
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const countdownRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      chunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => sendVideo();
      mediaRecorderRef.current = mr;
      mr.start(100);
      setRecording(true);
      setCountdown(10);

      let sec = 10;
      countdownRef.current = setInterval(() => {
        sec--;
        setCountdown(sec);
        if (sec <= 0) {
          clearInterval(countdownRef.current);
          stopRecording();
        }
      }, 1000);
    } catch {
      onResult({ error: 'Camera access denied' });
    }
  }, []);

  const stopRecording = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const sendVideo = async () => {
    setLoading(true);
    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      }).catch(() => null);

      const fd = new FormData();
      fd.append('file', blob, 'recording.webm');
      if (pos) {
        fd.append('latitude', pos.coords.latitude);
        fd.append('longitude', pos.coords.longitude);
      }

      const res = await api.post('/video_processing', fd);
      onResult(res.data);
    } catch (err) {
      onResult({ error: err.response?.data?.detail || 'Video processing failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/10">
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Webcam Recording</h3>
          <p className="text-xs text-slate-500">10 second live capture</p>
        </div>
        <span className="ml-auto rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
          10 sec
        </span>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950">
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />

        {!recording && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/50">
                <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-300">Ready to record</p>
              <p className="text-xs text-slate-500 mt-1">Tap start for 10 second clip</p>
            </div>
          </div>
        )}

        {recording && (
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20">
              <div className="text-7xl font-bold tracking-tight text-white/90 tabular-nums drop-shadow-[0_0_30px_rgba(239,68,68,0.35)]">{countdown}</div>
            </div>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1.5 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white">REC</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80 backdrop-blur">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-1000"
                  style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                />
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative mx-auto mb-4 h-12 w-12">
                <svg className="absolute inset-0 h-12 w-12 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Processing video...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a moment</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        {!recording && !loading && (
          <button
            onClick={startRecording}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(168,85,247,0.35)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_20px_50px_rgba(168,85,247,0.45)] flex items-center justify-center gap-2.5"
          >
            <div className="h-3 w-3 rounded-full bg-white/90" />
            Start Recording
          </button>
        )}
        {recording && (
          <button
            onClick={stopRecording}
            className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center gap-2.5"
          >
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            Stop Recording ({countdown}s)
          </button>
        )}
      </div>
    </div>
  );
}
