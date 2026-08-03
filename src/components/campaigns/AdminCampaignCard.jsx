import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Eye, CheckCircle, Loader2, Calculator, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/lib/alerts";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
const money = (n) => `$${(n || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;

const STATUS_MAP = {
  active: { label: "● Activa", color: "text-green-400" },
  closed: { label: "Cerrada", color: "text-blue-400" },
  completed: { label: "Cerrada", color: "text-blue-400" },
  cancelled: { label: "✕ Cancelada", color: "text-red-400" },
  draft: { label: "Borrador", color: "text-white/40" },
};

export default function AdminCampaignCard({ campaign, client, onChanged }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const statusInfo = STATUS_MAP[campaign.status] || STATUS_MAP.active;
  const paidPct = campaign.budget ? Math.min(100, ((campaign.paid || 0) / campaign.budget) * 100) : 0;

  const run = async (label, fn) => {
    setBusy(label);
    setError("");
    try { await fn(); onChanged(); }
    catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setBusy(""); }
  };

  const close = async (action) => {
    if (!(await confirmDialog(`¿${action === "close" ? "Cerrar" : "Cancelar"} la campaña "${campaign.name}"? El presupuesto no gastado regresa a saldo libre.`, { danger: action === "cancel", confirmLabel: action === "close" ? "Cerrar campaña" : "Cancelar campaña" }))) return;
    run(action, () => base44.functions.invoke("campaignAdmin", { action, campaign_id: campaign.id }));
  };

  return (
    <div className="bg-card border border-white/6 rounded-2xl p-5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {campaign.cover_url ? (
            <img src={campaign.cover_url} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0">
              <Music2 className="w-5 h-5 text-white/30" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white truncate">{campaign.name}</p>
            <p className="text-[11px] text-white/35 truncate">{campaign.artist_name || "Sin artista"} · {client?.full_name || "Sin cliente"}</p>
          </div>
        </div>
        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/8 bg-white/4 flex-shrink-0", statusInfo.color)}>
          {statusInfo.label}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Presupuesto</p>
          <p className="text-[11px] font-semibold text-white">{money(campaign.paid)} / {money(campaign.budget)} pagado</p>
        </div>
        <div className="h-1.5 rounded-full bg-white/6">
          <div className="h-full rounded-full" style={{ width: `${paidPct}%`, background: "linear-gradient(90deg,#143A8C,#3B6FD4)" }} />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-white/35 mb-4 flex-wrap">
        <span>{campaign.num_videos || 0} videos</span>
        <span>Base {money(campaign.pool_base)}</span>
        <span>A {money(campaign.sub_a)}</span>
        <span>B {money(campaign.sub_b)}</span>
        <span>C {money(campaign.sub_c)}</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(campaign.total_views)}</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />{campaign.approved_clips_count || 0} clips</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => run("compute", () => base44.functions.invoke("computePayouts", { campaign_id: campaign.id }))}
          disabled={!!busy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#3B6FD4]/15 text-[#5B8DEF] border border-[#3B6FD4]/25 hover:bg-[#3B6FD4]/25 disabled:opacity-40">
          {busy === "compute" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calculator className="w-3 h-3" />} Calcular pagos
        </button>
        {campaign.status === "active" && (
          <>
            <button onClick={() => close("close")} disabled={!!busy}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 disabled:opacity-40">
              Cerrar campaña
            </button>
            <button onClick={() => close("cancel")} disabled={!!busy}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 disabled:opacity-40">
              Cancelar
            </button>
          </>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
    </div>
  );
}