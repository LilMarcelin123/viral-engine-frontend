import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Flame, Eye, TrendingUp, Zap, ArrowRight, Instagram, Facebook, Music2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

const COLORS = [
  "#ffffff", "#1F47A1", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"
];

const TOOLTIP_STYLE = {
  background: "#0f0f12",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "#f0f0f0",
  fontSize: 12,
};

const PlatformIcon = ({ platform, className }) => {
  if (platform === "instagram") return <Instagram className={className} />;
  if (platform === "facebook") return <Facebook className={className} />;
  return <Music2 className={className} />;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Ranking() {
  const { filterProfilesByAccess, filterPostsByAccess } = useUserRole();
  const [profiles, setProfiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("viralidad"); // viralidad | alcance | engagement | posts
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      base44.entities.Profile.filter({ scrape_status: "done" }),
      base44.entities.Post.list("-virality_score", 500),
    ]).then(([p, po]) => {
      const accessibleP = filterProfilesByAccess(p);
      const ids = accessibleP.map(x => x.id);
      setProfiles(accessibleP);
      setPosts(filterPostsByAccess(po, ids));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );

  if (profiles.length === 0) return (
    <div className="p-8 text-center py-32">
      <p className="text-5xl mb-4">🏆</p>
      <p className="font-syne text-xl font-bold text-white mb-2">Sin datos aún</p>
      <p className="text-white/30 text-sm mb-6">Agrega y scrapea perfiles para ver el ranking comparativo</p>
      <Link to="/profiles">
        <button className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold">
          Ir a Perfiles
        </button>
      </Link>
    </div>
  );

  // ── Enriquecer perfiles con métricas de sus posts ──
  const enriched = profiles.map((p, i) => {
    const myPosts = posts.filter(po => po.profile_id === p.id);
    const analyzed = myPosts.filter(po => po.ai_analysis_done);
    const viralCount = myPosts.filter(po => (po.virality_score || 0) >= 35).length;
    const avgVirality = myPosts.length
      ? myPosts.reduce((a, po) => a + (po.virality_score || 0), 0) / myPosts.length
      : 0;
    const viralPct = myPosts.length ? (viralCount / myPosts.length) * 100 : 0;
    const topPost = myPosts.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0))[0];
    const totalViews = myPosts.reduce((a, po) => a + (po.views || 0), 0);
    return {
      ...p,
      myPosts,
      analyzed,
      viralCount,
      avgVirality: +avgVirality.toFixed(1),
      viralPct: +viralPct.toFixed(1),
      topPost,
      totalViews,
      color: COLORS[i % COLORS.length],
    };
  });

  // Rankings por dimensión
  const byVirality   = [...enriched].sort((a, b) => b.avgVirality - a.avgVirality);
  const byFollowers  = [...enriched].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0));
  const byEngagement = [...enriched].sort((a, b) => (b.avg_engagement_rate || 0) - (a.avg_engagement_rate || 0));
  const byViralPct   = [...enriched].sort((a, b) => b.viralPct - a.viralPct);

  const currentRanking = {
    viralidad:  byVirality,
    alcance:    byFollowers,
    engagement: byEngagement,
    posts:      byViralPct,
  }[tab];

  const currentMetric = {
    viralidad:  p => p.avgVirality,
    alcance:    p => fmt(p.totalViews || 0),
    engagement: p => (p.avg_engagement_rate || 0) + "%",
    posts:      p => p.viralPct + "%",
  }[tab];

  const currentLabel = {
    viralidad:  "Índice DAN Promedio",
    alcance:    "Vistas Totales",
    engagement: "Engagement Rate",
    posts:      "% Posts Virales",
  }[tab];

  // Radar data: normalizado 0-100 para cada dimensión
  const maxFollowers = Math.max(...enriched.map(p => p.followers || 0)) || 1;
  const maxViews     = Math.max(...enriched.map(p => p.avg_views || 0)) || 1;
  const maxEng       = Math.max(...enriched.map(p => p.avg_engagement_rate || 0)) || 1;
  const maxViral     = Math.max(...enriched.map(p => p.avgVirality)) || 1;
  const maxViralPct  = Math.max(...enriched.map(p => p.viralPct)) || 1;

  const radarData = [
    { axis: "Seguidores",  ...Object.fromEntries(enriched.map(p => [p.username, +((p.followers || 0) / maxFollowers * 100).toFixed(1)])) },
    { axis: "Avg Views",   ...Object.fromEntries(enriched.map(p => [p.username, +((p.avg_views || 0) / maxViews * 100).toFixed(1)])) },
    { axis: "Engagement",  ...Object.fromEntries(enriched.map(p => [p.username, +((p.avg_engagement_rate || 0) / maxEng * 100).toFixed(1)])) },
    { axis: "Viralidad",   ...Object.fromEntries(enriched.map(p => [p.username, +(p.avgVirality / maxViral * 100).toFixed(1)])) },
    { axis: "% Virales",   ...Object.fromEntries(enriched.map(p => [p.username, +(p.viralPct / maxViralPct * 100).toFixed(1)])) },
  ];

  // Bar chart comparativo
  const barMetricKey = { viralidad: "avgVirality", alcance: "totalViews", engagement: "avg_engagement_rate", posts: "viralPct" }[tab];
  const barData = enriched.map(p => ({
    name: "@" + p.username,
    value: p[barMetricKey] || 0,
    color: p.color,
  }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-10">
        <p className="text-[10px] text-white/30 tracking-[0.28em] uppercase mb-2">Análisis Global</p>
        <h1 className="font-syne text-2xl md:text-4xl font-extrabold text-white mb-1.5 text-balance">Ranking Comparativo</h1>
        <p className="text-white/40 text-sm">Viralidad y éxito de cada artista frente a los demás</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-card border border-white/6 rounded-xl w-full sm:w-fit mb-6 md:mb-8 overflow-x-auto">
        {[
          { key: "viralidad",  label: "🔥 Viralidad" },
          { key: "alcance",    label: "👥 Alcance" },
          { key: "engagement", label: "⚡ Engagement" },
          { key: "posts",      label: "🎯 % Virales" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 md:px-5 py-2.5 rounded-lg text-[12px] font-medium transition-colors duration-150 tracking-wide whitespace-nowrap flex-shrink-0",
              tab === key ? "bg-white text-black" : "text-white/40 hover:text-white/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Ranking list */}
        <div className="space-y-3">
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-medium mb-4">{currentLabel}</p>
          {currentRanking.map((p, i) => {
            const isTop = i === 0;
            const pct = (() => {
              const top = currentRanking[0];
              const raw = p[barMetricKey] || 0;
              const topRaw = top[barMetricKey] || 0;
              return topRaw > 0 ? (raw / topRaw) * 100 : 0;
            })();
            return (
                <div key={p.id} onClick={() => navigate(`/profiles/${p.id}`)} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-white/15 hover:bg-white/4 cursor-pointer",
                  isTop ? "border-white/20 bg-white/6" : "border-white/6 bg-card"
                )}>
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    {i < 3
                      ? <span className="text-xl">{MEDALS[i]}</span>
                      : <span className="font-syne font-bold text-white/25 text-sm">{i + 1}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white/8 flex items-center justify-center"
                    style={{ border: `1px solid ${p.color}40` }}>
                    {p.profile_pic_url
                      ? <img src={p.profile_pic_url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = "none"} />
                      : <PlatformIcon platform={p.platform} className="w-4 h-4 text-white/40" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-space font-semibold text-white/90 text-sm">@{p.username}</p>
                      {isTop && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60 uppercase tracking-wide">#1</span>}
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: p.color }}
                      />
                    </div>
                  </div>

                  {/* Metric value */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="font-syne font-extrabold text-lg" style={{ color: isTop ? p.color : "rgba(255,255,255,0.7)" }}>
                      {currentMetric(p)}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-white/25">{p.myPosts.length} posts</p>
                      {p.topPost?.url && (
                        <a href={p.topPost.url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] text-white/30 hover:text-white/70 transition-colors flex items-center gap-0.5 border border-white/10 hover:border-white/25 px-1.5 py-0.5 rounded-md">
                          <ArrowRight className="w-2.5 h-2.5" /> top video
                        </a>
                      )}
                    </div>
                  </div>
                </div>
            );
          })}
        </div>

        {/* Radar spider */}
        <div className="bg-card border border-white/6 rounded-2xl p-4 md:p-6">
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-medium mb-1">Análisis 360°</p>
          <h2 className="font-syne font-bold text-white mb-5">Perfil Completo</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "Inter" }} />
              {enriched.slice(0, 5).map((p, i) => (
                <Radar
                  key={p.id}
                  name={"@" + p.username}
                  dataKey={p.username}
                  stroke={p.color}
                  fill={p.color}
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
              ))}
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart comparativo */}
      <div className="bg-card border border-white/6 rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
        <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-medium mb-1">Comparativa</p>
        <h2 className="font-syne font-bold text-white mb-5">{currentLabel} por artista</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)", fontFamily: "Inter" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => tab === "alcance" ? fmt(v) : v} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)", fontFamily: "Inter" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              formatter={v => tab === "alcance" ? fmt(v) : v}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top post de cada artista */}
      <div className="bg-card border border-white/6 rounded-2xl p-4 md:p-6">
        <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase font-medium mb-1">Highlights</p>
        <h2 className="font-syne font-bold text-white mb-5">Post Más Viral de Cada Artista</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {enriched
            .filter(p => p.topPost)
            .sort((a, b) => (b.topPost?.virality_score || 0) - (a.topPost?.virality_score || 0))
            .map(p => (
              <div key={p.id} className="rounded-xl border border-white/8 p-4 bg-white/2 hover:border-white/15 transition-all"
                style={{ borderLeftColor: p.color + "60", borderLeftWidth: 3 }}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-space font-semibold text-white/70">@{p.username}</p>
                  <span className="ml-auto font-syne font-extrabold text-base" style={{ color: p.color }}>
                    {p.topPost.virality_score}
                  </span>
                </div>
                <p className="text-[12px] text-white/55 line-clamp-2 leading-snug mb-2">
                  {p.topPost.caption || "(sin caption)"}
                </p>
                {p.topPost.hook_text && (
                  <p className="text-[11px] text-white/30 italic line-clamp-1">"{p.topPost.hook_text}"</p>
                )}
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-white/30">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(p.topPost.views)}</span>
                  {p.topPost.url && (
                    <a href={p.topPost.url} target="_blank" rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 text-[11px] text-white/40 hover:text-white/80 transition-colors border border-white/10 hover:border-white/25 px-2 py-0.5 rounded-lg">
                      <ArrowRight className="w-3 h-3" /> Ver video
                    </a>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}