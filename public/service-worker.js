self.addEventListener('push', event => {
  const data = event.data.json();
  const { title, body, icon } = data;

  const options = {
    body: body,
    icon: icon || '/logo.png', // Default icon if none is provided
    badge: '/badge.png' // A small icon for the notification bar
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
