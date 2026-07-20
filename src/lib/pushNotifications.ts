import { supabase } from './supabase';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    // Store subscription in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('daftari_push_subscriptions').upsert({
        user_id: user.id,
        subscription: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    return subscription;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('daftari_push_subscriptions').delete().eq('user_id', user.id);
      }
    }
  } catch { /* ignore */ }
}
