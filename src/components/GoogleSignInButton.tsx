// Renders the official Google Identity Services button. On success it exchanges
// the Google ID token for our own JWT via authService.signInWithGoogleToken.
// Renders nothing when VITE_GOOGLE_CLIENT_ID is not configured.
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { authService } from "@/services";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GIS_SRC = "https://accounts.google.com/gsi/client";

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gis_load_failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("gis_load_failed"));
    document.head.appendChild(s);
  });
}

export function GoogleSignInButton({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest onSuccess without re-initializing GIS on every render.
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (resp: { credential?: string }) => {
            if (!resp.credential) return;
            const r = await authService.signInWithGoogleToken(resp.credential);
            if (r.error) {
              toast.error("Não foi possível entrar com o Google. Tente novamente.");
              return;
            }
            await onSuccessRef.current();
          },
        });
        google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
        });
      })
      .catch(() => {
        /* GIS failed to load (e.g. offline) — silently hide the button. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!CLIENT_ID) return null;
  return <div ref={containerRef} className="flex justify-center" />;
}
