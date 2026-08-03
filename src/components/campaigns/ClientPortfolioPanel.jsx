import { Briefcase } from "lucide-react";

const STATUS_INFO = {
  active: { label: "Activas", color: "#4ade80" },
  closed: { label: "Cerradas", color: "#60a5fa" },
  cancelled: { label: "Canceladas", color: "#f87171" },
};

export default function ClientPortfolioPanel({ campaigns }) {
  const totalViews = campaigns.reduce((a, c) => a + (c.total_views || 0), 0);
  const totalClips = campaigns.reduce((a, c) => a + (c.approved_clips_count || 0), 0);

  return (
    <div className="bg-card border border-white/6 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-4 h-4 text-[#3B6FD4]/70" />
        <p className="text-[11px] text-white/40 tracking-[0.2em] uppercase font-medium">Portafolio</p>
      </div>

      <div className="space-y-2.5 mb-5">
        {Object.entries(STATUS_INFO).map(([key, { label, color }]) => {
          const count = campaigns.filter(c => c.status === key).length;
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                <p className="text-[12px] text-white/50">{label}</p>
              </div>
              <p className="text-[13px] font-bold text-white">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/6 pt-4 space-y-2">
        <div className="flex justify-between">
          <p className="text-[11px] text-white/35">Vistas totales</p>
          <p className="text-[12px] font-semibold text-white">{totalViews.toLocaleString("es-MX")}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-[11px] text-white/35">Clips aprobados</p>
          <p className="text-[12px] font-semibold text-white">{totalClips.toLocaleString("es-MX")}</p>
        </div>
      </div>
    </div>
  );
}