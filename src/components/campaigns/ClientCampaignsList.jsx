import { useState } from "react";
import { Download, ChevronDown, ChevronUp, Music2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { clientBudget } from "@/lib/clientPricing";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const STATUS_LABELS = {
  active: { label: "● Activa", color: "#4ade80" },
  closed: { label: "Cerrada", color: "#60a5fa" },
  cancelled: { label: "✕ Cancelada", color: "#f87171" },
};
const STATUS_FILTERS = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Activa" },
  { id: "closed", label: "Cerrada" },
  { id: "cancelled", label: "Cancelada" },
];

export default function ClientCampaignsList({ campaigns }) {
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = campaigns.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (c.name || "").toLowerCase().includes(q) || (c.artist_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleExport = () => {
    if (!campaigns.length) return;
    const wb = XLSX.utils.book_new();
    const rows = campaigns.map((c, i) => ({
      "#": i + 1, "Campaña": c.name, "Artista": c.artist_name || "", "Estado": c.status,
      "Vistas totales": c.total_views || 0, "Clips aprobados": c.approved_clips_count || 0,
      "Inicio": c.start_date || "", "Cierre": c.end_date || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Campañas");
    XLSX.writeFile(wb, `mis_campanas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (campaigns.length === 0) {
    return (
      <div className="bg-card border border-white/6 rounded-2xl p-12 text-center">
        <Music2 className="w-10 h-10 text-white/15 mx-auto mb-3" />
        <p className="text-white/35 text-[14px]">Aún no tienes campañas asignadas.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={cn("px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                statusFilter === f.id ? "bg-white/12 text-white" : "text-white/40 border border-white/8 hover:text-white/70")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/25 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="bg-white/3 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-[12px] text-white outline-none focus:border-white/25 placeholder:text-white/25 w-36" />
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 text-[12px] font-semibold text-white/70 hover:text-white hover:border-white/20">
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-card border border-white/6 rounded-2xl p-8 text-center">
          <p className="text-white/25 text-[13px]">Ninguna campaña coincide con el filtro.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(campaign => {
          const statusInfo = STATUS_LABELS[campaign.status] || STATUS_LABELS.active;
          const isOpen = expanded === campaign.id;

          return (
            <div key={campaign.id} className="bg-card border border-white/6 rounded-2xl overflow-hidden hover:border-white/10 transition-all">
              <button onClick={() => setExpanded(isOpen ? null : campaign.id)}
                className="w-full flex items-center gap-4 p-5 text-left">
                {campaign.cover_url ? (
                  <img src={campaign.cover_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0"><Music2 className="w-4 h-4 text-white/30" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="font-syne font-bold text-[15px] text-white truncate">{campaign.name}</h2>
                    <span className="text-[11px] font-medium flex-shrink-0" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                  </div>
                  <p className="text-[12px] text-white/40">{campaign.artist_name || "Sin artista"}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-[11px] text-white/40 flex-shrink-0">
                  <span>{fmt(campaign.total_views)} vistas</span>
                  <span>{campaign.approved_clips_count || 0} clips</span>
                  <span className="text-[#4ade80] font-semibold">
                    {campaign.total_views > 0 && clientBudget(campaign) ? `$${((clientBudget(campaign) / campaign.total_views) * 1000).toFixed(2)}/1k` : "—/1k"}
                  </span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-white/4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: "Vistas totales", value: fmt(campaign.total_views) },
                      { label: "Clips aprobados", value: campaign.approved_clips_count || 0 },
                      { label: "Videos planeados", value: campaign.num_videos || 0 },
                      { label: "CPM", value: campaign.total_views > 0 && clientBudget(campaign) ? `$${((clientBudget(campaign) / campaign.total_views) * 1000).toFixed(2)}` : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/3 rounded-xl p-3">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{label}</p>
                        <p className="font-syne font-bold text-[15px] text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}