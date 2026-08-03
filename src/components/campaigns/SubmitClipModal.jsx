import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { X, Send, Plus, Trash2, Loader2 } from "lucide-react";

const DOMAINS = {
  tiktok: ["tiktok.com"],
  instagram: ["instagram.com"],
  youtube: ["youtube.com", "youtu.be"],
};

const shortUrl = (url) => (url || "").replace(/^https?:\/\/(www\.)?/, "").slice(0, 40);

// Extrae el @handle de la URL de una cuenta (tiktok.com/@x, youtube.com/@x, instagram.com/x)
const handleFrom = (url) => {
  const m = (url || "").match(/@([\w.\-]+)/) || (url || "").match(/instagram\.com\/([\w.\-]+)/i);
  return m ? m[1].toLowerCase() : null;
};

export default function SubmitClipModal({ campaign, assignment, onClose, onSubmitted }) {
  const { user } = useAuth();
  const cuentas = assignment?.cuentas || [];
  const [title, setTitle] = useState("");
  const [pubs, setPubs] = useState([{ accountIdx: 0, url: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [todayPubs, setTodayPubs] = useState(null);
  const [campClipCount, setCampClipCount] = useState(0);

  // Carga los clips del editor para validar límites diarios y tope por asignación
  useEffect(() => {
    base44.entities.Clip.filter({ editor_id: user.id }).then(clips => {
      const today = new Date().toDateString();
      const byAccount = {};
      let total = 0;
      for (const c of clips.filter(x => new Date(x.created_date).toDateString() === today)) {
        for (const p of (c.publications || [])) {
          const k = `${p.platform}|${(p.account || "").toLowerCase()}`;
          byAccount[k] = (byAccount[k] || 0) + 1;
          total++;
        }
      }
      setTodayPubs({ byAccount, total });
      setCampClipCount(clips.filter(c => c.campaign_id === campaign.id && c.qa_status !== "rechazado").length);
    }).catch(() => setTodayPubs({ byAccount: {}, total: 0 }));
  }, []);

  const setPub = (i, key, val) => setPubs(p => p.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  const validPubs = pubs.filter(p => p.url.trim());

  const validate = () => {
    // Tope por asignación (cap dinámico)
    const cap = assignment?.cap_dinamico || ((assignment?.asignacion_base || 0) + (assignment?.extras || 0));
    if (cap > 0 && campClipCount >= cap) {
      return `Alcanzaste tu tope de ${cap} clips para esta campaña.`;
    }
    // Límites diarios: 15 publicaciones/día en total, 5 por cuenta
    if (todayPubs) {
      if (todayPubs.total + validPubs.length > 15) {
        return `Límite diario alcanzado: máximo 15 publicaciones al día (llevas ${todayPubs.total}).`;
      }
      const newByAccount = {};
      for (const p of validPubs) {
        const c = cuentas[p.accountIdx];
        if (!c) continue;
        const k = `${c.platform}|${(c.url || "").toLowerCase()}`;
        newByAccount[k] = (newByAccount[k] || 0) + 1;
      }
      for (const [k, n] of Object.entries(newByAccount)) {
        if ((todayPubs.byAccount[k] || 0) + n > 5) {
          return `Límite diario: máximo 5 publicaciones al día por cuenta (${shortUrl(k.split("|")[1])}).`;
        }
      }
    }
    for (const p of validPubs) {
      const cuenta = cuentas[p.accountIdx];
      if (!cuenta) return "Selecciona una cuenta válida.";
      const url = p.url.trim().toLowerCase();
      const domains = DOMAINS[cuenta.platform] || [];
      if (!domains.some(d => url.includes(d))) {
        return `El link "${shortUrl(p.url)}" no es de ${cuenta.platform}. Debe ser de tu cuenta ${shortUrl(cuenta.url)}.`;
      }
      // En TikTok la URL del video incluye el @usuario: validar que sea de SU cuenta
      if (cuenta.platform === "tiktok") {
        const handle = handleFrom(cuenta.url);
        if (handle && !url.includes(`@${handle}`)) {
          return `El link no pertenece a tu cuenta @${handle}. Solo puedes subir clips de las cuentas que registraste.`;
        }
      }
    }
    return null;
  };

  const submit = async () => {
    if (!validPubs.length) { setError("Agrega al menos un link de publicación."); return; }
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    try {
      const now = new Date().toISOString();
      await base44.entities.Clip.create({
        campaign_id: campaign.id, editor_id: user.id,
        title: title.trim() || "Clip", published_at: now,
        qa_status: "pendiente", is_strike: false, frozen: false,
        publications: validPubs.map(p => ({
          platform: cuentas[p.accountIdx].platform,
          account: cuentas[p.accountIdx].url,
          url: p.url.trim(), views: 0,
        })),
        total_views: 0,
      });
      base44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: "editor", accion: "subir_clip", detalle: `Clip subido a "${campaign.name}" (${validPubs.length} publicaciones)` }).catch(() => {});
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e.message || "Error al subir el clip");
      setSaving(false);
    }
  };

  const inputCls = "bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-white/25 placeholder:text-white/25";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#0a0910] border border-white/12 rounded-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="font-syne font-bold text-white text-[15px]">Subir clip · {campaign.name}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/80"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Título del clip</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: POV concierto vs estudio" className={inputCls + " w-full"} />
          </div>
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Publicaciones — solo en tus cuentas registradas</label>
            <div className="space-y-2">
              {pubs.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={p.accountIdx} onChange={e => setPub(i, "accountIdx", Number(e.target.value))} className={inputCls + " w-44 flex-shrink-0"}>
                    {cuentas.map((c, idx) => (
                      <option key={idx} value={idx}>{c.platform} — {shortUrl(c.url)}</option>
                    ))}
                  </select>
                  <input value={p.url} onChange={e => setPub(i, "url", e.target.value)} placeholder="https://link-a-la-publicacion" className={inputCls + " flex-1 min-w-0"} />
                  {pubs.length > 1 && (
                    <button onClick={() => setPubs(rows => rows.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-red-400 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setPubs(p => [...p, { accountIdx: 0, url: "" }])}
              className="flex items-center gap-1 mt-2 text-[11px] text-[#5B8DEF] hover:text-[#93c5fd]">
              <Plus className="w-3 h-3" /> Agregar otra publicación
            </button>
          </div>
          <p className="text-[11px] text-white/30">⚠️ El link debe pertenecer a la cuenta seleccionada. Un clip que incumpla las pautas puede ser rechazado o recibir strike.</p>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-[13px] text-white/50 hover:text-white/80">Cancelar</button>
          <button onClick={submit} disabled={saving || !validPubs.length}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-black disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {saving ? "Enviando..." : "Enviar a revisión"}
          </button>
        </div>
      </div>
    </div>
  );
}