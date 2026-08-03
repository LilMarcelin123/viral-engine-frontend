import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function NavItem({ path, icon: Icon, label, active }) {
  return (
    <Link to={path}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-200 cursor-pointer relative overflow-hidden group",
        active ? "text-black" : "text-white/40 hover:text-white/85"
      )}
      style={active ? {
        background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 50%, #143A8C 100%)",
        boxShadow: "0 2px 16px rgba(31,71,161,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      } : {}}
    >
      {!active && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
          style={{ background: "rgba(31,71,161,0.05)", border: "1px solid rgba(31,71,161,0.08)" }} />
      )}
      <Icon className={cn("w-4 h-4 flex-shrink-0 relative z-10", active ? "text-black" : "")} />
      <span className="tracking-wide relative z-10">{label}</span>
      {active && (
        <div className="absolute right-2.5 w-1 h-1 rounded-full z-10" style={{ background: "rgba(255,255,255,0.7)" }} />
      )}
    </Link>
  );
}