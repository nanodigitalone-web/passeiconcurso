import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { TopBar } from "./TopBar";
import { NotificationToaster } from "./NotificationToaster";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export const AppShell = ({ children }: { children: ReactNode }) => {
  useActivityTracker();
  return (
    <div className="min-h-screen bg-gradient-soft">
      <TopBar />
      <NotificationToaster />
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-0 md:px-6 md:pt-6">
        <DesktopSidebar />
        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5 md:mx-0 md:max-w-3xl md:flex-1 md:px-0 md:pb-10 md:pt-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
