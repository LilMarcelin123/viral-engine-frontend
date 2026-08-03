import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const fmt = (n) => `$${(n || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
const inputCls = "w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/25 placeholder:text-white/25";
const labelCls = "text-[11px] text-white/40 tracking-[0.15em] uppercase block mb-1.5";

export default function WizardBudgetSteps({ step, form, setForm, libre, users }) {
  const budget = Number(form.budget) || 0;
  const numVideos = Number(form.num_videos) || 0;
  const basePorClip = 10;                       // debe coincidir con app_config
  const poolBase = numVideos * basePorClip;
  const bonus = Math.max(budget - poolBase, 0);
  const presupuestoInsuficiente = budget > 0 && numVideos > 0 && budget < poolBase;

  if (step === 4) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/3 rounded-xl px-4 py-3">
        <p className="text-[12px] text-white/50">Monto libre en billetera</p>
        <p className="font-syne font-bold text-[16px] text-[#4ade80]">{libre === null ? "..." : fmt(libre)}</p>
      </div>
      <div>
        <label className={labelCls}>Presupuesto de la campaña (MXN) *</label>
        <input type="number" min="30" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
          placeholder="Ej: 3000 (se recomienda múltiplo de $30)" className={inputCls} />
        {budget > (libre ?? 0) && <p className="text-[11px] text-red-400 mt-1.5">El monto libre no cubre este presupuesto.</p>}
        {presupuestoInsuficiente && (
          <p className="text-[11px] text-red-400 mt-1.5">
            El presupuesto no alcanza para cubrir el pago base de {numVideos} videos
            ({fmt(poolBase)}).
          </p>
        )}
      </div>

      <div>
        <label className="block text-[11px] text-white/45 mb-1.5">Videos de la campaña</label>
        <input type="number" min="1" step="1" value={form.num_videos || ""}
          onChange={e => setForm(f => ({ ...f, num_videos: e.target.value }))}
          placeholder="Ej. 100"
          className="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(31,71,161,0.2)" }} />
        <p className="text-[10px] text-white/30 mt-1.5">
          Se captura por separado del presupuesto. Define el pago base garantizado
          y el tope de clips de la campaña.
        </p>
      </div>
      {budget > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Derivación automática</p>
          {[
            ["Videos de la campaña", `${numVideos} videos`],
            ["Pago base garantizado", `${fmt(poolBase)} (${numVideos} × $${basePorClip})`],
            ["Pool base (1/3 — $10/video garantizado)", fmt(poolBase)],
            ["Bolsa de bonos (2/3)", fmt(bonus)],
            ["· Sub-bolsa A (60%) — escalones por clip", fmt(bonus * 0.6)],
            ["· Sub-bolsa B (25%) — acumulado por editor", fmt(bonus * 0.25)],
            ["· Sub-bolsa C (15%) — premio clip #1", fmt(bonus * 0.15)],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-[12px]">
              <p className="text-white/45">{l}</p>
              <p className="text-white font-semibold">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const editors = users.filter(u => (u.user_type || "editor") === "editor");
  const clients = users.filter(u => u.user_type === "cliente");

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Editores participantes ({form.editor_ids.length})</label>
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {editors.length === 0 && <p className="text-[12px] text-white/25">No hay editores registrados.</p>}
          {editors.map(u => {
            const sel = form.editor_ids.includes(u.id);
            return (
              <button key={u.id} onClick={() => setForm(f => ({
                ...f, editor_ids: sel ? f.editor_ids.filter(id => id !== u.id) : [...f.editor_ids, u.id]
              }))}
                className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all",
                  sel ? "border-[#3B6FD4]/50 bg-[#3B6FD4]/10" : "border-white/8 bg-white/3 hover:border-white/15")}>
                <div className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                  sel ? "bg-[#3B6FD4] border-[#3B6FD4]" : "border-white/20")}>
                  {sel && <Check className="w-3 h-3 text-black" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-white/85 truncate">{u.full_name || u.email}</p>
                  <p className="text-[10px] text-white/30">{u.content_accounts || 0} cuentas de contenido</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className={labelCls}>Cliente de la campaña (opcional)</label>
        <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
          className={inputCls}>
          <option value="">Sin cliente</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
        </select>
      </div>
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-[12px] space-y-1">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Resumen</p>
        <div className="flex justify-between"><span className="text-white/45">Campaña</span><span className="text-white font-semibold">{form.name}</span></div>
        <div className="flex justify-between"><span className="text-white/45">Presupuesto</span><span className="text-white font-semibold">{fmt(budget)}</span></div>
        <div className="flex justify-between"><span className="text-white/45">Videos</span><span className="text-white font-semibold">{numVideos}</span></div>
        <div className="flex justify-between"><span className="text-white/45">Editores</span><span className="text-white font-semibold">{form.editor_ids.length}</span></div>
        <div className="flex justify-between"><span className="text-white/45">Plataformas</span><span className="text-white font-semibold">{form.target_platforms.join(", ")}</span></div>
      </div>
    </div>
  );
}