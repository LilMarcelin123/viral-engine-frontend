import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AtSign, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { showAlert } from "@/lib/alerts";
import { PLATFORMS, PLATFORM_LABELS, MAX_PER_PLATFORM, MAX_TOTAL, shortUrl, validateNewAccount } from "@/lib/editorAccounts";

const inputCls = "bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-white/25 placeholder:text-white/25";

export default function EditorAccountsManager({ accounts, onAccountsChanged }) {
  const [platform, setPlatform] = useState("tiktok");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Devuelve true si se guardó. El finally es lo que evita que el botón se
  // quede girando cuando el backend rechaza.
  const persist = async (next) => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ editor_accounts: next });
      onAccountsChanged(next);
      return true;
    } catch (e) {
      showAlert("danger", e.message || "No se pudo guardar la cuenta.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    const err = validateNewAccount(accounts, platform, url);
    if (err) { showAlert("warning", err); return; }
    if (!(await persist([...accounts, { platform, url: url.trim() }]))) return;
    setUrl("");
    showAlert("success", "Cuenta agregada a tu registro.");
  };

  const remove = async (idx) => {
    await persist(accounts.filter((_, i) => i !== idx));
  };

  const missing = PLATFORMS.filter(p => !accounts.some(a => a.platform === p));

  return (
    <div className="bg-card border border-white/6 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <AtSign className="w-4 h-4 text-[#3B6FD4]/60" />
          <h2 className="font-syne font-bold text-white text-[14px]">Mis cuentas registradas</h2>
        </div>
        <span className="text-[11px] text-white/35">{accounts.length}/{MAX_TOTAL}</span>
      </div>
      <p className="text-[11px] text-white/35 mb-4">
        Da de alta las cuentas donde publicas. Máximo {MAX_PER_PLATFORM} por plataforma, mínimo 1 por plataforma.
      </p>

      {missing.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-[11px] text-amber-600 bg-amber-500/8 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Te falta registrar al menos 1 cuenta de: {missing.map(p => PLATFORM_LABELS[p]).join(", ")}.
        </div>
      )}

      <div className="space-y-3 mb-4">
        {PLATFORMS.map(p => {
          const mine = accounts.map((a, i) => ({ ...a, _idx: i })).filter(a => a.platform === p);
          return (
            <div key={p}>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">
                {PLATFORM_LABELS[p]} · {mine.length}/{MAX_PER_PLATFORM}
              </p>
              {mine.length === 0 ? (
                <p className="text-[11px] text-white/25">Sin cuentas.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {mine.map(a => (
                    <span key={a._idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/4 border border-white/8 text-[10px] text-white/55">
                      <span className="truncate max-w-[200px]">{shortUrl(a.url)}</span>
                      <button onClick={() => remove(a._idx)} disabled={saving} className="text-white/30 hover:text-red-400">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <select value={platform} onChange={e => setPlatform(e.target.value)} className={inputCls + " w-32 flex-shrink-0"}>
          {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
        </select>
        <input value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !saving && add()}
          placeholder="https://link-a-tu-cuenta o @usuario" className={inputCls + " flex-1 min-w-[180px]"} />
        <button onClick={add} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-black disabled:opacity-40 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Agregar
        </button>
      </div>
    </div>
  );
}