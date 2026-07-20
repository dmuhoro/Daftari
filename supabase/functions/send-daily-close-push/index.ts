// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all push subscriptions
  const { data: subscriptions, error: subErr } = await supabase
    .from('daftari_push_subscriptions')
    .select('*');

  if (subErr) {
    console.error('Failed to fetch subscriptions:', subErr);
    return new Response('Error', { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response('No subscriptions', { status: 200 });
  }

  // Get users who recorded transactions today but haven't closed
  const today = new Date().toISOString().slice(0, 10);
  const { data: recentUsers } = await supabase
    .from('daftari_transactions')
    .select('user_id')
    .gte('recorded_at', today);

  const activeUserIds = new Set((recentUsers || []).map((t: any) => t.user_id));

  let sent = 0;
  for (const sub of subscriptions || []) {
    if (!activeUserIds.has(sub.user_id)) continue;

    try {
      const subscription = JSON.parse(sub.subscription);
      const { webpush } = await import('https://esm.sh/web-push@3.6.7');
      webpush.setVapidDetails(
        'mailto:admin@daftari.app',
        Deno.env.get('VAPID_PUBLIC_KEY')!,
        vapidPrivateKey,
      );
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'Daftari — Funga Siku',
        body: 'Rekodi ya leo iko tayari. Angalia faida yako.',
        icon: '/pwa-192x192.svg',
        data: { url: '/' },
      }));
      sent++;
    } catch { /* subscription may be expired */ }
  }

  console.log(`Sent ${sent} push notifications`);
  return new Response(`Sent ${sent} notifications`, { status: 200 });
});
