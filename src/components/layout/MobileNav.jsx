import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { LogOut } from "lucide-react";
import NavSections from "@/components/layout/NavSections";

export default function MobileNav() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <>
      {/* Hamburger button — fixed top-left */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-40 md:hidden flex items-center justify-center w-10 h-10 rounded-xl"
        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(31,71,161,0.2)", backdropFilter: "blur(12px)" }}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-white/80" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 md:hidden flex flex-col w-72 transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "#ffffff",
          borderRight: "1px solid rgba(31,71,161,0.14)",
          boxShadow: open ? "4px 0 32px rgba(31,71,161,0.15)" : "none",
        }}
      >
        <div className="gold-line absolute top-0 left-0 right-0" />

        {/* Header / Logo */}
        <div className="px-5 py-5 relative flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid rgba(31,71,161,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <img
                src="https://media.base44.com/images/public/6a0bd34b4fc5b54f8e415509/07af3462b_icon.png"
                alt="Dan Creative Studio"
                className="w-10 h-10 rounded-full relative z-10 object-cover" />
            </div>
            <h1 className="font-syne font-extrabold text-[14px] tracking-[0.04em] uppercase leading-tight"
              style={{
                background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 45%, #3B6FD4 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
              Dan Creative<br />Studio
            </h1>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/80 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav — grouped sections, scrollable */}
        <nav className="flex-1 px-3 py-4 relative overflow-y-auto">
          <NavSections />
        </nav>

        {/* Footer — logged-in user */}
        {user && (
          <div className="p-3 relative flex-shrink-0" style={{ borderTop: "1px solid rgba(31,71,161,0.08)" }}>
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl"
              style={{ background: "rgba(31,71,161,0.05)", border: "1px solid rgba(31,71,161,0.1)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-black flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #3B6FD4, #1F47A1)" }}>
                {(user.display_name || user.full_name || user.email || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <p className="text-[12px] font-semibold text-white/80 truncate">{user.display_name || user.full_name || "Sin nombre"}</p>
                <p className="text-[10px] text-white/30 truncate capitalize">{user.user_type || user.role || "usuario"}</p>
              </div>
              <button onClick={() => logout()} title="Cerrar sesión"
                className="p-1.5 rounded-lg flex-shrink-0 transition-colors hover:bg-red-50"
                style={{ color: "rgba(220,38,38,0.7)" }}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}