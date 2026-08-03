import { useState } from "react";
import { Music2 } from "lucide-react";

function ImgWithFallback({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
      <Music2 className="w-5 h-5 text-white/20" />
    </div>
  );
  return (
    <img
      src={src}
      alt=""
      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
      onError={() => setFailed(true)}
    />
  );
}
import { Button } from "@/components/ui/button";
import { Eye, Heart, MessageCircle, Share2, Sparkles, Loader2, ExternalLink } from "lucide-react";
import ViralScoreBadge from "./ViralScoreBadge";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

const hookTypeColors = {
  question: "border-white/15 text-white/45",
  shock: "border-white/15 text-white/45",
  curiosity: "border-white/15 text-white/45",
  story: "border-white/15 text-white/45",
  how_to: "border-white/15 text-white/45",
  list: "border-white/15 text-white/45",
  challenge: "border-white/15 text-white/45",
  other: "border-white/15 text-white/45"
};

export default function PostCard({ post, onAnalyzed }) {
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
    <div className={cn(
      "bg-card border border-white/6 rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/12",
      expanded && "border-white/10"
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {post.thumbnail_url && (
            <ImgWithFallback src={post.thumbnail_url} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <ViralScoreBadge score={post.virality_score} size="sm" />
              {post.hook_type && (
                <span className={cn("text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border uppercase", hookTypeColors[post.hook_type] || hookTypeColors.other)}>
                  {post.hook_type}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground line-clamp-2 leading-snug">
              {post.caption || "(sin caption)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(post.views)}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmt(post.likes)}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{fmt(post.comments)}</span>
          {post.shares > 0 && <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{fmt(post.shares)}</span>}
          <span className="ml-auto font-medium text-foreground">{post.engagement_rate}% eng</span>
        </div>

        <div className="flex gap-2">
          {!post.ai_analysis_done ? (
            <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing} className="flex-1 gap-1.5 text-xs">
              {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {analyzing ? "Analizando IA..." : "Analizar con IA"}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="flex-1 gap-1.5 text-xs text-primary">
              <Sparkles className="w-3 h-3" />
              {expanded ? "Ocultar fórmula" : "Ver fórmula viral"}
            </Button>
          )}
          {post.url && (
            <a href={post.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="px-2"><ExternalLink className="w-3.5 h-3.5" /></Button>
            </a>
          )}
        </div>
      </div>

      {expanded && post.ai_analysis_done && (
        <div className="border-t border-white/6 p-4 bg-white/2 space-y-3">

          {/* Veredicto principal */}
          {structure.performance_verdict && (
            <div className={cn(
              "rounded-xl px-4 py-3 border text-sm font-semibold",
              structure.worked
                ? "bg-green-500/10 border-green-500/25 text-green-400"
                : "bg-red-500/10 border-red-500/25 text-red-400"
            )}>
              {structure.performance_verdict}
            </div>
          )}

          {/* Por qué funcionó / por qué no */}
          <div className="grid grid-cols-1 gap-3">
            {structure.why_it_worked?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-green-400/70 uppercase tracking-[0.18em] mb-1.5">✅ Por qué funcionó</p>
                <ul className="space-y-1">
                  {structure.why_it_worked.map((r, i) => (
                    <li key={i} className="text-[12px] text-white/60 flex gap-2">
                      <span className="text-green-500/60 mt-0.5 flex-shrink-0">›</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {structure.why_it_failed?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-[0.18em] mb-1.5">❌ Por qué no funcionó</p>
                <ul className="space-y-1">
                  {structure.why_it_failed.map((r, i) => (
                    <li key={i} className="text-[12px] text-white/60 flex gap-2">
                      <span className="text-red-500/60 mt-0.5 flex-shrink-0">›</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Hook */}
          {post.hook_text && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em]">🎣 Hook</p>
                {structure.hook_strength && (
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                    structure.hook_strength === "strong" ? "bg-green-500/15 text-green-400" :
                    structure.hook_strength === "medium" ? "bg-[#1F47A1]/15 text-[#3B6FD4]" :
                    "bg-red-500/15 text-red-400"
                  )}>
                    {structure.hook_strength === "strong" ? "Fuerte" : structure.hook_strength === "medium" ? "Medio" : "Débil"}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white/70 bg-white/5 rounded-xl p-3 border border-white/8">"{post.hook_text}"</p>
              {structure.hook_analysis && (
                <p className="text-[11px] text-white/35 mt-1.5 px-1">{structure.hook_analysis}</p>
              )}
            </div>
          )}

          {/* Fórmula de retención */}
          {post.retention_formula && (
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-1">🔄 Fórmula de Retención</p>
              <p className="text-sm bg-white/4 rounded-xl p-3 border border-white/8 text-white/65">{post.retention_formula}</p>
            </div>
          )}

          {/* Puntos débiles */}
          {structure.weak_points?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-1.5">⚠️ Puntos Débiles</p>
              <div className="flex flex-wrap gap-1.5">
                {structure.weak_points.map((w, i) => (
                  <span key={i} className="text-[11px] bg-red-500/10 border border-red-500/20 text-red-400/80 px-2.5 py-0.5 rounded-full">{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Disparadores emocionales */}
          {structure.emotional_triggers?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-1.5">⚡ Disparadores Emocionales</p>
              <div className="flex flex-wrap gap-1.5">
                {structure.emotional_triggers.map((t, i) => (
                  <span key={i} className="text-[11px] bg-white/6 border border-white/10 text-white/50 px-2.5 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Plantilla + mejora */}
          {structure.replication_template && (
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-1">📋 Plantilla para Replicar</p>
              <p className="text-[12px] bg-white/4 border border-white/8 text-white/60 rounded-xl p-3">{structure.replication_template}</p>
            </div>
          )}
          {structure.improvement_suggestion && (
            <div className="bg-white/4 border border-white/10 rounded-xl p-3">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.18em] mb-1">💡 Cómo Mejorar</p>
              <p className="text-[12px] text-white/55">{structure.improvement_suggestion}</p>
            </div>
          )}

          {post.topic && (
            <div className="flex gap-4 pt-1 border-t border-white/6">
              <div>
                <p className="text-[10px] text-white/25 mb-0.5">Tema</p>
                <p className="text-[12px] font-semibold text-white/60">{post.topic}</p>
              </div>
              {post.topic_category && (
                <div>
                  <p className="text-[10px] text-white/25 mb-0.5">Categoría</p>
                  <p className="text-[12px] font-semibold text-white/60">{post.topic_category}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}