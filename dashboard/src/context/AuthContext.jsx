import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : null;
  });

  const refreshTimerRef = useRef(null);

  const doRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
      const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token: newRefresh, expires_in } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', newRefresh);
      setToken(access_token);
      scheduleRefresh(expires_in);
      return true;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      setToken(null);
      setUser(null);
      setProfile(null);
      return false;
    }
  }, []);

  const scheduleRefresh = useCallback((expiresIn) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const refreshAt = (expiresIn - 300) * 1000;
    refreshTimerRef.current = setTimeout(() => { doRefresh(); }, Math.max(refreshAt, 10000));
  }, [doRefresh]);

  useEffect(() => {
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, []);

  useEffect(() => {
    if (token) {
      const expiresAt = localStorage.getItem('expires_at');
      if (expiresAt) {
        const remaining = parseInt(expiresAt) - Date.now();
        if (remaining > 0) {
          scheduleRefresh(remaining / 1000);
        } else {
          doRefresh();
        }
      }
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      const data = res.data.profile;
      localStorage.setItem('profile', JSON.stringify(data));
      setProfile(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token: refreshToken, expires_in, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('expires_at', String(Date.now() + expires_in * 1000));
    setToken(access_token);
    setUser(userData);
    scheduleRefresh(expires_in);
    return userData;
  };

  const signup = async (email, password, full_name) => {
    const res = await api.post('/auth/signup', { email, password, full_name });
    const { access_token, refresh_token: refreshToken, expires_in, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('expires_at', String(Date.now() + expires_in * 1000));
    setToken(access_token);
    setUser(userData);
    scheduleRefresh(expires_in);
    return userData;
  };

  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    localStorage.removeItem('expires_at');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, profile, fetchProfile, login, signup, logout, doRefresh, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
