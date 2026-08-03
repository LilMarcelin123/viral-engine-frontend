import { Activity, Eye, Film, BarChart3 } from "lucide-react";
import { clientBudget } from "@/lib/clientPricing";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ClientStatsRow({ campaigns }) {
  const active = campaigns.filter(c => c.status === "active").length;
  const totalViews = campaigns.reduce((a, c) => a + (c.total_views || 0), 0);
  const totalClips = campaigns.reduce((a, c) => a + (c.approved_clips_count || 0), 0);
  const totalBudget = campaigns.reduce((a, c) => a + clientBudget(c), 0);
  const cpm = totalViews > 0 ? (totalBudget / totalViews) * 1000 : 0;

  const stats = [
    { label: "Campañas activas", value: active, icon: Activity, color: "#4ade80" },
    { label: "Vistas totales", value: fmt(totalViews), icon: Eye, color: "#60a5fa" },
    { label: "Clips aprobados", value: fmt(totalClips), icon: Film, color: "#3B6FD4" },
    { label: "CPM promedio", value: totalViews > 0 ? `$${cpm.toFixed(2)}` : "—", icon: BarChart3, color: "#a78bfa" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card border border-white/6 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className="w-3.5 h-3.5" style={{ color }} />
            <p className="text-[10px] text-white/35 tracking-[0.12em] uppercase">{label}</p>
          </div>
          <p className="font-syne font-extrabold text-xl text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}