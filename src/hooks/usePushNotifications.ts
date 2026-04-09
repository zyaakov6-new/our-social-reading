import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ??
  'BBu5lR72P2GEB8K0qDtgo-h2EHVHAiemxoYHMPniiOeI2ODlyxlkVtiMOTAYfYaxRz71h5oYZNFbdgWiNF0ZRqU';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export type PushPermission = 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission as PushPermission);
  }, []);

  const subscribe = async (): Promise<boolean> => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      trackEvent("push_permission_response", { result: perm });
      if (perm !== 'granted') return false;

      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      const { error } = await (supabase as any).from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: subJson.keys?.p256dh ?? '',
        auth: subJson.keys?.auth ?? '',
      }, { onConflict: 'user_id' });

      if (error) {
        toast.error('שגיאה בשמירת ההרשמה: ' + error.message);
        return false;
      }

      setSubscribed(true);
      localStorage.setItem('push-subscribed', '1');
      trackEvent("push_subscribed");
      return true;
    } catch (e: any) {
      toast.error('שגיאה בהפעלת התזכורות: ' + (e?.message ?? String(e)));
      return false;
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await (supabase as any).from('push_subscriptions').delete().eq('user_id', user.id);
    setSubscribed(false);
    localStorage.removeItem('push-subscribed');
  };

  return {
    supported: 'Notification' in window && 'serviceWorker' in navigator,
    permission,
    subscribed: subscribed || localStorage.getItem('push-subscribed') === '1',
    subscribe,
    unsubscribe,
  };
}
