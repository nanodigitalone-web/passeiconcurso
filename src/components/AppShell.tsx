import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
};
