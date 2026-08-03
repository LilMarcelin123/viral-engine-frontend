import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Loader2, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const HOOK_LABELS = {
  question: "Pregunta", shock: "Impacto", curiosity: "Curiosidad", story: "Historia",
  how_to: "How-to", list: "Lista", challenge: "Reto", other: "Otro",
};
const fmt = (n) => (n || 0) >= 1000000 ? `${((n || 0) / 1000000).toFixed(1)}M` : (n || 0) >= 1000 ? `${((n || 0) / 1000).toFixed(0)}K` : `${n || 0}`;

const tooltipStyle = {
  background: "#0a0912", border: "1px solid rgba(31,71,161,0.3)",
  borderRadius: "10px", fontSize: "12px", color: "#fff",
};

export default function TrendReport() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Post.filter({ ai_analysis_done: true }, "-views", 300)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  // Aggregate by hook type
  const byHook = {};
  posts.forEach(p => {
    const t = p.hook_type || "other";
    if (!byHook[t]) byHook[t] = { count: 0, views: 0, eng: 0, score: 0 };
    byHook[t].count += 1;
    byHook[t].views += p.views || 0;
    byHook[t].eng += p.engagement_rate || 0;
    byHook[t].score += p.virality_score || 0;
  });
  const hookData = Object.entries(byHook)
    .map(([type, s]) => ({
      name: HOOK_LABELS[type] || type,
      avgViews: Math.round(s.views / s.count),
      avgEng: Math.round((s.eng / s.count) * 100) / 100,
      avgScore: Math.round(s.score / s.count),
      count: s.count,
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  const topStrategies = [...posts]
    .filter(p => p.hook_text)
    .sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0))
    .slice(0, 8);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Reporte de Tendencias</h1>
        </div>
        <p className="text-white/35 text-sm">Qué ganchos y estrategias están funcionando mejor ahora mismo</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-sm">Aún no hay videos analizados por la IA para generar tendencias.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-syne font-bold text-white text-[14px] mb-4">Vistas promedio por tipo de hook</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hookData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <YAxis tickFormatter={fmt} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(v), "Vistas prom."]} cursor={{ fill: "rgba(59,111,212,0.06)" }} />
                  <Bar dataKey="avgViews" fill="#3B6FD4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-syne font-bold text-white text-[14px] mb-4">Score viral promedio por tipo de hook</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[...hookData].sort((a, b) => b.avgScore - a.avgScore)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Score prom."]} cursor={{ fill: "rgba(59,111,212,0.06)" }} />
                  <Bar dataKey="avgScore" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="font-syne font-bold text-white text-[14px]">Estrategias que mejor funcionan</h3>
          </div>
          <div className="space-y-2">
            {topStrategies.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-syne font-bold text-[13px]"
                  style={{ background: "rgba(31,71,161,0.12)", color: "#5B8DEF", border: "1px solid rgba(31,71,161,0.25)" }}>
                  {p.virality_score || 0}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/85">"{p.hook_text}"</p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {HOOK_LABELS[p.hook_type] || "Hook"} · {fmt(p.views)} vistas · {p.engagement_rate || 0}% engagement
                    {p.topic ? ` · ${p.topic}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}