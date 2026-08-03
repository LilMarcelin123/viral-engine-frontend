import { useEffect, useState } from "react";
import { session } from "@/api/base44Client";
import { Tag, Download, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";
const fmt = (n) => (n || 0) >= 1e6 ? `${((n||0)/1e6).toFixed(1)}M`
                 : (n || 0) >= 1e3 ? `${((n||0)/1e3).toFixed(1)}K` : `${n || 0}`;

/** Reporte por tags (solo admin). Filtrable por campaña, con descarga CSV. */
export default function TagReportSection({ campaignId }) {
  const [rows, setRows] = useState(null);
  const [soloCampania, setSoloCampania] = useState(false);

  useEffect(() => {
    const q = soloCampania && campaignId ? `?campaign=${campaignId}` : "";
    fetch(`${API}/reports/tags${q}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(r => r.json())
      .then(d => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, [campaignId, soloCampania]);

  const descargar = () => {
    if (!rows?.length) return;
    const head = ["tag","clips","aprobados","editores","campañas","vistas","likes","vistas_promedio"];
    const csv = [head.join(",")]
      .concat(rows.map(r => [r.tag, r.clips, r.clips_aprobados, r.editores,
                             r.campanias, r.vistas, r.likes, r.vistas_promedio].join(",")))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `reporte_tags${soloCampania ? "_campania_" + campaignId : ""}.csv`;
    a.click();
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#3B6FD4]/60" />
          <h2 className="font-syne font-bold text-white text-[15px]">Rendimiento por tags</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] text-white/50 cursor-pointer">
            <input type="checkbox" checked={soloCampania}
                   onChange={e => setSoloCampania(e.target.checked)}
                   className="w-3.5 h-3.5 accent-[#3B6FD4]" />
            Solo esta campaña
          </label>
          <button onClick={descargar} disabled={!rows?.length}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg
                             bg-white/5 border border-white/10 text-white/70
                             hover:bg-white/10 disabled:opacity-40 transition">
            <Download className="w-3.5 h-3.5" /> Descargar CSV
          </button>
        </div>
      </div>

      {rows === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-white/6 rounded-2xl p-8 text-center">
          <p className="text-white/25 text-[12px]">
            Sin tags registrados{soloCampania ? " en esta campaña" : ""}.
            Los tags se capturan al subir cada clip.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-white/6 rounded-2xl overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-white/35 text-left border-b border-white/6">
                {["Tag","Clips","Aprobados","Editores","Vistas","Likes","Vistas prom."].map(h => (
                  <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.tag} className="border-b border-white/4 last:border-0">
                  <td className="px-4 py-2.5 text-white/85 font-medium">#{r.tag}</td>
                  <td className="px-4 py-2.5 text-white/60">{r.clips}</td>
                  <td className="px-4 py-2.5 text-white/60">{r.clips_aprobados}</td>
                  <td className="px-4 py-2.5 text-white/60">{r.editores}</td>
                  <td className="px-4 py-2.5 text-white/85">{fmt(r.vistas)}</td>
                  <td className="px-4 py-2.5 text-white/60">{fmt(r.likes)}</td>
                  <td className="px-4 py-2.5 text-white/60">{fmt(r.vistas_promedio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
