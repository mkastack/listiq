import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "../components/dashboard/Sidebar";
import { TopNav } from "../components/dashboard/TopNav";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20 font-body-base text-foreground">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="lg:ml-[260px] flex-1 flex flex-col min-h-screen w-full">
        <TopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 w-full max-w-[100vw] lg:max-w-[calc(100vw-260px)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
