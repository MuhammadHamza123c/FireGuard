import { useState, useEffect, useRef, useCallback } from 'react';

const RECONNECT_DELAY = 3000;

export default function useLiveAlerts() {
  const [liveFires, setLiveFires] = useState([]);
  const [connected, setConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const wsBase = baseUrl.replace(/^http/, 'ws');
    const WS_URL = `${wsBase}/ws/live-alerts`;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!unmountedRef.current) setConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'new_fire' && msg.fire) {
          setLastAlert(msg.fire);
          setLiveFires((prev) => {
            if (prev.some((f) => f.id === msg.fire.id)) return prev;
            return [...prev, msg.fire];
          });
        }
      } catch {}
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      setConnected(false);
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        connect();
      }, RECONNECT_DELAY);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [connect]);

  const removeFire = useCallback((id) => {
    setLiveFires((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { liveFires, connected, lastAlert, removeFire };
}
