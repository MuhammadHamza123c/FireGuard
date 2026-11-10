self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const lat = data.lat || '';
  const lng = data.lng || '';
  const fireId = data.fire_id || '';
  const reporterId = data.reporter_id || '';
  const action = event.action || '';

  let urlToOpen = '/map';
  if (action === 'confirm_fire' || action === 'deny_fire') {
    const confirmFlag = action === 'confirm_fire' ? 'confirm' : 'deny';
    urlToOpen = (lat && lng)
      ? `/map?lat=${lat}&lng=${lng}&fireId=${fireId}&reporterId=${reporterId}&autoVerify=${confirmFlag}`
      : `/map?fireId=${fireId}&reporterId=${reporterId}&autoVerify=${confirmFlag}`;
  } else if (lat && lng) {
    urlToOpen = `/map?lat=${lat}&lng=${lng}&fireId=${fireId}&reporterId=${reporterId}`;
  } else if (data.url) {
    urlToOpen = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data: { lat, lng, fireId, action, reporterId } });
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