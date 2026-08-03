import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, Check } from "lucide-react";

const DEFAULTS = {
  key: "main", price_per_video: 30, base_per_clip: 10, pool_base_pct: 33.3333,
  sub_a_pct: 60, sub_b_pct: 25, sub_c_pct: 15,
  clip_tiers: [
    { views: 5000, bonus: 10 }, { views: 10000, bonus: 25 }, { views: 50000, bonus: 75 },
    { views: 100000, bonus: 200 }, { views: 500000, bonus: 600 }, { views: 1000000, bonus: 1500 },
  ],
  editor_tiers: [{ views: 50000, bonus: 30 }, { views: 100000, bonus: 60 }, { views: 200000, bonus: 120 }],
};

const inputCls = "bg-white/4 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:border-white/25 w-full";

function TierEditor({ label, tiers, onChange }) {
  return (
    <div>
      <p className="text-[11px] text-white/40 uppercase tracking-widest mb-2">{label}</p>
      <div className="space-y-1.5">
        {tiers.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input type="number" value={t.views} onChange={e => onChange(tiers.map((r, idx) => idx === i ? { ...r, views: Number(e.target.value) } : r))} className={inputCls} placeholder="Vistas" />
            <span className="text-white/25 text-[11px]">→</span>
            <input type="number" value={t.bonus} onChange={e => onChange(tiers.map((r, idx) => idx === i ? { ...r, bonus: Number(e.target.value) } : r))} className={inputCls} placeholder="Bono $" />
            <button onClick={() => onChange(tiers.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...tiers, { views: 0, bonus: 0 }])}
        className="flex items-center gap-1 mt-2 text-[11px] text-[#5B8DEF] hover:text-[#93c5fd]">
        <Plus className="w-3 h-3" /> Agregar escalón
      </button>
    </div>
  );
}

export default function BonusConfigPanel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.BonusConfig.filter({ key: "main" }).then(async (rows) => {
      if (rows.length) setConfig(rows[0]);
      else setConfig(await base44.entities.BonusConfig.create(DEFAULTS));
    }).catch(() => setConfig(DEFAULTS)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const { id, created_date, updated_date, created_by_id, ...data } = config;
    await base44.entities.BonusConfig.update(config.id, data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading || !config) return <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  const set = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-white/40">Tabuladores y porcentajes del motor de bolsas. Los cambios aplican a los próximos cálculos de pago.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          ["price_per_video", "$ por video (num_videos)"],
          ["base_per_clip", "Base por clip aprobado ($)"],
          ["pool_base_pct", "% presupuesto → pool base"],
          ["sub_a_pct", "% bolsa → Sub-bolsa A"],
          ["sub_b_pct", "% bolsa → Sub-bolsa B"],
          ["sub_c_pct", "% bolsa → Sub-bolsa C"],
        ].map(([key, label]) => (
          <div key={key}>
            <p className="text-[10px] text-white/35 mb-1">{label}</p>
            <input type="number" step="any" value={config[key] ?? ""} onChange={e => set(key, Number(e.target.value))} className={inputCls} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TierEditor label="Sub-bolsa A · Escalones por clip" tiers={config.clip_tiers || []} onChange={t => set("clip_tiers", t)} />
        <TierEditor label="Sub-bolsa B · Acumulado por editor" tiers={config.editor_tiers || []} onChange={t => set("editor_tiers", t)} />
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-black disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
        {saving ? "Guardando..." : saved ? "Guardado" : "Guardar tabuladores"}
      </button>
    </div>
  );
}