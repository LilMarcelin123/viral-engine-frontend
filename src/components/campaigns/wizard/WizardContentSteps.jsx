import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link2, Upload, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = ["tiktok", "instagram", "youtube", "facebook", "x", "snapchat"];
const PLATFORM_LABELS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", facebook: "Facebook", x: "X (Twitter)", snapchat: "Snapchat" };
const inputCls = "w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/25 placeholder:text-white/25";
const labelCls = "text-[11px] text-white/40 tracking-[0.15em] uppercase block mb-1.5";

export default function WizardContentSteps({ step, form, setForm }) {
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const materials = form.source_materials;

  const addLink = () => {
    if (!link.trim() || materials.length >= 10) return;
    setForm(f => ({ ...f, source_materials: [...f.source_materials, { type: "link", url: link.trim(), label: link.trim().slice(0, 60) }] }));
    setLink("");
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || materials.length >= 10) return;
    setFileError("");
    if (!["video/mp4", "video/quicktime", "video/x-msvideo"].includes(file.type)) {
      setFileError("Formato inválido. Usa MP4, MOV o AVI."); return;
    }
    if (file.size > 500 * 1024 * 1024) { setFileError("El archivo supera 500MB."); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, source_materials: [...f.source_materials, { type: "file", url: file_url, label: file.name }] }));
    setUploading(false);
  };

  const remove = (i) => setForm(f => ({ ...f, source_materials: f.source_materials.filter((_, idx) => idx !== i) }));

  if (step === 2) return (
    <div className="space-y-4">
      <p className="text-[12px] text-white/40">Hasta 10 enlaces o archivos (MP4/MOV/AVI · máx 500MB) que los editores usarán como referencia.</p>
      <div className="flex gap-2">
        <input value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()}
          placeholder="https://enlace-al-material..." className={inputCls} />
        <button onClick={addLink} disabled={!link.trim() || materials.length >= 10}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold text-black disabled:opacity-40 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>Agregar</button>
      </div>
      <label className={cn("flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 text-[12px] text-white/50 cursor-pointer hover:border-white/30",
        materials.length >= 10 && "opacity-40 pointer-events-none")}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "Subiendo archivo..." : "Subir archivo de video (MP4/MOV/AVI)"}
        <input type="file" accept="video/mp4,video/quicktime,video/x-msvideo" className="hidden" onChange={handleFile} />
      </label>
      {fileError && <p className="text-[11px] text-red-400">{fileError}</p>}
      <div className="space-y-1.5">
        {materials.map((m, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/8">
            {m.type === "link" ? <Link2 className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> : <Upload className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
            <p className="text-[12px] text-white/60 truncate flex-1">{m.label}</p>
            <button onClick={() => remove(i)} className="text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <p className="text-[10px] text-white/25">{materials.length}/10 materiales</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Pautas de contenido (las verá el editor)</label>
        <textarea value={form.guidelines} rows={6} onChange={e => setForm(f => ({ ...f, guidelines: e.target.value }))}
          placeholder="Reglas de contenido: qué debe incluir el clip, tono, duración mínima, hashtags obligatorios, qué está prohibido..."
          className={inputCls + " resize-none"} />
      </div>
      <div>
        <label className={labelCls}>Plataformas objetivo *</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => {
            const active = form.target_platforms.includes(p);
            return (
              <button key={p} onClick={() => setForm(f => ({
                ...f, target_platforms: active ? f.target_platforms.filter(x => x !== p) : [...f.target_platforms, p]
              }))}
                className={cn("px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all",
                  active ? "text-black border-transparent" : "text-white/45 border-white/10 hover:border-white/25")}
                style={active ? { background: "linear-gradient(135deg,#3B6FD4,#143A8C)" } : {}}>
                {PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}