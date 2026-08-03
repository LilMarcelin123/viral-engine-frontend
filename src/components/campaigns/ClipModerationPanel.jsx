import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react";

export default function ClipModerationPanel({ clips, users, campaigns, onDone }) {
  const [assignments, setAssignments] = useState([]);
  const [action, setAction] = useState(null); // { clipId, type }
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.EditorAssignment.list(null, 500).then(setAssignments).catch(() => {});
  }, [clips.length]);

  const strikesOf = (clip) => assignments.find(a => a.campaign_id === clip.campaign_id && a.editor_id === clip.editor_id)?.strikes || 0;
  const editorName = (id) => users.find(u => u.id === id)?.full_name || users.find(u => u.id === id)?.email || "Editor";
  const campName = (id) => campaigns.find(c => c.id === id)?.name || "Campaña";

  const execute = async (clipId, type, motivo = "") => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("qaClip", { clip_id: clipId, action: type, reason: motivo });
      setAction(null);
      setReason("");
      onDone();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  if (clips.length === 0) return (
    <div className="text-center py-16">
      <CheckCircle className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
      <p className="text-white/30 text-sm">No hay clips pendientes de revisión.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {error && <p className="text-[12px] text-red-400">{error}</p>}
      {clips.map(clip => {
        const strikes = strikesOf(clip);
        const pending = action?.clipId === clip.id;
        return (
          <div key={clip.id} className="bg-card border border-white/6 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white">{clip.title || "Clip sin título"}</p>
                <p className="text-[11px] text-white/35">
                  {editorName(clip.editor_id)} · {campName(clip.campaign_id)} · Strikes: <span className={strikes >= 2 ? "text-red-400 font-bold" : ""}>{strikes}/3</span>
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(clip.publications || []).map((p, i) => (
                    <a key={i} href={p.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/4 border border-white/8 text-[10px] text-white/50 hover:text-white/80">
                      {p.platform || "link"}{p.account ? ` · ${p.account}` : ""} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => execute(clip.id, "approve")} disabled={busy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 disabled:opacity-40">
                  <CheckCircle className="w-3 h-3" /> Aprobar
                </button>
                <button onClick={() => { setAction({ clipId: clip.id, type: "reject" }); setReason(""); }} disabled={busy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/15 hover:bg-orange-500/20 disabled:opacity-40">
                  <XCircle className="w-3 h-3" /> Rechazar
                </button>
                <button onClick={() => { setAction({ clipId: clip.id, type: "strike" }); setReason(""); }} disabled={busy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 disabled:opacity-40">
                  <AlertTriangle className="w-3 h-3" /> Strike
                </button>
              </div>
            </div>
            {pending && (
              <div className="flex gap-2 mt-3 items-center">
                <input autoFocus value={reason} onChange={e => setReason(e.target.value)}
                  placeholder={action.type === "strike" ? "Motivo del strike (obligatorio, se notifica al editor)" : "Motivo del rechazo"}
                  className="flex-1 bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-white/25 placeholder:text-white/25" />
                <button onClick={() => execute(clip.id, action.type, reason)}
                  disabled={busy || (action.type === "strike" && !reason.trim())}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-black disabled:opacity-40"
                  style={{ background: action.type === "strike" ? "linear-gradient(135deg,#f87171,#dc2626)" : "linear-gradient(135deg,#fb923c,#ea580c)" }}>
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Confirmar
                </button>
                <button onClick={() => setAction(null)} className="text-[12px] text-white/40 hover:text-white/70 px-2">Cancelar</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}