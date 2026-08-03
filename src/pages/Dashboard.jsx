import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Flame, Zap, ArrowRight, Disc3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import VinylRecord from "@/components/profiles/VinylRecord";
import { useUserRole } from "@/hooks/useUserRole";

// Ondas de sonido animadas — estilo ecualizador
function SoundWaves({ bars = 32, height = 40 }) {
  const seeded = useRef(
    Array.from({ length: bars }, (_, i) => {
      const pos = i / bars;
      const env = Math.sin(pos * Math.PI) * 0.65 + 0.2;
      return Math.max(0.12, env * (0.5 + Math.random() * 0.5));
    })
  ).current;

  return (
    <div className="flex items-center gap-[3px]" style={{ height }}>
      {seeded.map((h, i) => (
        <div
          key={i}
          className="rounded-[2px] flex-shrink-0"
          style={{
            width: "3px",
            height: `${h * height}px`,
            background: "rgba(31,71,161,0.4)",
            animation: `soundbar ${0.7 + (i % 7) * 0.12}s ease-in-out ${i * 0.04}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function fmt(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid rgba(31,71,161,0.2)",
  borderRadius: "10px",
  color: "#1F47A1",
  fontSize: 12,
};

export default function Dashboard() {
  const { filterProfilesByAccess, filterPostsByAccess, isCliente } = useUserRole();
  const [profiles, setProfiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Profile.list("-created_date", 50).catch(() => []),
      base44.entities.Post.list("-virality_score", 100).catch(() => []),
    ]).then(([p, po]) => {
      setProfiles(p);
      setPosts(po);
      setLoading(false);
    });
  }, []);

  // Filter data based on user access (clients only see their assigned artists)
  const accessibleProfiles = filterProfilesByAccess(profiles);
  const accessibleProfileIds = accessibleProfiles.map(p => p.id);
  const accessiblePosts = filterPostsByAccess(posts, accessibleProfileIds);

  const doneProfiles   = accessibleProfiles.filter(p => p.scrape_status === "done");
  const analyzedPosts  = accessiblePosts.filter(p => p.ai_analysis_done);
  const viralPosts     = accessiblePosts.filter(p => (p.virality_score || 0) >= 35);
  const totalFollowers = doneProfiles.reduce((a, p) => a + (p.followers || 0), 0);

  const chartData = doneProfiles.map(p => ({
    name: "@" + p.username,
    seguidores: p.followers || 0,
    avgViews: p.avg_views || 0,
  }));

  const hookTypeCounts = {};
  analyzedPosts.forEach(p => {
    if (p.hook_type) hookTypeCounts[p.hook_type] = (hookTypeCounts[p.hook_type] || 0) + 1;
  });
  const hookData = Object.entries(hookTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "Perfiles",        value: doneProfiles.length,  icon: Users,      sub: "analizados" },
    { label: "Seguidores",      value: fmt(totalFollowers),  icon: TrendingUp,  sub: "en total" },
    { label: "Posts Virales",   value: viralPosts.length,    icon: Flame,       sub: "score ≥ 35" },
    { label: "Fórmulas IA",     value: analyzedPosts.length, icon: Zap,         sub: "posts analizados" },
  ];

  return (
    <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto min-h-screen">
      {/* ── HERO HEADER con disco + ondas ── */}
      <div className="relative rounded-2xl overflow-hidden mb-6 md:mb-10"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(31,71,161,0.15)",
          boxShadow: "0 4px 30px rgba(31,71,161,0.1)"
        }}>

        {/* Glow ambiental detrás del disco */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(31,71,161,0.08) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex items-center gap-5 md:gap-8 px-5 md:px-8 py-5 md:py-7">
          {/* Disco giratorio pequeño */}
          <div className="flex-shrink-0">
            <VinylRecord size={72} />
          </div>

          {/* Texto + ondas */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/30 tracking-[0.28em] uppercase font-medium mb-1">Overview</p>
            <h1 className="font-syne text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2 md:mb-3">Dashboard</h1>
            <SoundWaves bars={24} height={28} />
          </div>

          {/* Stats rápidos top-right */}
          <div className="hidden lg:flex flex-col items-end gap-1 flex-shrink-0">
            <p className="text-[10px] text-white/25 tracking-[0.2em] uppercase mb-1">En vivo</p>
            <p className="font-syne font-extrabold text-2xl text-white">{doneProfiles.length} perfiles</p>
            <p className="text-[11px] text-white/30">{viralPosts.length} posts virales</p>
          </div>
        </div>

        <div className="gold-line" />
      </div>

      {/* Client notice */}
      {isCliente && (
        <div className="mb-6 rounded-xl px-4 py-3 flex items-center gap-2"
          style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
          <p className="text-[12px] text-purple-700/80">Viendo únicamente tus campañas asignadas</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-10">
        {stats.map(({ label, value, icon: Icon, sub }, si) => (
          <div
            key={label}
            className="rounded-2xl p-5 transition-all duration-200 overflow-hidden relative group"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(31,71,161,0.12)",
              boxShadow: "0 2px 12px rgba(31,71,161,0.06)",
            }}
            onMouseEnter={e => e.currentTarget.style.border = "1px solid rgba(31,71,161,0.25)"}
            onMouseLeave={e => e.currentTarget.style.border = "1px solid rgba(31,71,161,0.1)"}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-white/35 tracking-[0.15em] uppercase font-medium">{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(31,71,161,0.08)", border: "1px solid rgba(31,71,161,0.15)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "rgba(31,71,161,0.7)" }} />
              </div>
            </div>
            <p className="text-3xl font-syne font-extrabold text-white tracking-tight mb-2">{value}</p>
            {/* Mini waveform decorativa */}
            <div className="flex items-end gap-[2px] h-5 mb-1">
            {Array.from({ length: 14 }, (_, i) => {
              const h = 0.2 + Math.sin((i / 14) * Math.PI + si) * 0.5 + 0.3;
              return (
                <div key={i} className="w-[2px] rounded-full flex-shrink-0"
                  style={{
                    height: `${Math.max(3, h * 18)}px`,
                    background: "linear-gradient(to top, rgba(31,71,161,0.35), rgba(59,111,212,0.7))",
                    animation: `soundbar ${0.9 + (i % 5) * 0.15}s ease-in-out ${i * 0.06 + si * 0.1}s infinite alternate`,
                  }}
                />
              );
            })}
            </div>
            <p className="text-[11px] text-white/25">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-10">
        {chartData.length > 0 && (
          <div className="rounded-2xl p-4 md:p-6" style={{ background: "#ffffff", border: "1px solid rgba(31,71,161,0.12)", boxShadow: "0 2px 12px rgba(31,71,161,0.06)" }}>
            <p className="text-[11px] tracking-[0.2em] uppercase font-medium mb-1" style={{ color: "rgba(31,71,161,0.6)" }}>Alcance</p>
            <h2 className="font-syne font-bold text-white mb-5">Seguidores por Perfil</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,71,161,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "rgba(31,71,161,0.6)", fontFamily: "Inter" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={fmt}
                  tick={{ fontSize: 11, fill: "rgba(31,71,161,0.6)", fontFamily: "Inter" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(31,71,161,0.04)" }}
                />
                <Bar dataKey="seguidores" fill="#1F47A1" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {hookData.length > 0 && (
          <div className="rounded-2xl p-4 md:p-6" style={{ background: "#ffffff", border: "1px solid rgba(31,71,161,0.12)", boxShadow: "0 2px 12px rgba(31,71,161,0.06)" }}>
            <p className="text-[11px] tracking-[0.2em] uppercase font-medium mb-1" style={{ color: "rgba(31,71,161,0.6)" }}>Patrones</p>
            <h2 className="font-syne font-bold text-white mb-5">Tipos de Hook</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hookData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,71,161,0.08)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "rgba(31,71,161,0.6)", fontFamily: "Inter" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  dataKey="name" type="category"
                  tick={{ fontSize: 11, fill: "rgba(31,71,161,0.65)", fontFamily: "Inter" }}
                  width={72} axisLine={false} tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(31,71,161,0.04)" }} />
                <Bar dataKey="value" fill="rgba(59,111,212,0.85)" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Viral Posts */}
      {viralPosts.length > 0 && (
        <div className="rounded-2xl p-4 md:p-6" style={{ background: "#ffffff", border: "1px solid rgba(31,71,161,0.12)", boxShadow: "0 2px 12px rgba(31,71,161,0.06)" }}>
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase font-medium mb-1" style={{ color: "rgba(31,71,161,0.5)" }}>Top</p>
              <h2 className="font-syne font-bold text-white">Posts Virales</h2>
            </div>
            <Link
              to="/formulas"
              className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/80 transition-colors duration-150"
            >
              Ver fórmulas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {viralPosts.slice(0, 5).map((post, idx) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 rounded-xl transition-colors duration-150"
                style={{ background: "rgba(31,71,161,0.03)", border: "1px solid rgba(31,71,161,0.07)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(31,71,161,0.18)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(31,71,161,0.07)"}
              >
                <span className="text-[11px] font-syne font-bold text-white/20 w-4 flex-shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                   <p className="text-[13px] font-medium text-white/80 truncate">
                     {post.caption || "(sin caption)"}
                   </p>
                   <div className="flex items-center gap-2 mt-0.5">
                     {(() => {
                       const profile = accessibleProfiles.find(p => p.id === post.profile_id);
                       return profile ? (
                         <span className="text-[11px] text-white/35 font-medium">@{profile.username}</span>
                       ) : null;
                     })()}
                     {post.hook_text && (
                       <p className="text-[11px] text-white/25 truncate">"{post.hook_text}"</p>
                     )}
                   </div>
                 </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[13px] font-syne font-bold text-white">{post.virality_score}</p>
                  <p className="text-[11px] text-white/30">{fmt(post.views)} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {accessibleProfiles.length === 0 && !loading && (
        <div className="text-center py-24">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border border-white/15" />
            <div className="absolute inset-2 rounded-full border border-white/8" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Disc3 className="w-8 h-8 text-white/30" style={{ animation: "spin 6s linear infinite" }} />
            </div>
          </div>
          <h2 className="font-syne text-xl font-bold text-white mb-2">Empieza a espiar</h2>
          <p className="text-[13px] text-white/30 mb-8 max-w-xs mx-auto">
            Agrega perfiles de competidores para analizar su contenido viral
          </p>
          <Link to="/profiles">
            <button className="px-6 py-3 rounded-xl font-semibold text-[13px] transition-colors duration-150 tracking-wide"
              style={{ background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 60%)", color: "#ffffff" }}>
              Agregar primer perfil
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}