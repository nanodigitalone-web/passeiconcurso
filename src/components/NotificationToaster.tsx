import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { notificationsService } from "@/services";

// Pages where notifications must not interrupt the user mid-activity.
const QUIET_PREFIXES = ["/quiz/", "/aprender/sessao/", "/batalha/"];

// How long each toast is visible, and the gap before showing the next one.
const TOAST_DURATION = 6000;
const TOAST_GAP = 5500; // slightly less than duration so they don't overlap

export const NotificationToaster = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const queue = useRef<{ title: string; body: string }[]>([]);
  const draining = useRef(false);

  const drainQueue = () => {
    if (draining.current || queue.current.length === 0) return;
    draining.current = true;

    const next = () => {
      const item = queue.current.shift();
      if (!item) { draining.current = false; return; }
      toast(item.title, {
        description: item.body,
        icon: <Bell className="h-4 w-4" />,
        duration: TOAST_DURATION,
      });
      if (queue.current.length > 0) {
        setTimeout(next, TOAST_GAP);
      } else {
        draining.current = false;
      }
    };
    next();
  };

  useEffect(() => {
    if (!user) return;
    seen.current = new Set();
    primed.current = false;
    queue.current = [];
    draining.current = false;

    const check = async () => {
      const list = await notificationsService.listForUser(user.id);

      // First load: register all existing notifications as seen without showing toasts.
      if (!primed.current) {
        for (const n of list) seen.current.add(n.id);
        primed.current = true;
        return;
      }

      const isQuiet = QUIET_PREFIXES.some((p) => pathRef.current.startsWith(p));

      const fresh = list.filter((n) => !seen.current.has(n.id));
      for (const n of fresh) seen.current.add(n.id);

      // Suppress during active quiz/aprender/batalha sessions.
      if (isQuiet) return;

      // Add fresh notifications to the queue (oldest first).
      for (const n of fresh.slice().reverse()) {
        queue.current.push({ title: n.title, body: n.body });
      }
      drainQueue();
    };

    // Small delay on first check so the page renders before any toast appears.
    const initial = setTimeout(check, 2500);
    const unsub = notificationsService.subscribeForUser(user.id, check);
    return () => {
      clearTimeout(initial);
      unsub();
    };
  }, [user?.id]);

  return null;
};
