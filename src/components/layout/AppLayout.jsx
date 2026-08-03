import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f6f8fd" }}>
      {/* ── Animated background ── */}
      <div className="bg-animated" aria-hidden="true">
        <div className="bg-orb-1" />
        <div className="bg-orb-2" />
        <div className="bg-orb-3" />
        <div className="bg-scanlines" />
      </div>

      {/* Sidebar solo en desktop */}
      <div className="hidden md:flex relative z-10">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>

      {/* Drawer lateral solo en móvil */}
      <MobileNav />
    </div>
  );
}