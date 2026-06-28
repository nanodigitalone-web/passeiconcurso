// pushService — Web Push subscription management (backend API).

import { api } from "@/lib/api";

let cachedKey: string | null = null;

async function getVapidKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  const r = await api.get<{ key: string }>("/push/key");
  cachedKey = r.key || "";
  return cachedKey;
}

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
      return perm === "denied" ? "denied" : "prompt";
    } catch {
      return "unsupported";
    }
  },

  async subscribe(_userId: string): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === "denied") return false;

    const key = await getVapidKey();
    if (!key) return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    const json = sub.toJSON() as any;
    await api.post("/push/subscribe", {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });

    return true;
  },

  async unsubscribe(_userId: string): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await api.post("/push/unsubscribe", { endpoint });
    }
  },
};
