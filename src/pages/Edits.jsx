import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { confirmDialog } from "@/lib/alerts";
import { Button } from "@/components/ui/button";
import { Plus, Download, Pencil, Trash2, TrendingUp, Eye, Flame, DollarSign, Video } from "lucide-react";
import EditFormModal from "@/components/edits/EditFormModal";
import TrackVideoByUrlModal from "@/components/edits/TrackVideoByUrlModal";
import * as XLSX from "xlsx";

// Benchmarks de referencia (estándares reales para considerar un edit "bueno")
const REACH_BENCHMARK = 50000;      // views para alcance pleno (100 pts de reach)
const ENG_BENCHMARK = 0.06;          // 6% engagement ponderado = excelente
const CONV_BENCHMARK = 0.005;        // 0.5% conversión (followers+clicks sobre views) = excelente

function calcStats(edit) {
  const v = edit.views || 0;
  const l = edit.likes || 0;
  const c = edit.comments || 0;
  const s = edit.shares || 0;
  const sv = edit.saves || 0;
  const fg = edit.followers_ganados || 0;
  const ck = edit.clicks || 0;

  const total = l + c + s + sv;
  const engRate = v > 0 ? total / v : 0;
  const likeRate = v > 0 ? l / v : 0;
  const commentRate = v > 0 ? c / v : 0;
  const shareRate = v > 0 ? s / v : 0;
  const saveRate = v > 0 ? sv / v : 0;
  const convRate = v > 0 ? (fg + ck) / v : 0;

  // Engagement PONDERADO (0-1): saves y shares pesan más porque indican valor real,
  // los likes son "vanidad" y casi no suben el score.
  const weightedEng = v > 0
    ? (l * 0.10 + c * 0.20 + s * 0.30 + sv * 0.40) / v
    : 0;

  // Sub-scores normalizados 0-100 contra benchmarks, con curva crítica (sqrt) para
  // que sea difícil llegar al tope y fácil castigar resultados pobres.
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const reachScore = Math.sqrt(clamp(v / REACH_BENCHMARK)) * 100;
  const engScore = Math.sqrt(clamp(weightedEng / ENG_BENCHMARK)) * 100;
  const convScore = Math.sqrt(clamp(convRate / CONV_BENCHMARK)) * 100;

  // Score crítico 0-100: el engagement de calidad domina, alcance y conversión refuerzan.
  let score100 = reachScore * 0.30 + engScore * 0.45 + convScore * 0.25;

  // Penalización dura: sin views suficientes nada puede ser viral.
  if (v < 1000) score100 = Math.min(score100, 25);

  const score = Math.round(score100 * 10) / 10; // 0-100 con 1 decimal

  let clasificacion = "Malo";
  let accion = "Cortar formato";
  if (score >= 75) { clasificacion = "Viral"; accion = "Replicar y meter pauta"; }
  else if (score >= 55) { clasificacion = "Bueno"; accion = "Iterar variación"; }
  else if (score >= 35) { clasificacion = "Medio"; accion = "Revisar hook"; }

  return {
    engRate, likeRate, commentRate, shareRate, saveRate, convRate,
    reachScore, engScore, convScore, score, clasificacion, accion
  };
}

function fmt(n) {
  if (!n && n !== 0) return "-";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("es-MX");
}

const CLASIFICACION_COLORS = {
  Viral: "bg-green-100 text-green-700",
  Bueno: "bg-blue-100 text-blue-700",
  Medio: "bg-[#7BA5F0] text-yellow-700",
  Malo: "bg-red-100 text-red-700",
};

export default function Edits() {
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTrackUrl, setShowTrackUrl] = useState(false);
  const [editingEdit, setEditingEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Edit.list("-created_date", 200);
    setEdits(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const editsWithStats = useMemo(() =>
    edits.map(e => ({ ...e, _stats: calcStats(e) })),
    [edits]
  );

  // Dashboard KPIs
  const totalViews = edits.reduce((a, e) => a + (e.views || 0), 0);
  const avgViews = edits.length ? Math.round(totalViews / edits.length) : 0;
  const virales = editsWithStats.filter(e => e._stats.clasificacion === "Viral").length;
  const totalCosto = edits.reduce((a, e) => a + (e.costo_edit || 0), 0);
  const cpk = totalViews > 0 ? ((totalCosto / totalViews) * 1000).toFixed(2) : 0;
  const avgEng = edits.length
    ? (edits.reduce((a, e) => {
        const s = calcStats(e);
        return a + s.engRate;
      }, 0) / edits.length * 100).toFixed(2)
    : 0;

  const handleDelete = async (id) => {
    if (!(await confirmDialog("¿Eliminar este edit?", { danger: true, confirmLabel: "Eliminar" }))) return;
    await base44.entities.Edit.delete(id);
    setEdits(prev => prev.filter(e => e.id !== id));
  };

  const handleSaved = () => { load(); setShowModal(false); setEditingEdit(null); };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // --- DASHBOARD Sheet ---
    const dashData = [
      ["Dashboard de Resultados - Estrategia de Edits", "Valor"],
      ["Total videos", edits.length],
      ["Views totales", totalViews],
      ["Views promedio", avgViews],
      ["Engagement promedio", Number((avgEng / 100).toFixed(4))],
      ["Virales", virales],
      ["% Viral", edits.length ? Number((virales / edits.length).toFixed(2)) : 0],
      ["Costo total pagado", totalCosto],
      ["Costo por 1,000 Views", Number(cpk)],
    ];
    const wsDash = XLSX.utils.aoa_to_sheet(dashData);
    XLSX.utils.book_append_sheet(wb, wsDash, "DASHBOARD");

    // --- BASE_EDITS Sheet ---
    const headers = [
      "ID Edit","Fecha","Cuenta","Editor","Cliente/Proyecto","Plataforma","Tipo Video",
      "Formato exacto","Hook (primer segundo)","Texto en pantalla","Canción","Duración (seg)",
      "URL","Views","Likes","Comments","Shares","Saves","Followers Ganados","Clicks",
      "Streams Estimados","Costo Edit","Engagement Rate","Like Rate","Comment Rate",
      "Share Rate","Save Rate","Score","Clasificación","Acción sugerida","Notas"
    ];
    const rows = editsWithStats.map((e, i) => {
      const s = e._stats;
      return [
        i + 1,
        e.fecha || "",
        e.cuenta || "",
        e.editor || "",
        e.cliente_proyecto || "",
        e.plataforma || "",
        e.tipo_video || "",
        e.formato_exacto || "",
        e.hook || "",
        e.texto_pantalla || "",
        e.cancion || "",
        e.duracion_seg || 0,
        e.url || "",
        e.views || 0,
        e.likes || 0,
        e.comments || 0,
        e.shares || 0,
        e.saves || 0,
        e.followers_ganados || 0,
        e.clicks || 0,
        e.streams_estimados || 0,
        e.costo_edit || 0,
        Number(s.engRate.toFixed(4)),
        Number(s.likeRate.toFixed(4)),
        Number(s.commentRate.toFixed(4)),
        Number(s.shareRate.toFixed(4)),
        Number(s.saveRate.toFixed(4)),
        Number(s.score.toFixed(1)),
        s.clasificacion,
        s.accion,
        e.notas || ""
      ];
    });
    const wsBase = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, wsBase, "BASE_EDITS");

    // --- ANALISIS_FORMATOS Sheet ---
    const tiposVideo = ["POV","Lyrics","Clip","Día 1","Hook","Trend","Otro"];
    const formatoRows = tiposVideo.map(tipo => {
      const key = tipo.toLowerCase().replace(" ", "").replace("í","i").replace("ó","o");
      const grupo = editsWithStats.filter(e => (e.tipo_video || "").toLowerCase().replace(" ","") === key || (e.tipo_video || "").toLowerCase() === tipo.toLowerCase());
      const numVideos = grupo.length;
      const viewsTotales = grupo.reduce((a, e) => a + (e.views || 0), 0);
      const viewsProm = numVideos ? Math.round(viewsTotales / numVideos) : 0;
      const engProm = numVideos ? Number((grupo.reduce((a, e) => a + e._stats.engRate, 0) / numVideos).toFixed(4)) : 0;
      const viralesG = grupo.filter(e => e._stats.clasificacion === "Viral").length;
      const pctViral = numVideos ? Number((viralesG / numVideos).toFixed(2)) : 0;
      const scoreProm = numVideos ? Number((grupo.reduce((a, e) => a + e._stats.score, 0) / numVideos).toFixed(1)) : 0;
      let decision = "Sin data";
      if (numVideos > 0) {
        if (pctViral >= 0.5) decision = "Escalar fuerte";
        else if (pctViral >= 0.2) decision = "Iterar variación";
        else decision = "Revisar o cortar";
      }
      return [tipo, numVideos, viewsTotales, viewsProm, engProm, viralesG, pctViral, scoreProm, decision];
    });
    const wsFormatos = XLSX.utils.aoa_to_sheet([
      ["Tipo de Video","Número de Videos","Views Totales","Views Promedio","Engagement Promedio","Virales","% Virales","Score Promedio","Decisión"],
      ...formatoRows
    ]);
    XLSX.utils.book_append_sheet(wb, wsFormatos, "ANALISIS_FORMATOS");

    // --- CONTROL_EDITORES Sheet ---
    const editoresUniq = [...new Set(edits.map(e => e.editor).filter(Boolean))];
    const editorRows = editoresUniq.map(editor => {
      const grupo = editsWithStats.filter(e => e.editor === editor);
      const numVideos = grupo.length;
      const viewsTotales = grupo.reduce((a, e) => a + (e.views || 0), 0);
      const viewsProm = numVideos ? Math.round(viewsTotales / numVideos) : 0;
      const engProm = numVideos ? Number((grupo.reduce((a, e) => a + e._stats.engRate, 0) / numVideos).toFixed(4)) : 0;
      const viralesG = grupo.filter(e => e._stats.clasificacion === "Viral").length;
      const costoPagado = grupo.reduce((a, e) => a + (e.costo_edit || 0), 0);
      const cpk = viewsTotales > 0 ? Number(((costoPagado / viewsTotales) * 1000).toFixed(2)) : 0;
      let decision = "Sin data";
      if (numVideos > 0) {
        if (viralesG / numVideos >= 0.5) decision = "Mantener";
        else if (viralesG / numVideos >= 0.2) decision = "Monitorear";
        else decision = "Revisar";
      }
      return [editor, numVideos, viewsTotales, viewsProm, engProm, viralesG, costoPagado, cpk, decision];
    });
    const wsEditores = XLSX.utils.aoa_to_sheet([
      ["Editor","Videos Entregados","Views Totales","Views Promedio","Engagement Promedio","Virales Generados","Costo Pagado","Costo por 1,000 Views","Decisión"],
      ...editorRows
    ]);
    XLSX.utils.book_append_sheet(wb, wsEditores, "CONTROL_EDITORES");

    // --- CATALOGOS Sheet ---
    const wsCat = XLSX.utils.aoa_to_sheet([
      ["Tipos de Video","Plataformas","Clientes/Proyecto","Clasificación","Acción","Notas"],
      ["POV","TikTok","","Malo","Cortar formato",""],
      ["Lyrics","Instagram Reels","","Medio","Revisar hook",""],
      ["Clip","YouTube Shorts","","Bueno","Iterar variación",""],
      ["Día 1","Facebook Reels","","Viral","Replicar y meter pauta",""],
      ["Hook","Otra","","","",""],
      ["Trend","","","","",""],
      ["Otro","","","","",""],
    ]);
    XLSX.utils.book_append_sheet(wb, wsCat, "CATALOGOS");

    // --- INSTRUCCIONES Sheet ---
    const wsInstr = XLSX.utils.aoa_to_sheet([
      ["Cómo usar este Excel"],
      ["1. Cada video publicado debe ser una fila en BASE_EDITS."],
      ["2. Llena manualmente las columnas básicas; las columnas de métricas calculan rendimiento automático."],
      ["3. Espera 48–72 horas antes de evaluar un edit para evitar cortar formatos demasiado pronto."],
      ["4. Usa ANALISIS_FORMATOS para decidir qué formatos escalar, iterar o cortar."],
      ["5. Usa CONTROL_EDITORES para medir eficiencia por editor, costo por views y virales generados."],
      ["6. Score crítico 0-100 = (Reach 30%) + (Engagement ponderado 45%) + (Conversión 25%), con curva exigente."],
      ["   - Engagement ponderado prioriza SAVES (×0.40) y SHARES (×0.30) sobre likes (×0.10), porque indican valor real."],
      ["   - Benchmarks: 50K views = alcance pleno | 6% eng. ponderado = excelente | 0.5% conversión = excelente."],
      ["   - Penalización: con menos de 1,000 views el score se topa en 25 (no puede ser viral)."],
      ["7. Clasificación: Viral ≥ 75 | Bueno ≥ 55 | Medio ≥ 35 | Malo < 35"],
    ]);
    XLSX.utils.book_append_sheet(wb, wsInstr, "INSTRUCCIONES");

    XLSX.writeFile(wb, "control_edits_nonstop.xlsx");
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-space font-bold text-foreground">Control de Edits</h1>
          <p className="text-muted-foreground text-sm">Registra y analiza el rendimiento de cada edit</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2 flex-1 sm:flex-initial">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exportar Excel</span><span className="sm:hidden">Excel</span>
          </Button>
          <Button variant="outline" onClick={() => setShowTrackUrl(true)} className="gap-2 flex-1 sm:flex-initial">
            <Video className="w-4 h-4" /> <span className="hidden sm:inline">Rastrear URL</span><span className="sm:hidden">URL</span>
          </Button>
          <Button onClick={() => { setEditingEdit(null); setShowModal(true); }} className="gap-2 flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" /> Nuevo Edit
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Videos", value: edits.length, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
          { label: "Views Totales", value: fmt(totalViews), icon: Eye, color: "text-blue-600 bg-blue-100" },
          { label: "Views Promedio", value: fmt(avgViews), icon: Eye, color: "text-cyan-600 bg-cyan-100" },
          { label: "Virales", value: virales, icon: Flame, color: "text-orange-600 bg-orange-100" },
          { label: "Costo/1K Views", value: `$${cpk}`, icon: DollarSign, color: "text-green-600 bg-green-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-space font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Cargando edits...</div>
        ) : edits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No hay edits registrados aún</p>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Agregar primer edit
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Fecha","Cuenta","Editor","Cliente","Plat.","Tipo","Hook","Views","Likes","Eng%","Score","Clasif.","Acción","Costo",""].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editsWithStats.map((edit) => {
                  const s = edit._stats;
                  return (
                    <tr key={edit.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground tabular-nums">{edit.fecha || "-"}</td>
                      <td className="px-4 py-3.5 font-medium">{edit.cuenta || "-"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{edit.editor || "-"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground max-w-[100px] truncate">{edit.cliente_proyecto || "-"}</td>
                      <td className="px-4 py-3.5 capitalize text-muted-foreground">{edit.plataforma || "-"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground capitalize">{edit.tipo_video || "-"}</td>
                      <td className="px-4 py-3.5 max-w-[120px] truncate text-muted-foreground" title={edit.hook}>{edit.hook || "-"}</td>
                      <td className="px-4 py-3.5 font-space font-semibold tabular-nums">{fmt(edit.views)}</td>
                      <td className="px-4 py-3.5 tabular-nums">{fmt(edit.likes)}</td>
                      <td className="px-4 py-3.5 tabular-nums">{(s.engRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3.5 font-space font-bold tabular-nums">{s.score.toFixed(1)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CLASIFICACION_COLORS[s.clasificacion]}`}>
                          {s.clasificacion}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[120px] truncate" title={s.accion}>{s.accion}</td>
                      <td className="px-4 py-3.5 tabular-nums">${(edit.costo_edit || 0).toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingEdit(edit); setShowModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(edit.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <EditFormModal
          open={showModal}
          edit={editingEdit}
          onClose={() => { setShowModal(false); setEditingEdit(null); }}
          onSaved={handleSaved}
        />
      )}

      <TrackVideoByUrlModal
        open={showTrackUrl}
        onClose={() => setShowTrackUrl(false)}
        onSaved={() => load()}
      />
    </div>
  );
}