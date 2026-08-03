import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Instagram, Facebook, Music2, CheckSquare, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

const PlatformIcon = ({ platform }) => {
  if (platform === "instagram") return <Instagram className="w-3.5 h-3.5" />;
  if (platform === "facebook") return <Facebook className="w-3.5 h-3.5" />;
  return <Music2 className="w-3.5 h-3.5" />;
};

function calcScore(p) {
  const likeRate = p.views > 0 ? p.likes / p.views : 0;
  const commentRate = p.views > 0 ? p.comments / p.views : 0;
  const shareRate = p.views > 0 ? (p.shares || 0) / p.views : 0;
  const saveRate = p.views > 0 ? (p.saves || 0) / p.views : 0;
  const score = (likeRate * 0.3) + (commentRate * 0.2) + (shareRate * 0.25) + (saveRate * 0.25);
  const eng = likeRate + commentRate + shareRate + saveRate;
  const clasificacion = score >= 0.05 ? "Viral" : score >= 0.02 ? "Bueno" : score >= 0.008 ? "Medio" : "Malo";
  const accion = clasificacion === "Viral" ? "Replicar y meter pauta"
    : clasificacion === "Bueno" ? "Iterar variación"
    : clasificacion === "Medio" ? "Revisar hook" : "Cortar formato";
  return { eng, likeRate, commentRate, shareRate, saveRate, score, clasificacion, accion };
}

const HEADER_FILL = { patternType: "solid", fgColor: { rgb: "0D0D0D" } };
const HEADER_FONT = { bold: true, color: { rgb: "E8A820" }, name: "Calibri", sz: 11 };
const SUMMARY_FONT = { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", sz: 11 };
const SUMMARY_FILL = { patternType: "solid", fgColor: { rgb: "1A1410" } };
const VIRAL_FILL   = { patternType: "solid", fgColor: { rgb: "1A2B0F" } };
const GOOD_FILL    = { patternType: "solid", fgColor: { rgb: "0F1E2B" } };
const CENTER = { horizontal: "center", vertical: "center" };
const LEFT   = { horizontal: "left",   vertical: "center" };
const FMT_NUM  = "#,##0";
const FMT_PCT  = "0.00%";
const FMT_SCORE = "0.0000";
const THIN_BORDER = {
  top:    { style: "thin", color: { rgb: "2A2520" } },
  bottom: { style: "thin", color: { rgb: "2A2520" } },
  left:   { style: "thin", color: { rgb: "2A2520" } },
  right:  { style: "thin", color: { rgb: "2A2520" } },
};

function setCellStyle(ws, r, c, style) {
  const ref = XLSX.utils.encode_cell({ r, c });
  if (!ws[ref]) ws[ref] = { v: "" };
  ws[ref].s = style;
}

function buildProfileSheet(wb, profile, posts) {
  const sheetName = ("@" + profile.username).slice(0, 31);
  const totalViews = posts.reduce((a, p) => a + (p.views || 0), 0);
  const virales    = posts.filter(p => (p.virality_score || 0) >= 35).length;
  const avgEng     = posts.length
    ? posts.reduce((a, p) => a + (p.engagement_rate || 0), 0) / posts.length
    : 0;

  // ── Bloque de resumen (filas 0-3) ──
  const summaryBlock = [
    [`DANCREATIVESTUDIO · @${profile.username}`, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    [`Plataforma: ${profile.platform.toUpperCase()}  ·  Seguidores: ${(profile.followers || 0).toLocaleString("es-MX")}  ·  Videos exportados: ${posts.length}  ·  Views totales: ${totalViews.toLocaleString("es-MX")}  ·  Eng. prom.: ${(avgEng * 100).toFixed(2)}%  ·  Virales (≥35): ${virales}`],
    [],
  ];

  // ── Headers ──
  const headers = [
    "#", "Fecha", "Dur (seg)", "Views", "Likes", "Comentarios", "Shares", "Saves",
    "Eng. Total", "Like Rate", "Com. Rate", "Shr. Rate", "Sav. Rate",
    "Score", "Clasificación", "Acción sugerida", "Ver video", "Caption"
  ];

  // ── Filas de datos (origen fila 4) ──
  const dataRows = posts.map((p, i) => {
    const { eng, likeRate, commentRate, shareRate, saveRate, score, clasificacion, accion } = calcScore(p);
    return [
      i + 1,
      p.published_at ? new Date(p.published_at).toISOString().split("T")[0] : "",
      p.duration_seconds || 0,
      p.views || 0,
      p.likes || 0,
      p.comments || 0,
      p.shares || 0,
      p.saves || 0,
      +eng.toFixed(4),
      +likeRate.toFixed(4),
      +commentRate.toFixed(4),
      +shareRate.toFixed(4),
      +saveRate.toFixed(4),
      +score.toFixed(4),
      clasificacion,
      accion,
      p.url ? "▶ Ver" : "",
      (p.caption || "").slice(0, 160),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([...summaryBlock, headers, ...dataRows]);

  // ── Anchos de columna ──
  ws["!cols"] = [
    { wch: 4 },  // #
    { wch: 12 }, // Fecha
    { wch: 10 }, // Dur
    { wch: 12 }, // Views
    { wch: 10 }, // Likes
    { wch: 13 }, // Comentarios
    { wch: 10 }, // Shares
    { wch: 10 }, // Saves
    { wch: 11 }, // Eng
    { wch: 11 }, // Like Rate
    { wch: 11 }, // Com Rate
    { wch: 11 }, // Shr Rate
    { wch: 11 }, // Sav Rate
    { wch: 10 }, // Score
    { wch: 14 }, // Clasificación
    { wch: 22 }, // Acción
    { wch: 10 }, // Ver video
    { wch: 55 }, // Caption
  ];

  // Fila 0 — título grande
  const titleRef = "A1";
  ws[titleRef] = { v: `DANCREATIVESTUDIO · @${profile.username}`, s: { font: { bold: true, color: { rgb: "E8A820" }, sz: 14, name: "Calibri" }, fill: SUMMARY_FILL, alignment: LEFT } };

  // Fila 1 — resumen
  const sumRef = "A2";
  if (ws[sumRef]) ws[sumRef].s = { font: SUMMARY_FONT, fill: SUMMARY_FILL, alignment: LEFT };

  // Fila 3 — headers (índice fila = 3)
  const headerRowIdx = 3;
  headers.forEach((_, c) => {
    const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c });
    if (ws[ref]) ws[ref].s = { font: HEADER_FONT, fill: HEADER_FILL, alignment: CENTER, border: THIN_BORDER };
  });

  // ── Filas de datos: formatos numéricos + color por clasificación ──
  dataRows.forEach((row, i) => {
    const r = headerRowIdx + 1 + i;
    const clasificacion = row[14];
    const rowFill = clasificacion === "Viral" ? VIRAL_FILL : clasificacion === "Bueno" ? GOOD_FILL : null;

    // Número entero → cols 3-7 (Views, Likes, Coments, Shares, Saves)
    [3, 4, 5, 6, 7].forEach(c => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref]) { ws[ref].z = FMT_NUM; ws[ref].s = { numFmt: FMT_NUM, alignment: CENTER, border: THIN_BORDER, ...(rowFill ? { fill: rowFill } : {}) }; }
    });
    // % → cols 8-12
    [8, 9, 10, 11, 12].forEach(c => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref]) { ws[ref].z = FMT_PCT; ws[ref].t = "n"; ws[ref].s = { numFmt: FMT_PCT, alignment: CENTER, border: THIN_BORDER, ...(rowFill ? { fill: rowFill } : {}) }; }
    });
    // Score col 13
    const scoreRef = XLSX.utils.encode_cell({ r, c: 13 });
    if (ws[scoreRef]) { ws[scoreRef].z = FMT_SCORE; ws[scoreRef].s = { numFmt: FMT_SCORE, alignment: CENTER, border: THIN_BORDER, ...(rowFill ? { fill: rowFill } : {}) }; }
    // Clasificación col 14 — bold
    const clasRef = XLSX.utils.encode_cell({ r, c: 14 });
    if (ws[clasRef]) ws[clasRef].s = { font: { bold: true, name: "Calibri", sz: 10 }, alignment: CENTER, border: THIN_BORDER, ...(rowFill ? { fill: rowFill } : {}) };
    // Acción col 15
    const accRef = XLSX.utils.encode_cell({ r, c: 15 });
    if (ws[accRef]) ws[accRef].s = { alignment: LEFT, border: THIN_BORDER, ...(rowFill ? { fill: rowFill } : {}) };
    // Resto de cols
    [0, 1, 2, 16, 17].forEach(c => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref]) ws[ref].s = { alignment: c === 17 ? LEFT : CENTER, border: THIN_BORDER, ...(rowFill ? { fill: rowFill } : {}) };
    });
  });

  // Hipervínculos col 16
  posts.forEach((p, i) => {
    if (p.url) {
      const ref = XLSX.utils.encode_cell({ r: headerRowIdx + 1 + i, c: 16 });
      ws[ref] = { v: "▶ Ver", l: { Target: p.url }, s: { font: { color: { rgb: "5BA3E8" }, underline: true, name: "Calibri", sz: 10 }, alignment: CENTER, border: THIN_BORDER } };
    }
  });

  // Freeze pane en la fila de headers
  ws["!freeze"] = { xSplit: 0, ySplit: headerRowIdx + 1 };

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

function buildResumenSheet(wb, profilesData, projectName) {
  const date = new Date().toISOString().split("T")[0];

  const headers = ["Cuenta", "Plataforma", "Seguidores", "Videos", "Views totales", "Views prom.", "Likes totales", "Eng. prom.", "Virales", "% Virales", "Índice DAN"];
  const dataRows = profilesData.map(({ profile, posts }) => {
    const totalViews  = posts.reduce((a, p) => a + (p.views || 0), 0);
    const totalLikes  = posts.reduce((a, p) => a + (p.likes || 0), 0);
    const avgViews    = posts.length ? totalViews / posts.length : 0;
    const avgEng      = posts.length ? posts.reduce((a, p) => a + (p.engagement_rate || 0), 0) / posts.length : 0;
    const virales     = posts.filter(p => (p.virality_score || 0) >= 35).length;
    const viralPct    = posts.length ? virales / posts.length : 0;
    const indice      = posts.length ? posts.reduce((a, p) => a + (p.virality_score || 0), 0) / posts.length : 0;
    return ["@" + profile.username, profile.platform?.toUpperCase() || "", profile.followers || 0, posts.length, totalViews, +avgViews.toFixed(0), totalLikes, +avgEng.toFixed(4), virales, +viralPct.toFixed(4), +indice.toFixed(1)];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`DANCREATIVESTUDIO · Reporte de contenido viral · ${projectName}`],
    [`Corte: ${date}  ·  Cuentas: ${profilesData.length}`],
    [],
    headers,
    ...dataRows,
  ]);

  ws["!cols"] = [
    { wch: 22 }, // Cuenta
    { wch: 12 }, // Plataforma
    { wch: 14 }, // Seguidores
    { wch: 8  }, // Videos
    { wch: 15 }, // Views totales
    { wch: 13 }, // Views prom
    { wch: 14 }, // Likes totales
    { wch: 12 }, // Eng prom
    { wch: 9  }, // Virales
    { wch: 12 }, // % Virales
    { wch: 12 }, // Índice DAN
  ];

  // Título fila 0
  if (ws["A1"]) ws["A1"].s = { font: { bold: true, sz: 14, color: { rgb: "E8A820" }, name: "Calibri" }, fill: SUMMARY_FILL, alignment: LEFT };
  if (ws["A2"]) ws["A2"].s = { font: { color: { rgb: "AAAAAA" }, sz: 10, name: "Calibri" }, fill: SUMMARY_FILL, alignment: LEFT };

  // Headers fila 3 (índice 3)
  headers.forEach((_, c) => {
    const ref = XLSX.utils.encode_cell({ r: 3, c });
    if (ws[ref]) ws[ref].s = { font: HEADER_FONT, fill: HEADER_FILL, alignment: CENTER, border: THIN_BORDER };
  });

  // Datos
  dataRows.forEach((row, i) => {
    const r = 4 + i;
    const altFill = i % 2 === 0 ? { patternType: "solid", fgColor: { rgb: "0D0D10" } } : null;
    headers.forEach((_, c) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) return;
      const numFmt = c === 2 || c === 4 || c === 5 || c === 6 ? FMT_NUM : c === 7 || c === 9 ? FMT_PCT : undefined;
      ws[ref].s = {
        alignment: c === 0 ? LEFT : CENTER,
        border: THIN_BORDER,
        ...(numFmt ? { numFmt } : {}),
        ...(altFill ? { fill: altFill } : {}),
      };
      if (numFmt) ws[ref].z = numFmt;
    });
  });

  ws["!freeze"] = { xSplit: 0, ySplit: 4 };
  XLSX.utils.book_append_sheet(wb, ws, "RESUMEN");
}

export default function MultiExportModal({ open, onClose, profiles }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const toggleAll = () => setSelected(selected.length === profiles.length ? [] : profiles.map(p => p.id));

  const handleExport = async () => {
    if (!selected.length) return;
    setLoading(true);

    const wb = XLSX.utils.book_new();
    const profilesData = [];

    for (const profileId of selected) {
      const profile = profiles.find(p => p.id === profileId);
      const posts = await base44.entities.Post.filter({ profile_id: profileId });
      const sorted = posts.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));
      profilesData.push({ profile, posts: sorted });
      buildProfileSheet(wb, profile, sorted);
    }

    // Hoja RESUMEN al final
    buildResumenSheet(wb, profilesData, "Proyecto Xavi");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `dancreativestudio_multi_${date}.xlsx`);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-space flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Métricas Multi-Cuenta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Selecciona las cuentas a exportar. Cada una tendrá su propia hoja + un resumen comparativo.
          </p>

          {/* Select all */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            {selected.length === profiles.length
              ? <CheckSquare className="w-4 h-4" />
              : <Square className="w-4 h-4" />
            }
            {selected.length === profiles.length ? "Deseleccionar todo" : "Seleccionar todo"}
          </button>

          {/* Profile list */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {profiles.map(p => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                    isSelected
                      ? "border-white/25 bg-white/8 text-white"
                      : "border-white/8 bg-white/3 text-white/50 hover:border-white/15"
                  )}
                >
                  {isSelected ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0 text-white/25" />}
                  <PlatformIcon platform={p.platform} />
                  <span className="text-sm font-medium flex-1">@{p.username}</span>
                  {p.followers > 0 && (
                    <span className="text-[11px] text-white/30">
                      {p.followers >= 1000000 ? (p.followers / 1000000).toFixed(1) + "M"
                        : p.followers >= 1000 ? (p.followers / 1000).toFixed(1) + "K"
                        : p.followers} seguidores
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleExport}
            disabled={loading || selected.length === 0}
            className="w-full gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando Excel…</>
              : <><Download className="w-4 h-4" /> Exportar {selected.length} cuenta{selected.length !== 1 ? "s" : ""}</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}