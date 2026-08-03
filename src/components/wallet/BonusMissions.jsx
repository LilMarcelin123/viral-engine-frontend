import { Trophy, Target, Film, CheckCircle, Lock } from "lucide-react";

const fmt = (n) => `$${(n || 0).toLocaleString("es-MX")}`;
const fmtV = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? (n / 1_000).toFixed(0) + "K" : String(n || 0);

function TierBar({ tier, current }) {
  const achieved = current >= tier.views;
  const pct = Math.min(100, (current / tier.views) * 100);
  return (
    <div className={achieved ? "" : "opacity-90"}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {achieved
            ? <CheckCircle className="w-3 h-3 text-green-400" />
            : <Lock className="w-3 h-3 text-white/25" />}
          <p className="text-[11px] text-white/60">{fmtV(tier.views)} vistas</p>
        </div>
        <p className={`text-[11px] font-bold ${achieved ? "text-green-400" : "text-white/45"}`}>
          {achieved ? `¡Desbloqueado! ${fmt(tier.bonus)}` : `${fmt(tier.bonus)} · te faltan ${fmtV(tier.views - current)}`}
        </p>
      </div>
      <div className="h-2 rounded-full bg-white/6 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: achieved ? "linear-gradient(90deg,#4ade80,#16a34a)" : "linear-gradient(90deg,#3B6FD4,#143A8C)" }} />
      </div>
    </div>
  );
}

export default function BonusMissions({ clips, config }) {
  const approved = clips.filter(c => c.qa_status === "aprobado" && !c.is_strike);
  const bestClip = approved.reduce((m, c) => Math.max(m, c.total_views || 0), 0);
  const totalViews = approved.reduce((a, c) => a + (c.total_views || 0), 0);

  const clipTiers = config?.clip_tiers || [];
  const editorTiers = config?.editor_tiers || [];
  const currentClipBonus = clipTiers.filter(t => bestClip >= t.views).reduce((m, t) => Math.max(m, t.bonus), 0);
  const currentEditorBonus = editorTiers.filter(t => totalViews >= t.views).reduce((m, t) => Math.max(m, t.bonus), 0);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-[#3B6FD4]" />
        <h2 className="font-syne font-bold text-white text-[15px]">Misiones y bonos</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Bono por clip */}
        <div className="bg-card border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-white/35" />
              <p className="text-[10px] text-white/35 uppercase tracking-widest">Bono por clip</p>
            </div>
            {currentClipBonus > 0 && (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Te corresponde {fmt(currentClipBonus)}</span>
            )}
          </div>
          <p className="text-[11px] text-white/40 mb-3">Tu mejor clip: <span className="text-white/80 font-semibold">{fmtV(bestClip)} vistas</span>. Cada clip aprobado gana según sus vistas.</p>
          <div className="space-y-3">
            {clipTiers.map((t, i) => <TierBar key={i} tier={t} current={bestClip} />)}
          </div>
        </div>

        {/* Bono acumulado */}
        <div className="bg-card border border-white/6 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-white/35" />
              <p className="text-[10px] text-white/35 uppercase tracking-widest">Bono acumulado</p>
            </div>
            {currentEditorBonus > 0 && (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Te corresponde {fmt(currentEditorBonus)}</span>
            )}
          </div>
          <p className="text-[11px] text-white/40 mb-3">Vistas totales de tus clips aprobados: <span className="text-white/80 font-semibold">{fmtV(totalViews)}</span></p>
          <div className="space-y-3">
            {editorTiers.map((t, i) => <TierBar key={i} tier={t} current={totalViews} />)}
          </div>
        </div>
      </div>
    </div>
  );
}