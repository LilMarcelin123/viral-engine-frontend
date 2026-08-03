import { useMemo } from "react";
import WaveformBar from "@/components/posts/WaveformBar";
import { cn } from "@/lib/utils";

const HOOK_LABELS = {
  question:  "PREGUNTA",
  shock:     "SHOCK",
  curiosity: "CURIOSIDAD",
  story:     "HISTORIA",
  how_to:    "HOW-TO",
  list:      "LISTA",
  challenge: "RETO",
  other:     "OTRO",
};

const COLORS = [
  "rgba(255,255,255,0.85)",
  "#1F47A1",
  "#ec4899",
  "#22d3ee",
];

function ScoreRing({ score, color }) {
  const r = 14, circ = 2 * Math.PI * r;
  const dash = Math.min((score || 0) / 100, 1) * circ;
  return (
    <div className="relative w-9 h-9 flex-shrink-0">
      <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-syne font-bold text-white">
        {score || "—"}
      </span>
    </div>
  );
}

function HookCard({ post, rank, color }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-white/6 bg-white/2 hover:bg-white/4 transition-colors duration-150 group">
      {/* Rank */}
      <span className="text-[10px] font-syne font-bold text-white/20 w-4 flex-shrink-0 mt-1">
        {String(rank).padStart(2, "0")}
      </span>

      {/* Thumbnail */}
      {post.thumbnail_url ? (
        <img src={post.thumbnail_url} alt=""
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-black/40" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {post.hook_type && (
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1 block">
            {HOOK_LABELS[post.hook_type] || post.hook_type}
          </span>
        )}
        <p className="text-[12px] font-semibold text-white/80 leading-snug line-clamp-2 mb-1.5">
          {post.hook_text || post.caption || "(sin hook)"}
        </p>
        <WaveformBar score={post.virality_score || 30} bars={20} />
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
          {post.views > 0 && <span>{post.views >= 1e6 ? (post.views/1e6).toFixed(1)+"M" : post.views >= 1e3 ? (post.views/1e3).toFixed(0)+"K" : post.views} vistas</span>}
          {post.retention_formula && <span className="truncate max-w-[140px]">{post.retention_formula}</span>}
        </div>
      </div>

      {/* Score ring */}
      <ScoreRing score={post.virality_score} color={color} />
    </div>
  );
}

export default function HooksComparison({ selected, posts, colors = COLORS }) {
  // Por cada perfil: top hooks de posts analizados, ordenados por virality_score
  const profileHooks = useMemo(() =>
    selected.map(profile => {
      const profilePosts = posts
        .filter(p => p.profile_id === profile.id && p.hook_text)
        .sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0))
        .slice(0, 6);
      return { profile, posts: profilePosts };
    }),
  [selected, posts]);

  // Resumen de tipos de hook por perfil
  const hookSummary = useMemo(() =>
    selected.map(profile => {
      const pp = posts.filter(p => p.profile_id === profile.id && p.hook_type);
      const counts = pp.reduce((acc, p) => {
        acc[p.hook_type] = (acc[p.hook_type] || 0) + 1;
        return acc;
      }, {});
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const best = pp.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0))[0];
      return { profile, top, best, total: pp.length };
    }),
  [selected, posts]);

  if (selected.length < 2) return null;

  return (
    <div className="space-y-5">
      {/* ── Summary row ── */}
      <div className="grid gap-px bg-white/5 rounded-2xl overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
        {hookSummary.map(({ profile, top, best, total }, i) => (
          <div key={profile.id} className="bg-background px-5 py-4">
            {/* Profile name */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i] }} />
              <p className="text-[11px] font-semibold text-white/60 truncate">@{profile.username}</p>
            </div>

            {/* Top hook types */}
            <div className="space-y-1.5 mb-3">
              {top.length > 0 ? top.map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(count / total) * 100}%`, background: colors[i] }} />
                  </div>
                  <span className="text-[10px] text-white/35 w-20 flex-shrink-0">
                    {HOOK_LABELS[type] || type} ({count})
                  </span>
                </div>
              )) : (
                <p className="text-[11px] text-white/20">Sin datos de hook</p>
              )}
            </div>

            {/* Mejor hook */}
            {best && (
              <div className="border border-white/6 rounded-xl p-3 bg-white/2">
                <p className="text-[9px] text-white/25 tracking-[0.2em] uppercase mb-1">Hook más viral</p>
                <p className="text-[11px] text-white/70 leading-snug line-clamp-2">
                  "{best.hook_text || best.caption}"
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-syne font-bold" style={{ color: colors[i] }}>
                    {best.virality_score} pts
                  </span>
                  {best.hook_type && (
                    <span className="text-[9px] text-white/25 uppercase tracking-wider">
                      {HOOK_LABELS[best.hook_type]}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Side by side hooks ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
        {profileHooks.map(({ profile, posts: hookPosts }, i) => (
          <div key={profile.id} className="bg-card border border-white/6 rounded-2xl overflow-hidden">
            {/* Column header */}
            <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i] }} />
              <div>
                <p className="text-[13px] font-semibold text-white/80">@{profile.username}</p>
                <p className="text-[10px] text-white/25">{hookPosts.length} hooks analizados</p>
              </div>
            </div>

            {/* Hook list */}
            <div className="p-3 space-y-2">
              {hookPosts.length > 0 ? (
                hookPosts.map((post, rank) => (
                  <HookCard key={post.id} post={post} rank={rank + 1} color={colors[i]} />
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[12px] text-white/25">Sin hooks analizados</p>
                  <p className="text-[11px] text-white/15 mt-1">Analiza posts con IA primero</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}