import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessagingInstance } from '../config/firebase';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import api from '../api/axios';

const VAPID_KEY = 'BG8M5Xg0W4cH1fc8M8nJYduaXzUAuqeLMc09CwmWMKOzDNX349dE1k2PJ3rG8X96mb8D8hQa7bQwLAX6mly12OI';

export default function useNotifications() {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') === 'true';
  });
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [token, setToken] = useState(null);
  const messagingRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const m = await getMessagingInstance();
        messagingRef.current = m;

        if (!m) {
          console.warn('[Notifications] Messaging not available');
          return;
        }

        console.log('[Notifications] Messaging ready');

        if (enabled && permission === 'granted') {
          await _registerToken(m);
        }

        onMessage(m, (payload) => {
          console.log('[Notifications] Foreground message:', payload);
          const title = payload.notification?.title || 'Fire Alert';
          const body = payload.notification?.body || 'New fire detected nearby';
          const imageUrl = payload.notification?.image || payload.data?.file_url || null;

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notifOptions = {
              body,
              icon: '/icon.png',
              tag: 'fire-alert',
            };

            if (imageUrl && !/\.(mp4|webm|ogg|mov)(\?|$)/i.test(imageUrl)) {
              notifOptions.image = imageUrl;
            }

            const n = new Notification(title, notifOptions);

            n.onclick = () => {
              window.focus();
              window.location.href = '/map';
            };
          }
        });
      } catch (err) {
        console.error('[Notifications] Init failed:', err);
      }
    })();
  }, []);

  const _registerToken = async (m) => {
    try {
      const currentToken = await getToken(m, { vapidKey: VAPID_KEY });
      if (currentToken) {
        console.log('[Notifications] Token:', currentToken.substring(0, 30) + '...');
        setToken(currentToken);
        await api.post('/notifications/subscribe', { fcm_token: currentToken });
        console.log('[Notifications] Saved to backend');
      } else {
        console.warn('[Notifications] No token received');
      }
    } catch (err) {
      console.error('[Notifications] Token failed:', err);
    }
  };

  const toggle = useCallback(async () => {
    const m = messagingRef.current;

    if (!m) {
      const freshM = await getMessagingInstance();
      if (!freshM) {
        alert('Push notifications are not supported in this browser.');
        return;
      }
      messagingRef.current = freshM;
    }

    if (enabled) {
      setEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
      if (token && messagingRef.current) {
        try {
          await api.delete('/notifications/unsubscribe', { data: { fcm_token: token } });
          await deleteToken(messagingRef.current);
          console.log('[Notifications] Unsubscribed');
        } catch (err) {
          console.error('[Notifications] Unsubscribe failed:', err);
        }
        setToken(null);
      }
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      setEnabled(true);
      localStorage.setItem('notifications_enabled', 'true');
      await _registerToken(messagingRef.current || await getMessagingInstance());
    }
  }, [enabled, token]);

  return { enabled, permission, toggle, token };
}
