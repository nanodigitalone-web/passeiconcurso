import { useEffect, useState } from "react";
import { pushService, type PushStatus } from "@/services/pushService";
import { useAuth } from "./useAuth";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PushStatus>("loading");

  useEffect(() => {
    pushService.getStatus().then(setStatus);
  }, []);

  const toggle = async () => {
    if (!user) return;
    if (status === "granted") {
      await pushService.unsubscribe(user.id);
      setStatus("prompt");
    } else {
      const ok = await pushService.subscribe(user.id);
      setStatus(ok ? "granted" : "denied");
    }
  };

  return { status, toggle };
};
