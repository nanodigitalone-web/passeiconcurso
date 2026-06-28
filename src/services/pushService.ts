import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BO7y5DEKL6n6nLquKXoTCj-Qo-2pcqrtmesZzL3qTGSsv18QGx2B0yMBwJNvqujokNQkCVDXmn_pSTkuwfpitoQ";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type PushStatus = "granted" | "denied" | "prompt" | "unsupported" | "loading";

export const pushService = {
  isSupported() {
    return (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      typeof window !== "undefined" &&
      "PushManager" in window &&
      typeof Notification !== "undefined"
    );
  },

  async getStatus(): Promise<PushStatus> {
    try {
      if (!this.isSupported() || typeof Notification === "undefined") return "unsupported";
      const perm = Notification.permission;
      if (perm === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        return sub ? "granted" : "prompt";
      }
      // Notification.permission can be "default" (never asked) — treat as prompt.
      return perm === "denied" ? "denied" : "prompt";
    } catch {
      return "unsupported";
    }
  },

  async subscribe(userId: string): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === "denied") return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON() as any;
    await supabase.from("push_subscriptions" as any).upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      } as any,
      { onConflict: "endpoint" } as any
    );

    return true;
  },

  async unsubscribe(userId: string): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await supabase
        .from("push_subscriptions" as any)
        .delete()
        .eq("endpoint", sub.endpoint);
    }
  },
};
