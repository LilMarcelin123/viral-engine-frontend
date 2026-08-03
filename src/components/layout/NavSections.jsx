import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { NAV_SECTIONS, DEV_NAV } from "@/components/layout/navConfig";
import NavItem from "@/components/layout/NavItem";

export default function NavSections() {
  const { pathname } = useLocation();
  const { isAdmin, isCliente } = useUserRole();
  const role = isAdmin ? "admin" : isCliente ? "cliente" : "editor";
  const [devOpen, setDevOpen] = useState(false);

  return (
    <>
      {NAV_SECTIONS.map((section, i) => {
        const items = section.items.filter(item => !item.roles || item.roles.includes(role));
        if (items.length === 0) return null;
        return (
          <div key={i} className={i > 0 ? "pt-4" : ""}>
            {section.title && (
              <p className="px-3.5 mb-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/25">
                {section.title}
              </p>
            )}
            <div className="space-y-[2px]">
              {items.map(item => (
                <NavItem key={item.path} {...item} active={pathname === item.path} />
              ))}
            </div>
          </div>
        );
      })}

      {isAdmin && (
        <div className="pt-4 mt-2" style={{ borderTop: "1px solid rgba(31,71,161,0.08)" }}>
          <button
            onClick={() => setDevOpen(!devOpen)}
            className="flex items-center gap-3 px-3.5 py-2 w-full rounded-xl text-[10px] font-semibold tracking-[0.18em] uppercase text-white/25 hover:text-white/50 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Desarrollo</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", devOpen ? "" : "-rotate-90")} />
          </button>
          {devOpen && (
            <div className="space-y-[2px] mt-1">
              {DEV_NAV.map(item => (
                <NavItem key={item.path} {...item} active={pathname === item.path} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}