import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, Link2, Music2, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import EditorAccountsSection from "./EditorAccountsSection";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const QA_BADGE = {
  pendiente: { label: "En revisión", color: "#facc15" },
  aprobado: { label: "Aprobado", color: "#4ade80" },
  rechazado: { label: "Rechazado", color: "#f87171" },
};

export default function EditorCampaignCard({ campaign, assignment, clips, onSubmit, onChanged }) {
  const [confirming, setConfirming] = useState(false);
  const strikes = assignment?.strikes || 0;
  const removed = assignment?.removed || strikes >= 3;
  const hasCuentas = (assignment?.cuentas || []).length > 0;

  const confirm = async () => {
    setConfirming(true);
    await base44.functions.invoke("editorAssignment", { action: "confirm", assignment_id: assignment.id });
    setConfirming(false);
    onChanged();
  };

  return (
    <div className={cn("bg-card border rounded-2xl p-5", removed ? "border-red-500/20 opacity-80" : "border-white/6 hover:border-white/10")}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {campaign.cover_url ? (
            <img src={campaign.cover_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0"><Music2 className="w-5 h-5 text-white/30" /></div>
          )}
          <div className="min-w-0">
            <h3 className="font-syne font-bold text-[15px] text-white truncate">{campaign.title || campaign.name}</h3>
            <p className="text-[11px] text-white/40 truncate">{campaign.artist_name}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {(campaign.target_platforms || []).map(p => (
                <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-white/6 text-white/45 uppercase">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1",
            strikes === 0 ? "text-white/40 bg-white/5" : strikes < 3 ? "text-orange-400 bg-orange-500/10" : "text-red-400 bg-red-500/10")}>
            <AlertTriangle className="w-2.5 h-2.5" /> {strikes}/3 strikes
          </span>
          {!removed && (
            <div className="flex flex-col items-end gap-1">
              <button onClick={onSubmit} disabled={!hasCuentas}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
                <Plus className="w-3.5 h-3.5" /> Subir clip
              </button>
              {!hasCuentas && <p className="text-[9px] text-orange-400/80">Registra tus cuentas primero</p>}
            </div>
          )}
        </div>
      </div>

      {removed && (
        <div className="rounded-xl px-3 py-2 mb-3 text-[11px] text-red-300/80 bg-red-500/8 border border-red-500/15">
          Saliste de esta campaña por 3 strikes: conservas tu pago base de lo ya aprobado, pero pierdes los bonos.
        </div>
      )}

      {assignment && !assignment.confirmado && !removed && (
        <button onClick={confirm} disabled={confirming}
          className="w-full flex items-center justify-center gap-2 mb-3 px-3 py-2 rounded-xl text-[12px] font-semibold text-black disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4ade80,#16a34a)" }}>
          {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Confirmar mi participación
        </button>
      )}

      {assignment && !removed && (
        <EditorAccountsSection assignment={assignment} campaign={campaign} onChanged={onChanged} />
      )}

      {campaign.description && <p className="text-[12px] text-white/45 mb-3">{campaign.description}</p>}

      {campaign.guidelines && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-3 mb-3">
          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Pautas de contenido</p>
          <p className="text-[11px] text-white/55 whitespace-pre-wrap">{campaign.guidelines}</p>
        </div>
      )}

      {(campaign.source_materials || []).length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">Material fuente</p>
          <div className="flex flex-wrap gap-1.5">
            {campaign.source_materials.map((m, i) => (
              <a key={i} href={m.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/4 border border-white/8 text-[10px] text-white/50 hover:text-white/80">
                <Link2 className="w-2.5 h-2.5" /> {m.label?.slice(0, 32) || `Material ${i + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

      {clips.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] text-white/30 uppercase tracking-widest">Mis clips ({clips.length})</p>
          {clips.map(c => {
            const badge = c.is_strike ? { label: "Strike", color: "#f87171" } : QA_BADGE[c.qa_status] || QA_BADGE.pendiente;
            return (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: badge.color }} />
                <p className="text-[12px] text-white/70 truncate flex-1">{c.title || "Clip"}</p>
                <span className="text-[10px] text-white/35">{fmt(c.total_views)} vistas{c.frozen ? " ❄" : ""}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${badge.color}18`, color: badge.color }}>{badge.label}</span>
              </div>
            );
          })}
          {clips.filter(c => c.qa_status === "rechazado" || c.is_strike).map(c => (
            (c.rejection_reason || c.strike_reason) && (
              <p key={`r-${c.id}`} className="text-[10px] text-red-300/60 pl-3">↳ {c.title || "Clip"}: {c.strike_reason || c.rejection_reason}</p>
            )
          ))}
        </div>
      )}
    </div>
  );
}