import { useState } from "react";
import { Eye, Heart, Video, ExternalLink, Download } from "lucide-react";

const fmt = (n) => (n || 0) >= 1000000 ? `${((n || 0) / 1000000).toFixed(1)}M` : (n || 0) >= 1000 ? `${((n || 0) / 1000).toFixed(1)}K` : `${n || 0}`;

const STATUS = {
  approved: { label: "Aprobado", color: "#34d399" },
  pending: { label: "Pendiente", color: "#fbbf24" },
  rejected: { label: "No aprobado", color: "#f87171" },
};

export default function CampaignVideosSection({ videos, metrics, campaignName }) {
  const [filter, setFilter] = useState("all");
  const showQA = metrics.pending_videos != null; // el cliente no ve datos de QA ni filtra por editor

  // Admin filtra por editor; cliente filtra por cuenta (de todas las publicaciones)
  const editors = [...new Map(videos.map(v => [v.editor_id, v.editor_name])).entries()];
  const accounts = [...new Set(videos.flatMap(v => (v.publications || []).map(p => p.account).filter(Boolean)))];
  const shown = (filter === "all"
    ? videos
    : showQA
      ? videos.filter(v => v.editor_id === filter)
      : videos.filter(v => (v.publications || []).some(p => p.account === filter)))
    .slice().sort((a, b) => (b.views || 0) - (a.views || 0));

  const download = () => {
    const header = ["Editor", "Título", "Tags", "Link", "Vistas", "Likes"];
    if (showQA) header.push("Estatus");
    const rows = [
      header,
      ...shown.map(v => {
        const row = [v.editor_name || "", v.title || "", (v.tags || []).join(" "), v.tiktok_url || "", v.views || 0, v.likes || 0];
        if (showQA) row.push(STATUS[v.status]?.label || v.status);
        return row;
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${(campaignName || "campana").replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-white/35" />
          <h3 className="font-syne font-bold text-white text-[14px]">
            Videos ({shown.length}){showQA ? ` — ${metrics.approved_videos} aprobados · ${metrics.pending_videos} pendientes · ${metrics.rejected_videos} rechazados` : ""}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-[12px] text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(31,71,161,0.2)" }}>
            <option value="all" style={{ background: "#0a0912" }}>{showQA ? "Todos los editores" : "Todas las cuentas"}</option>
            {showQA
              ? editors.map(([id, name]) => (
                  <option key={id} value={id} style={{ background: "#0a0912" }}>{name}</option>
                ))
              : accounts.map(acc => (
                  <option key={acc} value={acc} style={{ background: "#0a0912" }}>@{acc.replace(/^@/, "")}</option>
                ))}
          </select>
          {videos.length > 0 && (
            <button onClick={download}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: "rgba(31,71,161,0.12)", border: "1px solid rgba(31,71,161,0.25)" }}>
              <Download className="w-3.5 h-3.5" /> Descargar
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-white/30 text-sm py-8 text-center">No hay videos en esta campaña aún.</p>
      ) : (
        <div className="space-y-2">
          {shown.map(v => {
            const st = v.status ? (STATUS[v.status] || STATUS.pending) : null;
            return (
              <div key={v.id} className="flex items-center gap-3 p-3.5 rounded-xl flex-wrap"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {st && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                    {st.label}
                  </span>
                )}
                <div className="flex-1 min-w-[160px]">
                  <p className="text-[12px] text-white/70 truncate">{v.title || v.tiktok_url || "Sin título"}</p>
                  <p className="text-[10px] text-white/35 truncate">
                    {v.editor_name}{(v.tags || []).length > 0 ? ` · ${v.tags.map(t => `#${t}`).join(" ")}` : ""}
                  </p>
                </div>
                {v.tiktok_url && (
                  <a href={v.tiktok_url} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white/80 flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <div className="flex gap-4 text-[11px] text-white/45 flex-shrink-0">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(v.views)}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmt(v.likes)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}