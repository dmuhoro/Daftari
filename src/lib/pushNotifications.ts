import { logger } from './logger';
import { upsertPushSubscription, deletePushSubscription } from './repository';

export type PushStatus =
  | 'unsupported'  // no Push API in this browser
  | 'unconfigured' // app built without VAPID key — cannot subscribe
  | 'granted'      // permission granted, subscription active
  | 'denied'       // permission denied by the user
  | 'not-subscribed' // permission granted but no active subscription

export async function getPushStatus(): Promise<PushStatus> {
  if (!('Notification' in window)) return 'unsupported';

  if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
    // VAPID not configured in this build — failing closed beats a broken prompt.
    return 'unconfigured';
  }

  const permission = Notification.permission;
  if (permission === 'denied') return 'denied';

  if (permission === 'granted' && 'serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription ? 'granted' : 'not-subscribed';
    } catch {
      return 'granted';
    }
  }

  return 'not-subscribed';
}

export async function getPushSubscriptionEndpoint(): Promise<string | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription?.endpoint ?? null;
  } catch {
    return null;
  }
}

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

    const { supabase } = await import('./supabase');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const result = await upsertPushSubscription(user.id, subscription);
      if (!result.ok) throw new Error(result.error.message);
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
      const { supabase } = await import('./supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await deletePushSubscription(user.id);
      }
    }
  } catch { logger.warn('push:unsubscribe_failed') }
}
