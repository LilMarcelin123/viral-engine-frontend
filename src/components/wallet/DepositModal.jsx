import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, ArrowDownCircle, Loader2 } from "lucide-react";

export default function DepositModal({ open, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("walletAdmin", { action: "deposit", amount: Number(amount), note });
      setAmount(""); setNote("");
      onDone();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#0a0910] border border-white/12 rounded-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-[#4ade80]" />
            <h3 className="font-syne font-bold text-white text-[15px]">Registrar depósito</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Monto (MXN)</label>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10000"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/25" />
          </div>
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-1.5">Nota (opcional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: transferencia BBVA 01/07"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/25" />
          </div>
          <p className="text-[11px] text-white/30">Registro manual: solo suma saldo dentro del sistema, no cobra nada real.</p>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-[13px] text-white/50 hover:text-white/80">Cancelar</button>
          <button onClick={submit} disabled={!Number(amount) || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-black disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#4ade80,#16a34a)" }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {saving ? "Registrando..." : "Registrar depósito"}
          </button>
        </div>
      </div>
    </div>
  );
}