import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
};
