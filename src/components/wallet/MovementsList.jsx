import { ArrowDownCircle, Lock, Unlock, Send } from "lucide-react";

const TYPES = {
  deposito: { label: "Depósito", icon: ArrowDownCircle, color: "#4ade80", sign: "+" },
  apartado_garantia: { label: "Apartado a garantía", icon: Lock, color: "#fb923c", sign: "" },
  liberacion_garantia: { label: "Garantía liberada", icon: Unlock, color: "#60a5fa", sign: "" },
  pago_editor: { label: "Pago a editor", icon: Send, color: "#f87171", sign: "−" },
};

export default function MovementsList({ movements }) {
  if (!movements.length) return (
    <div className="bg-card border border-white/6 rounded-2xl p-10 text-center">
      <p className="text-white/25 text-[13px]">Sin movimientos registrados.</p>
    </div>
  );
  return (
    <div className="bg-card border border-white/6 rounded-2xl overflow-hidden">
      {movements.map((m, i) => {
        const t = TYPES[m.tipo] || TYPES.deposito;
        const Icon = t.icon;
        return (
          <div key={m.id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== movements.length - 1 ? "border-b border-white/4" : ""}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${t.color}15`, border: `1px solid ${t.color}30` }}>
              <Icon className="w-4 h-4" style={{ color: t.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/85">{t.label}{m.campaign_name ? ` · ${m.campaign_name}` : ""}</p>
              <p className="text-[10px] text-white/30 truncate">
                {new Date(m.created_date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                {m.hecho_por ? ` · ${m.hecho_por}` : ""}{m.nota ? ` · ${m.nota}` : ""}
              </p>
            </div>
            <p className="text-[13px] font-syne font-bold flex-shrink-0" style={{ color: t.color }}>
              {t.sign}${(m.monto || 0).toLocaleString("es-MX")}
            </p>
          </div>
        );
      })}
    </div>
  );
}