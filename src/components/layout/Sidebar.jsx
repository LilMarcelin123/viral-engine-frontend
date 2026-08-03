import { useAuth } from "@/lib/AuthContext";
import { LogOut } from "lucide-react";
import NavSections from "@/components/layout/NavSections";

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 h-screen sticky top-0 flex flex-col relative"
      style={{
        background: "#ffffff",
        borderRight: "1px solid rgba(31,71,161,0.14)",
      }}>

      {/* Gold top accent line */}
      <div className="gold-line absolute top-0 left-0 right-0" />

      {/* Inner subtle grain */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.5,
        }} />

      {/* Logo */}
      <div className="px-5 py-5 relative flex-shrink-0" style={{ borderBottom: "1px solid rgba(31,71,161,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(31,71,161,0.15) 0%, transparent 70%)" }} />
            <img
              src="https://media.base44.com/images/public/6a0bd34b4fc5b54f8e415509/07af3462b_icon.png"
              alt="Dan Creative Studio"
              className="w-10 h-10 rounded-full relative z-10 object-cover"
              style={{ filter: "drop-shadow(0 0 6px rgba(31,71,161,0.5))" }} />
          </div>
          <div>
            <h1 className="font-syne font-extrabold text-[15px] tracking-[0.04em] uppercase leading-tight"
              style={{
                background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 45%, #3B6FD4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
              Dan Creative<br />Studio
            </h1>
            <p className="text-[9px] mt-1 tracking-[0.22em] uppercase font-medium"
              style={{ color: "rgba(31,71,161,0.45)" }}>
              Creative Studio
            </p>
          </div>
        </div>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 px-3 py-4 relative overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(31,71,161,0.25) transparent" }}>
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
  );
}