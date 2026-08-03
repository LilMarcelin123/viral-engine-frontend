import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import StrikeModal from "@/components/editors/StrikeModal";

const fmt = (n) => (n || 0) >= 1000000 ? `${((n || 0) / 1000000).toFixed(1)}M` : (n || 0) >= 1000 ? `${((n || 0) / 1000).toFixed(0)}K` : `${n || 0}`;

const STATUS = {
  pendiente: { label: "Subido", cls: "bg-secondary text-secondary-foreground" },
  en_revision: { label: "En revisión", cls: "bg-amber-100 text-amber-700" },
  aprobado: { label: "Aprobado", cls: "bg-green-100 text-green-700" },
  rechazado: { label: "No aprobado", cls: "bg-red-100 text-red-700" },
};

export default function EditorClipRow({ clip, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [showStrike, setShowStrike] = useState(false);

  const url = clip.publications?.[0]?.url;
  const status = clip.is_strike
    ? { label: "Strike", cls: "bg-red-600 text-white" }
    : STATUS[clip.qa_status] || STATUS.pendiente;

  const approve = async () => {
    setBusy(true);
    await base44.functions.invoke("qaClip", { clip_id: clip.id, action: "approve" });
    setBusy(false);
    onChanged();
  };

  return (
    <div className="flex items-center gap-3 p-3.5 flex-wrap">
      <div className="flex-1 min-w-[180px]">
        <p className="text-[13px] font-medium text-foreground truncate">{clip.title || "Clip sin título"}</p>
        <p className="text-[11px] text-muted-foreground">{fmt(clip.total_views)} vistas{clip.is_strike && clip.strike_reason ? ` · Motivo: ${clip.strike_reason}` : ""}</p>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70">
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
      {!clip.is_strike && (
        <div className="flex gap-2">
          {clip.qa_status !== "aprobado" && (
            <Button size="sm" variant="outline" onClick={approve} disabled={busy} className="gap-1 h-7 text-[11px]">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Aprobar
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowStrike(true)} disabled={busy}
            className="gap-1 h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50">
            <AlertTriangle className="w-3 h-3" /> Strike
          </Button>
        </div>
      )}
      <StrikeModal open={showStrike} onClose={() => setShowStrike(false)} clip={clip} onDone={onChanged} />
    </div>
  );
}