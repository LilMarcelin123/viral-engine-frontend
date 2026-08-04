import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AtSign, Plus, Loader2, Check, Pencil } from "lucide-react";
import { showAlert } from "@/lib/alerts";
import { PLATFORMS, PLATFORM_LABELS, shortUrl, validateNewAccount } from "@/lib/editorAccounts";

const keyOf = (a) => `${a.platform}|${(a.url || "").trim().toLowerCase()}`;
const inputCls = "bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-white/25 placeholder:text-white/25";

export default function EditorAccountsSection({ assignment, campaign, onChanged }) {
  const cuentas = assignment.cuentas || [];
  const [editing, setEditing] = useState(false);
  const [registered, setRegistered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState("tiktok");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => setRegistered(u.editor_accounts || [])).catch(() => {});
  }, []);

  const startEditing = () => {
    setSelected(cuentas.map(keyOf));
    setEditing(true);
  };

  const toggle = (acc) => {
    const k = keyOf(acc);
    setSelected(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  };

  const addNew = async () => {
    const err = validateNewAccount(registered, newPlatform, newUrl);
    if (err) { showAlert("warning", err); return; }
    const acc = { platform: newPlatform, url: newUrl.trim() };
    const next = [...registered, acc];
    setSaving(true);
    try {
      await base44.auth.updateMe({ editor_accounts: next });
    } catch (e) {
      showAlert("danger", e.message || "No se pudo agregar la cuenta.");
      return;
    } finally {
      setSaving(false);
    }
    setRegistered(next);
    setSelected(prev => [...prev, keyOf(acc)]);
    setNewUrl("");
    setAdding(false);
    showAlert("success", "Cuenta agregada a tu registro y seleccionada.");
  };

  const save = async () => {
    const chosen = registered.filter(a => selected.includes(keyOf(a)));
    setSaving(true);
    try {
      // El backend valida las cuentas y recalcula el cap dinámico
      await base44.functions.invoke("editorAssignment", {
        action: "select_accounts",
        assignment_id: assignment.id,
        accounts: chosen.map(a => ({ platform: a.platform, url: a.url })),
      });
      setEditing(false);
      onChanged();
    } catch (e) {
      showAlert("danger", e.response?.data?.error || "No se pudo guardar la selección");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="bg-white/3 border border-white/8 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-1">
            <AtSign className="w-2.5 h-2.5" /> Mis cuentas para esta campaña
          </p>
          <button onClick={startEditing}
            className="flex items-center gap-1 text-[10px] font-semibold text-[#5B8DEF] hover:text-[#93c5fd]">
            <Pencil className="w-2.5 h-2.5" /> {cuentas.length ? "Editar" : "Seleccionar cuentas"}
          </button>
        </div>
        {cuentas.length === 0 ? (
          <p className="text-[11px] text-white/35">Selecciona de tus cuentas dadas de alta o da de alta una.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {cuentas.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/4 border border-white/8 text-[10px] text-white/55 hover:text-white/85">
                <span className="uppercase font-semibold text-white/35">{c.platform}</span>
                <span className="truncate max-w-[180px]">{shortUrl(c.url)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-3 mb-3">
      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
        <AtSign className="w-2.5 h-2.5" /> Mis cuentas para esta campaña
      </p>
      <p className="text-[11px] text-white/35 mb-2">Selecciona de tus cuentas dadas de alta o da de alta una.</p>

      {registered.length === 0 && (
        <p className="text-[11px] text-white/30 mb-2">Aún no tienes cuentas registradas: da de alta la primera aquí abajo.</p>
      )}

      <div className="space-y-1.5 mb-2">
        {registered.map((a, i) => {
          const isOn = selected.includes(keyOf(a));
          return (
            <button key={i} onClick={() => toggle(a)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left border transition-all ${
                isOn ? "bg-[#3B6FD4]/10 border-[#3B6FD4]/30" : "bg-white/3 border-white/8 hover:border-white/15"}`}>
              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border ${
                isOn ? "bg-[#1F47A1] border-[#1F47A1]" : "border-white/20"}`}>
                {isOn && <Check className="w-2.5 h-2.5 text-white" style={{ color: "#fff" }} />}
              </span>
              <span className="text-[10px] uppercase font-semibold text-white/35 w-16 flex-shrink-0">{PLATFORM_LABELS[a.platform] || a.platform}</span>
              <span className="text-[11px] text-white/60 truncate">{shortUrl(a.url)}</span>
            </button>
          );
        })}
      </div>

      {adding ? (
        <div className="flex gap-2 items-center mb-2 flex-wrap">
          <select value={newPlatform} onChange={e => setNewPlatform(e.target.value)} className={inputCls + " w-28 flex-shrink-0"}>
            {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
          </select>
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !saving && addNew()}
            placeholder="https://link-a-tu-cuenta" className={inputCls + " flex-1 min-w-[140px]"} />
          <button onClick={addNew} disabled={saving}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>OK</button>
          <button onClick={() => setAdding(false)} className="text-[11px] text-white/40 hover:text-white/70">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1 mb-2 text-[11px] text-[#5B8DEF] hover:text-[#93c5fd]">
          <Plus className="w-3 h-3" /> Dar de alta una cuenta nueva
        </button>
      )}

      <div className="flex justify-end gap-2 mt-1">
        <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-white/50 hover:text-white/80">Cancelar</button>
        <button onClick={save} disabled={saving || selected.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar selección
        </button>
      </div>
    </div>
  );
}