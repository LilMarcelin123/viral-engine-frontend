import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Loader2, Flame, Eye } from "lucide-react";

const HOOK_LABELS = {
  question: "Pregunta", shock: "Impacto", curiosity: "Curiosidad", story: "Historia",
  how_to: "How-to", list: "Lista", challenge: "Reto", other: "Otro",
};
const fmt = (n) => (n || 0) >= 1000000 ? `${((n || 0) / 1000000).toFixed(1)}M` : (n || 0) >= 1000 ? `${((n || 0) / 1000).toFixed(0)}K` : `${n || 0}`;

export default function StrategyGuide() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hookFilter, setHookFilter] = useState("all");

  useEffect(() => {
    base44.entities.Post.filter({ ai_analysis_done: true }, "-virality_score", 200)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  const analyzed = posts.filter(p => p.hook_text || p.retention_formula);

  // Hook type performance summary
  const byType = {};
  analyzed.forEach(p => {
    const t = p.hook_type || "other";
    if (!byType[t]) byType[t] = { count: 0, views: 0, score: 0 };
    byType[t].count += 1;
    byType[t].views += p.views || 0;
    byType[t].score += p.virality_score || 0;
  });
  const typeSummary = Object.entries(byType)
    .map(([type, s]) => ({ type, count: s.count, avgViews: Math.round(s.views / s.count), avgScore: Math.round(s.score / s.count) }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const filtered = hookFilter === "all" ? analyzed : analyzed.filter(p => (p.hook_type || "other") === hookFilter);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Guía de Contenido</h1>
        </div>
        <p className="text-white/35 text-sm">Biblioteca de hooks y fórmulas de retención detectadas por la IA</p>
      </div>

      {analyzed.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-sm">Aún no hay posts analizados por la IA. Ejecuta un análisis desde Fórmulas.</p>
        </div>
      ) : (
        <>
          {/* Hook type ranking */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {typeSummary.slice(0, 4).map((t, i) => (
              <div key={t.type} className="p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  {i === 0 && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                  <span className="text-[12px] font-semibold" style={{ color: "#3B6FD4" }}>{HOOK_LABELS[t.type] || t.type}</span>
                </div>
                <p className="text-lg font-syne font-bold text-white">{t.avgScore}<span className="text-[11px] text-white/30 font-normal"> score</span></p>
                <p className="text-[10px] text-white/35">{fmt(t.avgViews)} vistas prom. · {t.count} posts</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {["all", ...typeSummary.map(t => t.type)].map(t => (
              <button key={t} onClick={() => setHookFilter(t)}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={hookFilter === t
                  ? { background: "linear-gradient(135deg,#3B6FD4,#143A8C)", color: "#000" }
                  : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                {t === "all" ? "Todos" : HOOK_LABELS[t] || t}
              </button>
            ))}
          </div>

          {/* Strategy cards */}
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(31,71,161,0.12)", color: "#5B8DEF", border: "1px solid rgba(31,71,161,0.25)" }}>
                      {HOOK_LABELS[p.hook_type] || "Hook"}
                    </span>
                    {p.topic && <span className="text-[10px] text-white/30">{p.topic}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/40 flex-shrink-0">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(p.views)}</span>
                    <span className="font-bold" style={{ color: (p.virality_score || 0) >= 50 ? "#34d399" : "#3B6FD4" }}>
                      {p.virality_score || 0}
                    </span>
                  </div>
                </div>
                {p.hook_text && (
                  <p className="text-[13px] text-white/85 font-medium mb-1.5">"{p.hook_text}"</p>
                )}
                {p.retention_formula && (
                  <p className="text-[12px] text-white/45 leading-relaxed">
                    <span className="text-white/25 uppercase text-[10px] tracking-wider mr-1.5">Retención:</span>
                    {p.retention_formula}
                  </p>
                )}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-[11px] mt-2 inline-block hover:underline" style={{ color: "rgba(59,111,212,0.6)" }}>
                    Ver post original →
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}