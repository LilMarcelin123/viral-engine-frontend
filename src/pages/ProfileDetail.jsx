import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, Instagram, Facebook, Music2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import VinylRecord from "@/components/profiles/VinylRecord";
import { useUserRole } from "@/hooks/useUserRole";
import WaveformBar from "@/components/posts/WaveformBar";
import PostCard from "@/components/posts/PostCard";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function fmtFull(n) {
  if (!n) return "0";
  return n.toLocaleString("es-MX");
}

// Curva de retención simulada basada en posts
function RetentionCurve({ posts }) {
  const w = 360, h = 140;
  if (!posts.length) return null;

  // Simulamos curva promedio de retención
  const points = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    // Caída rápida al inicio luego se aplana
    const base = Math.exp(-t * 2.2) * 0.7 + 0.08;
    const noise = (Math.random() - 0.5) * 0.04;
    return Math.max(0.05, Math.min(1, base + noise));
  });

  const pad = 20;
  const iw = w - pad * 2, ih = h - pad * 2;
  const pts = points.map((v, i) => [
    pad + (i / 19) * iw,
    pad + ih - v * ih,
  ]);

  const pathD = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const areaD = pathD + ` L ${pts[pts.length - 1][0]} ${pad + ih} L ${pad} ${pad + ih} Z`;

  // Punto de gancho (primer 20%)
  const hookIdx = Math.floor(pts.length * 0.15);
  const hookPt = pts[hookIdx];

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: h }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#area-grad)" />
      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Punto gancho */}
      <circle cx={hookPt[0]} cy={hookPt[1]} r={3} fill="white" />
      <text x={hookPt[0] + 5} y={hookPt[1] - 5} fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="Inter">GANCHO</text>
      {/* Ejes */}
      <line x1={pad} y1={pad} x2={pad} y2={pad + ih} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      <line x1={pad} y1={pad + ih} x2={pad + iw} y2={pad + ih} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    </svg>
  );
}

export default function ProfileDetail() {
  const { id } = useParams();
  const { canSeeAll, assignedArtistIds } = useUserRole();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [analyzingBatch, setAnalyzingBatch] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [p, po] = await Promise.all([
      base44.entities.Profile.filter({ id }),
      base44.entities.Post.filter({ profile_id: id })
    ]);
    setProfile(p[0] || null);
    setPosts(po.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const date = new Date().toISOString().split("T")[0];

    const totalViews = posts.reduce((a, p) => a + (p.views || 0), 0);
    const virales = posts.filter(p => (p.virality_score || 0) >= 35).length;
    const avgEng = posts.length
      ? (posts.reduce((a, p) => a + (p.engagement_rate || 0), 0) / posts.length * 100).toFixed(1)
      : "0";

    const summaryLine = `Videos: ${posts.length}      ·      Views totales: ${totalViews.toLocaleString("es-MX")}      ·      Engagement promedio: ${avgEng}%      ·      Virales: ${virales} / ${posts.length}`;

    const rows = posts.map((p, i) => {
      const likeRate = p.views > 0 ? p.likes / p.views : 0;
      const commentRate = p.views > 0 ? p.comments / p.views : 0;
      const shareRate = p.views > 0 ? (p.shares || 0) / p.views : 0;
      const saveRate = p.views > 0 ? (p.saves || 0) / p.views : 0;
      const eng = likeRate + commentRate + shareRate + saveRate;
      const score = (likeRate * 0.3) + (commentRate * 0.2) + (shareRate * 0.25) + (saveRate * 0.25);
      const clasificacion = score >= 0.05 ? "Viral" : score >= 0.02 ? "Bueno" : score >= 0.008 ? "Medio" : "Malo";
      const accion = clasificacion === "Viral" ? "Replicar y meter pauta"
        : clasificacion === "Bueno" ? "Iterar variación"
        : clasificacion === "Medio" ? "Revisar hook" : "Cortar formato";
      return {
        "ID": i + 1,
        "Fecha": p.published_at ? new Date(p.published_at).toISOString().split("T")[0] : "",
        "Dur (s)": p.duration_seconds || 0,
        "Views": p.views || 0,
        "Likes": p.likes || 0,
        "Coments": p.comments || 0,
        "Shares": p.shares || 0,
        "Saves": p.saves || 0,
        "Eng %": +eng.toFixed(4),
        "Like %": +likeRate.toFixed(4),
        "Com %": +commentRate.toFixed(4),
        "Shr %": +shareRate.toFixed(4),
        "Sav %": +saveRate.toFixed(4),
        "Score": +score.toFixed(4),
        "Clasificación": clasificacion,
        "Acción sugerida": accion,
        "Video": p.url ? "▶ Ver" : "",
        "Notas": p.caption ? p.caption.slice(0, 120) : ""
      };
    });

    const ws = XLSX.utils.aoa_to_sheet([[summaryLine]]);
    XLSX.utils.sheet_add_json(ws, rows, { origin: "A2" });

    // Hipervínculos en col Video
    posts.forEach((p, i) => {
      if (p.url) {
        const cellRef = XLSX.utils.encode_cell({ r: i + 2, c: 16 });
        ws[cellRef] = { v: "▶ Ver", l: { Target: p.url } };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, ("@" + profile.username).slice(0, 31));

    // Hoja RESUMEN estilo viralspy
    const indice = posts.length
      ? +(posts.reduce((a, p) => a + (p.virality_score || 0), 0) / posts.length).toFixed(1)
      : 0;
    const avgViews = posts.length ? Math.round(totalViews / posts.length) : 0;
    const avgEngRate = posts.length
      ? +(posts.reduce((a, p) => a + (p.engagement_rate || 0), 0) / posts.length).toFixed(4)
      : 0;

    const wsRes = XLSX.utils.aoa_to_sheet([
      ["VIRALSPY · Reporte de contenido viral"],
      [`@${profile.username} · ${profile.platform} · corte ${date}`],
      [],
      ["Cuenta", "Seguidores", "Videos", "Views totales", "Views prom.", "Eng. prom.", "Virales", "% Virales", "Índice DAN"],
      [
        "@" + profile.username,
        profile.followers || 0,
        posts.length,
        totalViews,
        avgViews,
        avgEngRate,
        virales,
        posts.length ? +(virales / posts.length).toFixed(4) : 0,
        indice
      ]
    ]);
    XLSX.utils.book_append_sheet(wb, wsRes, "RESUMEN");

    XLSX.writeFile(wb, `viralspy_${profile.username}_${date}.xlsx`);
  };

  const handleBatchAnalyze = async () => {
    setAnalyzingBatch(true);
    await base44.functions.invoke("analyzeProfileBatch", { profileId: id, topN: 15 });
    setAnalyzingBatch(false);
    load();
  };

  const filteredPosts = posts.filter(p => {
    if (filter === "viral") return (p.virality_score || 0) >= 35;
    if (filter === "analyzed") return p.ai_analysis_done;
    if (filter === "pending") return !p.ai_analysis_done;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
    </div>
  );

  if (!profile) return (
    <div className="p-8 text-center">
      <p className="text-white/50">Perfil no encontrado</p>
      <Link to="/profiles"><Button className="mt-4">Volver</Button></Link>
    </div>
  );

  if (!canSeeAll) {
    const profileArtistIds = profile.artist_ids || (profile.artist_id ? [profile.artist_id] : []);
    const hasAccess = profileArtistIds.some(aid => assignedArtistIds.includes(aid));
    if (!hasAccess) return (
      <div className="p-8 text-center py-20">
        <p className="text-5xl mb-4">🔒</p>
        <p className="text-white/50 mb-2">No tienes acceso a este perfil</p>
        <Link to="/profiles"><Button className="mt-4">Volver</Button></Link>
      </div>
    );
  }

  const unanalyzed = posts.filter(p => !p.ai_analysis_done).length;
  const totalViews = posts.reduce((a, p) => a + (p.views || 0), 0);
  const totalLikes = posts.reduce((a, p) => a + (p.likes || 0), 0);
  const totalShares = posts.reduce((a, p) => a + (p.shares || 0), 0);
  const totalComments = posts.reduce((a, p) => a + (p.comments || 0), 0);
  const viralityAvg = posts.length
    ? (posts.reduce((a, p) => a + (p.virality_score || 0), 0) / posts.length).toFixed(1)
    : "—";
  const viralPosts = posts.filter(p => (p.virality_score || 0) >= 35);

  // Categorías del perfil (simuladas desde topic_category)
  const categories = [...new Set(posts.filter(p => p.topic_category).map(p => p.topic_category))].slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-white/6 gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <Link to="/profiles">
            <button className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/80 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Perfiles
            </button>
          </Link>
          <span className="text-white/15">·</span>
          <span className="text-[11px] text-white/30 tracking-[0.2em] uppercase">Análisis de Artista</span>
        </div>
        <div className="flex items-center gap-3">
          {posts.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/12 text-[12px] text-white/50 hover:text-white/90 hover:border-white/25 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
          )}
          {unanalyzed > 0 && (
            <button
              onClick={handleBatchAnalyze}
              disabled={analyzingBatch}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white text-black text-[12px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {analyzingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {analyzingBatch ? "Analizando..." : `Analizar Top ${Math.min(unanalyzed, 15)}`}
            </button>
          )}
        </div>
      </div>

      {/* ── HERO HEADER ── */}
      <div
        className="relative px-4 md:px-8 py-6 md:py-10 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0e0e11 0%, #080809 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Ambient glow behind vinyl */}
        <div
          className="absolute left-8 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 220, height: 220,
            background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 relative z-10">
          {/* Vinyl */}
          <VinylRecord imageUrl={profile.profile_pic_url} size={200} />

          {/* Info */}
          <div className="flex-1 min-w-0 w-full text-center md:text-left">
            {/* Status pill */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                <span className="text-[10px] text-white/45 tracking-[0.25em] uppercase font-medium">
                  Últimos 30 días
                </span>
              </div>
              {posts.length > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-[10px] text-white/45 tracking-[0.2em] uppercase">
                    {posts.length} videos analizados
                  </span>
                </>
              )}
            </div>

            {/* Name */}
            <h1
              className="font-syne font-extrabold uppercase leading-none mb-2 text-white break-words"
              style={{
                fontSize: "clamp(1.75rem, 7vw, 4.5rem)",
                letterSpacing: "-0.02em",
                textShadow: "0 0 60px rgba(255,255,255,0.15)",
                overflowWrap: "anywhere",
              }}
            >
              {profile.full_name || profile.username}
            </h1>

            <p className="text-[13px] text-white/35 mb-3 tracking-wide">@{profile.username}</p>

            {/* Category tags */}
            {categories.length > 0 && (
              <div className="flex gap-2 mb-5">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full border border-white/15 text-white/50"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Key metrics row */}
            <div className="flex items-end justify-center md:justify-start gap-8 flex-wrap">
              <div>
                <p className="text-[9px] text-white/30 tracking-[0.2em] uppercase mb-1">Seguidores</p>
                <p className="font-syne font-extrabold text-3xl text-white leading-none">
                  {fmt(profile.followers)}
                </p>
              </div>
              {profile.avg_engagement_rate > 0 && (
                <div>
                  <p className="text-[9px] text-white/30 tracking-[0.2em] uppercase mb-1">Engagement</p>
                  <p className="font-syne font-extrabold text-3xl text-white leading-none">
                    +{profile.avg_engagement_rate}%
                  </p>
                </div>
              )}
              {totalViews > 0 && (
                <div>
                  <p className="text-[9px] text-white/30 tracking-[0.2em] uppercase mb-1">Vistas en vivo</p>
                  <p className="font-syne font-extrabold text-3xl text-white leading-none">
                    {fmtFull(totalViews)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-white/5 border-b border-white/6">
        {[
          { label: "Vistas", value: fmt(totalViews), full: fmtFull(totalViews) },
          { label: "Likes", value: fmt(totalLikes), full: fmtFull(totalLikes) },
          { label: "Shares", value: fmt(totalShares), full: fmtFull(totalShares) },
          { label: "Comentarios", value: fmt(totalComments), full: fmtFull(totalComments) },
          { label: "Viralidad", value: viralityAvg, full: "Índice DAN /10" },
        ].map(({ label, value, full }) => (
          <div key={label} className="bg-background px-4 md:px-6 py-4 md:py-5">
            <p className="text-[9px] text-white/30 tracking-[0.2em] uppercase font-medium mb-2">{label}</p>
            <p className="font-syne font-extrabold text-2xl md:text-3xl text-white leading-none mb-1">{value}</p>
            <p className="text-[11px] text-white/25">{full}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Filter tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div className="flex gap-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {[
              { key: "all",      label: `Todos (${posts.length})` },
              { key: "viral",    label: `🔥 Buenos+ (${viralPosts.length})` },
              { key: "analyzed", label: `✨ Analizados (${posts.filter(p => p.ai_analysis_done).length})` },
              { key: "pending",  label: `Pendientes (${posts.filter(p => !p.ai_analysis_done).length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12px] font-medium transition-all tracking-wide whitespace-nowrap flex-shrink-0",
                  filter === key
                    ? "bg-white text-black"
                    : "text-white/35 hover:text-white/70 hover:bg-white/5"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="hidden md:block text-[11px] text-white/25 tracking-[0.15em] uppercase">Ordenado por Índice DAN</p>
        </div>

        {/* Two-column: posts + retention */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* Posts virales */}
          <div>
            <p className="text-[11px] text-white/30 tracking-[0.25em] uppercase font-medium mb-4">
              Videos Virales
            </p>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-white/30 text-[13px]">No hay posts en este filtro</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post, idx) => (
                  <DanPostRow key={post.id} post={post} index={idx} onAnalyzed={load} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Curva de retención */}
          <div className="space-y-4">
            <div className="bg-card border border-white/6 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-white/30 tracking-[0.2em] uppercase font-medium">
                  Curva de Retención
                </p>
                <p className="text-[10px] text-white/20">Promedio · {posts.length} videos</p>
              </div>
              <RetentionCurve posts={posts} />
            </div>

            {/* Top hook types */}
            {posts.filter(p => p.hook_type).length > 0 && (
              <div className="bg-card border border-white/6 rounded-2xl p-5">
                <p className="text-[11px] text-white/30 tracking-[0.2em] uppercase font-medium mb-4">
                  Tipos de Hook
                </p>
                {Object.entries(
                  posts.reduce((acc, p) => {
                    if (p.hook_type) acc[p.hook_type] = (acc[p.hook_type] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3 mb-2.5">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-white/60 capitalize">{type}</span>
                          <span className="text-[11px] text-white/30">{count}</span>
                        </div>
                        <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/50 rounded-full"
                            style={{ width: `${(count / posts.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Thumbnail con fallback elegante ──
function ThumbnailImage({ url, duration }) {
  const [failed, setFailed] = useState(false);

  return (
    <>
      {url && !failed ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover"
          style={{ minHeight: 80 }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ minHeight: 80 }}>
          <Music2 className="w-5 h-5 text-white/15" />
          {duration > 0 && (
            <span className="text-[9px] text-white/20">
              {Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, "0")}
            </span>
          )}
        </div>
      )}
      {!failed && duration > 0 && (
        <span className="absolute bottom-1 left-1 text-[9px] text-white/70 bg-black/60 px-1 rounded">
          {Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, "0")}
        </span>
      )}
    </>
  );
}

// ── Row de post estilo DAN Records ──
function DanPostRow({ post, index, onAnalyzed }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const structure = (() => {
    try { return JSON.parse(post.content_structure || "{}"); } catch { return {}; }
  })();

  const handleAnalyze = async (e) => {
    e.stopPropagation();
    setAnalyzing(true);
    await base44.functions.invoke("analyzePost", { postId: post.id });
    setAnalyzing(false);
    onAnalyzed && onAnalyzed();
  };

  return (
    <div
      className={cn(
        "border border-white/6 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer",
        "bg-card hover:border-white/12 hover:bg-white/3"
      )}
      onClick={() => post.ai_analysis_done && setExpanded(!expanded)}
    >
      <div className="flex items-stretch gap-0">
        {/* Thumbnail */}
        <div className="w-24 flex-shrink-0 relative bg-black/40" style={{ minHeight: 80 }}>
          <ThumbnailImage url={post.thumbnail_url} duration={post.duration_seconds} />
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Index + caption */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-syne font-bold text-white/20 flex-shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[13px] font-medium text-white/85 leading-snug line-clamp-1">
                  {post.caption || "(sin caption)"}
                </p>
              </div>

              {/* Waveform + hook */}
              <div className="flex items-center gap-3 mb-2">
                <WaveformBar score={post.virality_score || 30} bars={28} />
                {post.hook_type && (
                  <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/40 border border-white/12 px-2 py-0.5 rounded-full">
                    {post.hook_type}
                  </span>
                )}
              </div>

              {post.hook_text && (
                <p className="text-[11px] text-white/30 leading-tight mb-2">
                  <span className="text-white/50 font-semibold">
                    {post.hook_type?.toUpperCase() || "HOOK"}
                  </span>
                  {" "}{post.hook_text.slice(0, 60)}{post.hook_text.length > 60 ? "..." : ""}
                </p>
              )}

              {/* Metrics row */}
              <div className="flex items-center gap-3 text-[11px] text-white/30">
                {post.views > 0 && (
                  <span className="font-semibold text-white/55">{fmt(post.views)} vistas</span>
                )}
                {post.engagement_rate > 0 && (
                  <span>retención {post.engagement_rate}%</span>
                )}
              </div>
            </div>

            {/* Score circle */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <ScoreCircle score={post.virality_score} />
              {!post.ai_analysis_done ? (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="text-[10px] text-white/30 hover:text-white/70 transition-colors flex items-center gap-1"
                >
                  {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </button>
              ) : (
                post.url && (
                  <a href={post.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-white/25 hover:text-white/60 transition-colors">↗</span>
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded AI analysis */}
      {expanded && post.ai_analysis_done && (
        <div className="border-t border-white/6 p-4 bg-white/2 space-y-3">

          {/* Veredicto */}
          {structure.performance_verdict && (
            <div className={`rounded-xl px-3 py-2 border text-[12px] font-semibold ${
              structure.worked
                ? "bg-green-500/10 border-green-500/25 text-green-400"
                : "bg-red-500/10 border-red-500/25 text-red-400"
            }`}>
              {structure.performance_verdict}
            </div>
          )}

          {/* Por qué funcionó / no */}
          {structure.why_it_worked?.length > 0 && (
            <div>
              <p className="text-[9px] text-green-400/60 tracking-[0.2em] uppercase mb-1">✅ Por qué funcionó</p>
              <ul className="space-y-0.5">
                {structure.why_it_worked.map((r, i) => (
                  <li key={i} className="text-[11px] text-white/55 flex gap-1.5"><span className="text-green-500/50">›</span>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {structure.why_it_failed?.length > 0 && (
            <div>
              <p className="text-[9px] text-red-400/60 tracking-[0.2em] uppercase mb-1">❌ Por qué no funcionó</p>
              <ul className="space-y-0.5">
                {structure.why_it_failed.map((r, i) => (
                  <li key={i} className="text-[11px] text-white/55 flex gap-1.5"><span className="text-red-500/50">›</span>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {post.retention_formula && (
            <div>
              <p className="text-[9px] text-white/25 tracking-[0.2em] uppercase mb-1">🔄 Fórmula de Retención</p>
              <p className="text-[12px] text-white/70 bg-white/5 rounded-xl px-3 py-2">{post.retention_formula}</p>
            </div>
          )}

          {structure.weak_points?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <p className="w-full text-[9px] text-white/25 tracking-[0.2em] uppercase mb-0.5">⚠️ Puntos Débiles</p>
              {structure.weak_points.map((w, i) => (
                <span key={i} className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400/70 px-2 py-0.5 rounded-full">{w}</span>
              ))}
            </div>
          )}

          {structure.replication_template && (
            <div>
              <p className="text-[9px] text-white/25 tracking-[0.2em] uppercase mb-1">📋 Plantilla para Replicar</p>
              <p className="text-[12px] text-white/60 bg-white/4 border border-white/8 rounded-xl px-3 py-2">{structure.replication_template}</p>
            </div>
          )}
          {structure.improvement_suggestion && (
            <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-2">
              <p className="text-[9px] text-white/25 tracking-[0.2em] uppercase mb-1">💡 Cómo Mejorar</p>
              <p className="text-[11px] text-white/55">{structure.improvement_suggestion}</p>
            </div>
          )}

          {structure.emotional_triggers?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {structure.emotional_triggers.map((t, i) => (
                <span key={i} className="text-[10px] border border-white/12 text-white/45 px-2.5 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Círculo de score animado
function ScoreCircle({ score }) {
  if (!score) return <div className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center">
    <span className="text-[10px] text-white/20">—</span>
  </div>;

  const r = 18, circ = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  const dash = pct * circ;

  return (
    <div className="relative w-11 h-11">
      <svg width="44" height="44" viewBox="0 0 44 44" className="rotate-[-90deg]">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle
          cx="22" cy="22" r={r} fill="none"
          stroke="rgba(255,255,255,0.75)" strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-syne font-extrabold text-[13px] text-white">
        {score}
      </span>
    </div>
  );
}