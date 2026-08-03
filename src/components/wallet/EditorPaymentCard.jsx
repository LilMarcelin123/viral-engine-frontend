import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const fmt = (n) => `$${(n || 0).toLocaleString("es-MX")}`;

const CONCEPTS = [
  { key: "base_pay", label: "Pago base", desc: "Garantizado por cada clip aprobado" },
  { key: "clip_bonus", label: "Bono por clip (escalones)", desc: "Según las vistas de cada clip aprobado" },
  { key: "accumulated_bonus", label: "Bono acumulado", desc: "Por tus vistas totales en la campaña" },
  { key: "top_prize", label: "🏆 Premio clip #1", desc: "Para el clip con más vistas de la campaña" },
];

export default function EditorPaymentCard({ payment, campaignName }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-white/6 rounded-2xl p-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 flex-wrap text-left">
        <div>
          <p className="text-[13px] font-semibold text-white">{campaignName}</p>
          <p className="text-[10px] text-white/35">{payment.quincena ? `Quincena ${payment.quincena} · ` : ""}Toca para ver el desglose</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-syne font-extrabold text-[16px] text-white">{fmt(payment.total)}</p>
          {payment.status === "pagado" ? (
            <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">Pagado</span>
          ) : (
            <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">Pendiente</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-white/6 space-y-2">
          {CONCEPTS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] text-white/70 font-medium">{label}</p>
                <p className="text-[10px] text-white/30">{desc}</p>
              </div>
              <p className={`text-[13px] font-bold ${payment[key] > 0 ? "text-white" : "text-white/25"}`}>{fmt(payment[key])}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-white/6">
            <p className="text-[12px] font-bold text-white/80">Total</p>
            <p className="font-syne font-extrabold text-[15px] text-white">{fmt(payment.total)}</p>
          </div>
          {payment.status === "pagado" && payment.paid_at && (
            <p className="text-[10px] text-white/30">
              Pagado el {new Date(payment.paid_at).toLocaleDateString("es-MX")}
              {payment.payment_reference ? ` · Ref: ${payment.payment_reference}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}