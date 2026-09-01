import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDKvtl9u7CM36FxAxRRpFtLP7LsYVsC4D4",
  authDomain: "fireguard-notifications.firebaseapp.com",
  projectId: "fireguard-notifications",
  storageBucket: "fireguard-notifications.firebasestorage.app",
  messagingSenderId: "892653942568",
  appId: "1:892653942568:web:1c142342e3a8a3c6aa421d",
};

const firebaseApp = initializeApp(firebaseConfig);

let _messaging = null;
let _messagingReady = null;

async function _init() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const supported = await isSupported();
    if (supported) {
      _messaging = getMessaging(firebaseApp);
      console.log('[Firebase] Messaging initialized successfully');
    } else {
      console.warn('[Firebase] Messaging not supported in this browser');
    }
  } catch (err) {
    console.error('[Firebase] Failed to init messaging:', err);
  }
}

_messagingReady = _init();

export async function getMessagingInstance() {
  await _messagingReady;
  return _messaging;
}

export default firebaseApp;
