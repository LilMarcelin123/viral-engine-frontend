import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Eye, TrendingUp, Flame, Instagram, Facebook, Music2, BarChart2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import HooksComparison from "@/components/compare/HooksComparison";
import { useUserRole } from "@/hooks/useUserRole";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

const COLORS = ["hsl(var(--primary))", "#1F47A1", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Compare() {
  const { filterProfilesByAccess, filterPostsByAccess } = useUserRole();
  const [profiles, setProfiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("metricas"); // "metricas" | "hooks"

  useEffect(() => {
    Promise.all([
      base44.entities.Profile.filter({ scrape_status: "done" }),
      base44.entities.Post.list("-virality_score", 500)
    ]).then(([p, po]) => {
      const accessibleP = filterProfilesByAccess(p);
      const ids = accessibleP.map(x => x.id);
      setProfiles(accessibleP);
      setPosts(filterPostsByAccess(po, ids));
      setLoading(false);
    });
  }, []);

  const toggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selected = profiles.filter(p => selectedIds.includes(p.id));

  // Data for charts
  const barData = [
    { metric: "Seguidores", ...Object.fromEntries(selected.map(p => [p.username, p.followers || 0])) },
    { metric: "Avg Views", ...Object.fromEntries(selected.map(p => [p.username, p.avg_views || 0])) },
    { metric: "Avg Likes", ...Object.fromEntries(selected.map(p => [p.username, p.avg_likes || 0])) }
  ];

  // Hook type distribution per profile
  const hookDist = {};
  selected.forEach(p => {
    const profilePosts = posts.filter(po => po.profile_id === p.id && po.hook_type);
    hookDist[p.username] = {};
    profilePosts.forEach(po => {
      hookDist[p.username][po.hook_type] = (hookDist[p.username][po.hook_type] || 0) + 1;
    });
  });

  const hookTypes = ["question", "shock", "curiosity", "story", "how_to", "list", "challenge", "other"];
  const radarData = hookTypes.map(ht => ({
    hook: ht,
    ...Object.fromEntries(selected.map(p => [p.username, hookDist[p.username]?.[ht] || 0]))
  }));

  // Top formulas per profile
  const topFormulas = selected.map(p => {
    const profilePosts = posts.filter(po => po.profile_id === p.id && po.ai_analysis_done && po.retention_formula);
    const sorted = profilePosts.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));
    const formulas = [...new Set(sorted.map(po => po.retention_formula))].slice(0, 3);
    return { profile: p, formulas };
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-space font-bold text-foreground mb-1">Comparar Perfiles</h1>
        <p className="text-muted-foreground text-sm md:text-base">Selecciona hasta 4 perfiles para comparar su estrategia viral</p>
      </div>

      {/* Profile selector */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 mb-6">
        <h2 className="font-space font-semibold text-foreground mb-4">Seleccionar perfiles</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando perfiles...</p>
        ) : profiles.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay perfiles analizados aún. Ve a Perfiles para agregar y scrapear.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {profiles.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const PlatformIcon = p.platform === "instagram" ? Instagram : p.platform === "tiktok" ? Music2 : Facebook;
              const selIdx = selected.findIndex(s => s.id === p.id);
              const color = isSelected ? COLORS[selIdx % COLORS.length] : COLORS[0];
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                    isSelected ? "border-primary bg-accent text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                  style={isSelected ? { borderColor: color } : {}}
                >
                  <PlatformIcon className="w-4 h-4" />
                  @{p.username}
                  {isSelected && <span className="w-2 h-2 rounded-full ml-1" style={{ background: color }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected.length < 2 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">⚖️</p>
          <p className="text-muted-foreground">Selecciona al menos 2 perfiles para comparar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-card border border-white/6 rounded-xl w-fit">
            {[
              { key: "metricas", label: "Métricas" },
              { key: "hooks",    label: "🎣 Hooks Virales" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "px-5 py-2 rounded-lg text-[12px] font-medium transition-all tracking-wide",
                  tab === key ? "bg-white text-black" : "text-white/35 hover:text-white/70"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "hooks" && (
            <HooksComparison selected={selected} posts={posts} colors={COLORS} />
          )}

          {tab === "metricas" && (
          <div className="space-y-6">
          {/* Metrics table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 md:p-6 border-b border-border">
              <h2 className="font-space font-semibold text-foreground">Métricas Clave</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide p-4">Métrica</th>
                    {selected.map((p, i) => (
                      <th key={p.id} className="text-center text-xs font-semibold uppercase tracking-wide p-4" style={{ color: COLORS[i] }}>
                        @{p.username}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Seguidores", key: "followers", fmt: true, icon: Users },
                    { label: "Avg Views", key: "avg_views", fmt: true, icon: Eye },
                    { label: "Avg Likes", key: "avg_likes", fmt: true, icon: TrendingUp },
                    { label: "Engagement %", key: "avg_engagement_rate", fmt: false, icon: BarChart2, suffix: "%" },
                    { label: "Posts analizados", key: null, fmt: false, icon: Flame, compute: p => posts.filter(po => po.profile_id === p.id && po.ai_analysis_done).length }
                  ].map(({ label, key, fmt: doFmt, icon: Icon, suffix, compute }) => {
                    const vals = selected.map(p => compute ? compute(p) : p[key] || 0);
                    const max = Math.max(...vals);
                    return (
                      <tr key={label} className="border-b border-border last:border-0">
                        <td className="p-4 text-sm font-medium text-foreground flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />{label}
                        </td>
                        {selected.map((p, i) => {
                          const val = compute ? compute(p) : p[key] || 0;
                          return (
                            <td key={p.id} className="p-4 text-center">
                              <span className={cn("text-sm font-bold", val === max && vals.some(v => v !== val) && "text-primary")}>
                                {doFmt ? fmt(val) : val}{suffix || ""}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar chart */}
          {radarData.some(r => selected.some(p => r[p.username] > 0)) && (
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <h2 className="font-space font-semibold text-foreground mb-4">Distribución de Tipos de Hook</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="hook" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  {selected.map((p, i) => (
                    <Radar key={p.id} name={`@${p.username}`} dataKey={p.username} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Formulas */}
          {topFormulas.some(tf => tf.formulas.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topFormulas.filter(tf => tf.formulas.length > 0).map(({ profile: p, formulas }, i) => (
                <div key={p.id} className="bg-card border border-white/8 rounded-2xl p-5" style={{ borderColor: COLORS[i] + "30" }}>
                  <p className="font-syne font-semibold text-white/70 mb-3" style={{ color: COLORS[i] }}>@{p.username}</p>
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-2">Top Fórmulas de Retención</p>
                  <div className="space-y-2">
                    {formulas.map((f, idx) => (
                      <div key={idx} className="text-[12px] bg-white/4 rounded-xl p-3 text-white/60 border border-white/6">
                        {idx + 1}. {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}