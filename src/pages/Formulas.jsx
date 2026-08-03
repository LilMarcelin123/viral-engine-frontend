import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Copy, Filter, TrendingUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HOOK_TYPES = ["all", "question", "shock", "curiosity", "story", "how_to", "list", "challenge", "other"];
const hookTypeLabels = {
  all: "Todos", question: "Pregunta", shock: "Impacto", curiosity: "Curiosidad",
  story: "Historia", how_to: "Tutorial", list: "Lista", challenge: "Desafío", other: "Otro"
};
const hookTypeColors = {
  question: "bg-purple-100 text-purple-700 border-purple-200",
  shock: "bg-red-100 text-red-700 border-red-200",
  curiosity: "bg-[#7BA5F0] text-yellow-700 border-[#5B8DEF]",
  story: "bg-green-100 text-green-700 border-green-200",
  how_to: "bg-blue-100 text-blue-700 border-blue-200",
  list: "bg-indigo-100 text-indigo-700 border-indigo-200",
  challenge: "bg-orange-100 text-orange-700 border-orange-200",
  other: "bg-gray-100 text-gray-700 border-gray-200"
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function Formulas() {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [hookFilter, setHookFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Post.filter({ ai_analysis_done: true }),
      base44.entities.Profile.list()
    ]).then(([po, p]) => {
      setPosts(po.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0)));
      setProfiles(p);
      setLoading(false);
    });
  }, []);

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

  const filtered = posts.filter(p =>
    (hookFilter === "all" || p.hook_type === hookFilter) &&
    (profileFilter === "all" || p.profile_id === profileFilter)
  );

  // Group by retention formula
  const formulaGroups = {};
  filtered.forEach(p => {
    if (!p.retention_formula) return;
    if (!formulaGroups[p.retention_formula]) formulaGroups[p.retention_formula] = [];
    formulaGroups[p.retention_formula].push(p);
  });

  const sortedGroups = Object.entries(formulaGroups)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-space font-bold text-foreground mb-1">Fórmulas Virales</h1>
        <p className="text-muted-foreground text-sm md:text-base">Patrones de retención y estructura extraídos por IA de los posts más virales</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {HOOK_TYPES.map(ht => (
            <button
              key={ht}
              onClick={() => setHookFilter(ht)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                hookFilter === ht ? "bg-primary text-primary-foreground border-primary" :
                  ht === "all" ? "bg-card border-border text-muted-foreground hover:text-foreground" :
                    hookTypeColors[ht]
              )}
            >
              {hookTypeLabels[ht]}
            </button>
          ))}
        </div>
        {profiles.length > 0 && (
          <select
            value={profileFilter}
            onChange={e => setProfileFilter(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none w-full sm:w-auto sm:ml-auto"
          >
            <option value="all">Todos los perfiles</option>
            {profiles.map(p => <option key={p.id} value={p.id}>@{p.username}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">🤖</p>
          <h3 className="text-lg font-space font-semibold text-foreground mb-2">Sin análisis aún</h3>
          <p className="text-muted-foreground">Ve a un perfil y usa "Analizar con IA" en los posts virales</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Formula groups */}
          {sortedGroups.length > 0 && (
            <div>
              <h2 className="font-space font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Fórmulas más repetidas ({sortedGroups.length})
              </h2>
              <div className="space-y-4">
                {sortedGroups.map(([formula, fPosts]) => {
                  const avgScore = Math.round(fPosts.reduce((a, p) => a + (p.virality_score || 0), 0) / fPosts.length);
                  const hookTypes = [...new Set(fPosts.map(p => p.hook_type).filter(Boolean))];
                  const profilesUsing = [...new Set(fPosts.map(p => profileMap[p.profile_id]?.username).filter(Boolean))];

                  return (
                    <div key={formula} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                              {fPosts.length}× usada
                            </span>
                            <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                              Score promedio: {avgScore}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground font-space">{formula}</p>
                        </div>
                        <CopyButton text={formula} />
                      </div>

                      {hookTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {hookTypes.map(ht => (
                            <span key={ht} className={cn("text-xs px-2 py-0.5 rounded-full border", hookTypeColors[ht] || hookTypeColors.other)}>
                              {hookTypeLabels[ht]}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Usada por: {profilesUsing.map(u => `@${u}`).join(", ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual posts */}
          <div>
            <h2 className="font-space font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Desglose Individual ({filtered.length} posts)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map(post => {
                const profile = profileMap[post.profile_id];
                const structure = (() => { try { return JSON.parse(post.content_structure || "{}"); } catch { return {}; } })();

                return (
                  <div key={post.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {post.hook_type && (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", hookTypeColors[post.hook_type] || hookTypeColors.other)}>
                          {hookTypeLabels[post.hook_type]}
                        </span>
                      )}
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        Score {post.virality_score}
                      </span>
                      {profile && <span className="text-xs text-muted-foreground ml-auto">@{profile.username}</span>}
                    </div>

                    {post.hook_text && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">🎣 Hook</p>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground bg-muted/50 rounded-xl p-2.5 flex-1">"{post.hook_text}"</p>
                          <CopyButton text={post.hook_text} />
                        </div>
                      </div>
                    )}

                    {post.retention_formula && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">🔄 Retención</p>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground bg-muted/50 rounded-xl p-2.5 flex-1">{post.retention_formula}</p>
                          <CopyButton text={post.retention_formula} />
                        </div>
                      </div>
                    )}

                    {structure.replication_template && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">📋 Plantilla</p>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-foreground bg-primary/5 border border-primary/20 rounded-xl p-2.5 flex-1">{structure.replication_template}</p>
                          <CopyButton text={structure.replication_template} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}