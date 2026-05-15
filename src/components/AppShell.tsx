import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { NotificationToaster } from "./NotificationToaster";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export const AppShell = ({ children }: { children: ReactNode }) => {
  useActivityTracker();
  return (
    <div className="min-h-screen bg-gradient-soft">
      <TopBar />
      <NotificationToaster />
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
};
