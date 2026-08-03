import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import WizardInfoSteps from "./wizard/WizardInfoSteps";
import WizardContentSteps from "./wizard/WizardContentSteps";
import WizardBudgetSteps from "./wizard/WizardBudgetSteps";

const STEPS = ["Datos base", "Imagen y detalles", "Material fuente", "Pautas y plataformas", "Presupuesto", "Asignación"];

export default function CampaignWizard({ open, onClose, users, onCreated }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", artist_name: "", audio_url: "", start_date: "", end_date: "",
    title: "", description: "", cover_url: "",
    source_materials: [], guidelines: "", target_platforms: ["tiktok", "instagram"],
    budget: "", num_videos: "", client_id: "", editor_ids: [],
  });
  const [libre, setLibre] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      base44.functions.invoke("walletAdmin", { action: "get" })
        .then(r => setLibre(r.data?.wallet?.monto_libre ?? 0))
        .catch(() => setLibre(0));
    }
  }, [open]);

  if (!open) return null;

  const canNext = [
    form.name.trim().length > 0,
    true, true,
    form.target_platforms.length > 0,
    Number(form.budget) > 0 && Number(form.budget) <= (libre ?? 0) &&
      Number(form.num_videos) > 0 &&
      Number(form.budget) >= Number(form.num_videos) * 10,
    true,
  ][step];

  const publish = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("campaignAdmin", { action: "create", ...form, budget: Number(form.budget), num_videos: Number(form.num_videos) });
      onCreated();
      onClose();
      setStep(0);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#0a0910] border border-white/12 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <h3 className="font-syne font-bold text-white text-[15px]">Crear Campaña · Paso {step + 1} de 6</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/80"><X className="w-4 h-4" /></button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 px-6 pt-4 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1">
              <div className={cn("h-1 rounded-full", i <= step ? "" : "bg-white/8")}
                style={i <= step ? { background: "linear-gradient(90deg,#143A8C,#3B6FD4)" } : {}} />
              <p className={cn("text-[9px] mt-1 hidden md:block", i === step ? "text-white/70" : "text-white/25")}>{s}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {step <= 1 && <WizardInfoSteps step={step} form={form} setForm={setForm} />}
          {(step === 2 || step === 3) && <WizardContentSteps step={step} form={form} setForm={setForm} />}
          {step >= 4 && <WizardBudgetSteps step={step} form={form} setForm={setForm} libre={libre} users={users} />}
          {error && <p className="text-[12px] text-red-400 mt-3">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex justify-between flex-shrink-0">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0 || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-[13px] text-white/50 hover:text-white/80 disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-semibold text-black disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={publish} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-black disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Publicando..." : "Publicar campaña"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}