import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Public key is safe to expose; private key is read from secrets.
const VAPID_PUBLIC_KEY = "BO7y5DEKL6n6nLquKXoTCj-Qo-2pcqrtmesZzL3qTGSsv18QGx2B0yMBwJNvqujokNQkCVDXmn_pSTkuwfpitoQ";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

const MENSAGENS = [
  { title: "Hora de estudar! 📚", body: "Um simulado rápido mantém o conhecimento fresco. Vamos lá?" },
  { title: "Não pare agora! 💪", body: "A consistência é a chave. Faz 10 questões hoje." },
  { title: "Temos novidades para ti! 🩺", body: "Nova sessão de aprendizagem disponível. Vê o que preparámos." },
  { title: "O teu cérebro agradece 🧠", body: "Revisar de 8 em 8h melhora a retenção. Entra agora!" },
  { title: "Simulado à espera! ⏱️", body: "Tens questões por responder. Completa um simulado hoje." },
  { title: "Mantém a rotina! 🔥", body: "Pequenas doses diárias levam-te à aprovação." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
      },
    });
  }

  // Only the scheduled cron job (which carries the shared secret) may trigger
  // mass notifications. This blocks anonymous abuse / notification flooding.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: "vapid_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  webpush.setVapidDetails("mailto:suporte@passeii.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar todas as subscrições (limitado para evitar timeouts)
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth, last_notified_at")
    .limit(1000);

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, total: 0 }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Buscar last_seen dos utilizadores
  const userIds = [...new Set(subs.map((s: any) => s.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, last_seen")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.last_seen]));
  const now = Date.now();
  const INACTIVE_MS = 8 * 60 * 60 * 1000; // 8 horas

  const targets = subs.filter((sub: any) => {
    const lastSeen = profileMap.get(sub.user_id);
    const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0;
    const lastNotifiedMs = sub.last_notified_at ? new Date(sub.last_notified_at).getTime() : 0;
    const isInactive = now - lastSeenMs > INACTIVE_MS;
    const notRecentlyNotified = now - lastNotifiedMs > INACTIVE_MS;
    return isInactive && notRecentlyNotified;
  });

  let sent = 0;
  const failures: any[] = [];

  for (const sub of targets) {
    const msg = MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)];
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title: msg.title, body: msg.body, url: "/", tag: "passei-reminder" })
      );
      await supabase
        .from("push_subscriptions")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", sub.id);
      sent++;
    } catch (e: any) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        // Subscrição expirada — remover
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        failures.push({ endpoint: sub.endpoint.slice(0, 60), error: e.message });
      }
    }
  }

  return new Response(JSON.stringify({ sent, total: targets.length, failures: failures.slice(0, 10) }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
