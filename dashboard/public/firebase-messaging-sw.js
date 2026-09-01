importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDKvtl9u7CM36FxAxRRpFtLP7LsYVsC4D4",
  authDomain: "fireguard-notifications.firebaseapp.com",
  projectId: "fireguard-notifications",
  storageBucket: "fireguard-notifications.firebasestorage.app",
  messagingSenderId: "892653942568",
  appId: "1:892653942568:web:1c142342e3a8a3c6aa421d",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Fire Alert';
  const imageUrl = payload.notification?.image || payload.data?.file_url || null;
  const fireId = payload.data?.fire_id || '';
  const isVideo = imageUrl && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(imageUrl);

  const options = {
    body: payload.notification?.body || 'New fire detected nearby',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'fire-alert-' + fireId,
    renotify: true,
    data: payload.data || {},
  };

  if (imageUrl && !isVideo) {
    options.image = imageUrl;
  }

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const lat = data.lat || '';
  const lng = data.lng || '';
  const fireId = data.fire_id || '';
  const urlToOpen = (lat && lng) ? `/map?lat=${lat}&lng=${lng}&fireId=${fireId}` : (data.url || '/map');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data: { lat, lng, fireId } });
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
