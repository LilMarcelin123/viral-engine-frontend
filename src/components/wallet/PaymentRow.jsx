import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle } from "lucide-react";

const fmt = (n) => `$${(n || 0).toLocaleString("es-MX")}`;

export default function PaymentRow({ payment, editor, campaign, onPaid }) {
  const [marking, setMarking] = useState(false);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isPaid = payment.status === "pagado";

  const mark = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("markPayment", { payment_id: payment.id, reference });
      onPaid();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-white/6 rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px]">
          <p className="text-[13px] font-semibold text-white">{editor?.full_name || editor?.email || "Editor"}</p>
          <p className="text-[11px] text-white/35">
            {editor?.paypal_email ? `PayPal: ${editor.paypal_email}` : "⚠ Sin correo PayPal"} · {campaign?.name || "Campaña"}
          </p>
        </div>
        <div className="flex gap-2 text-[10px] flex-wrap">
          {[["Base", payment.base_pay], ["Escalón", payment.clip_bonus], ["Acumulado", payment.accumulated_bonus], ["Premio #1", payment.top_prize]].map(([l, v]) => (
            <span key={l} className="px-2 py-1 rounded-lg bg-white/4 border border-white/8 text-white/50">
              {l}: <span className="text-white/85 font-semibold">{fmt(v)}</span>
            </span>
          ))}
        </div>
        <p className="font-syne font-extrabold text-[16px] text-white">{fmt(payment.total)}</p>
        {isPaid ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Pagado
          </span>
        ) : (
          <button onClick={() => setMarking(m => !m)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black"
            style={{ background: "linear-gradient(135deg,#4ade80,#16a34a)" }}>
            Marcar como pagado
          </button>
        )}
      </div>
      {isPaid && (payment.payment_reference || payment.paid_at) && (
        <p className="text-[10px] text-white/30 mt-2">
          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("es-MX") : ""}
          {payment.payment_reference ? ` · Ref: ${payment.payment_reference}` : ""}
          {payment.marked_by ? ` · por ${payment.marked_by}` : ""}
        </p>
      )}
      {marking && !isPaid && (
        <div className="flex gap-2 mt-3 items-center">
          <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Referencia de la transferencia"
            className="flex-1 bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-white/25 placeholder:text-white/25" />
          <button onClick={mark} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-black disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#4ade80,#16a34a)" }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Confirmar
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
    </div>
  );
}