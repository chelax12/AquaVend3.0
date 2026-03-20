/**
 * Converts a VAPID public key from a URL-safe base64 string to a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function enableWebPush(supabase: any, userId: string, unitId: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported on this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`);
  const existing = await registration.pushManager.getSubscription();

  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY
      ),
    }));

  const json = subscription.toJSON();

  const endpoint = json.endpoint!;
  const p256dh = json.keys?.p256dh!;
  const auth = json.keys?.auth!;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      unit_id: unitId,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) throw error;

  return subscription;
}
