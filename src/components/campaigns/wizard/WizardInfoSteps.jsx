import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, Loader2 } from "lucide-react";

const inputCls = "w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/25 placeholder:text-white/25";
const labelCls = "text-[11px] text-white/40 tracking-[0.15em] uppercase block mb-1.5";

export default function WizardInfoSteps({ step, form, setForm }) {
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState("");

  const handleCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setImgError("Formato inválido. Usa JPEG, PNG, WebP o GIF."); return;
    }
    if (file.size > 5 * 1024 * 1024) { setImgError("La imagen supera 5MB."); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_url: file_url }));
    setUploading(false);
  };

  if (step === 0) return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Nombre de la campaña *</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Lanzamiento Verano 2026" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Artista / Canción</label>
        <input value={form.artist_name} onChange={e => setForm(f => ({ ...f, artist_name: e.target.value }))} placeholder="Ej: Artista - Canción" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>URL del audio oficial (TikTok u otra plataforma)</label>
        <input value={form.audio_url} onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))} placeholder="https://..." className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Fecha de inicio</label>
          <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Fecha de cierre</label>
          <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Título ({form.title.length}/100)</label>
        <input value={form.title} maxLength={100} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título público de la campaña" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Descripción ({form.description.length}/1500)</label>
        <textarea value={form.description} maxLength={1500} rows={5} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe la campaña para los editores..." className={inputCls + " resize-none"} />
      </div>
      <div>
        <label className={labelCls}>Miniatura (JPEG/PNG/WebP/GIF · máx 5MB)</label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/15 text-[12px] text-white/50 cursor-pointer hover:border-white/30">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {uploading ? "Subiendo..." : "Elegir imagen"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleCover} />
          </label>
          {form.cover_url && <img src={form.cover_url} alt="Miniatura" className="w-16 h-16 rounded-xl object-cover border border-white/10" />}
        </div>
        {imgError && <p className="text-[11px] text-red-400 mt-1.5">{imgError}</p>}
      </div>
    </div>
  );
}