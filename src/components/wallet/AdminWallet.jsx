import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wallet, Lock, Unlock, TrendingDown, ArrowDownCircle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DepositModal from "./DepositModal";
import MovementsList from "./MovementsList";
import PaymentsPanel from "./PaymentsPanel";

const fmt = (n) => `$${(n || 0).toLocaleString("es-MX")}`;

export default function AdminWallet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("movements");
  const [showDeposit, setShowDeposit] = useState(false);

  const load = () => {
    base44.functions.invoke("walletAdmin", { action: "get" })
      .then(r => setData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>;

  const w = data?.wallet || {};
  const stats = [
    { label: "Saldo total", value: fmt(w.saldo_total), icon: Wallet, color: "#3B6FD4" },
    { label: "En garantía", value: fmt(w.monto_en_garantia), icon: Lock, color: "#fb923c", sub: "Comprometido en campañas activas" },
    { label: "Monto libre", value: fmt(w.monto_libre), icon: Unlock, color: "#4ade80", sub: "Disponible para asignar" },
    { label: "Gastado 30 días", value: fmt(w.gastado_30_dias), icon: TrendingDown, color: "#f87171", sub: "Pagos a editores" },
    { label: "Total depositado", value: fmt(w.total_depositado), icon: ArrowDownCircle, color: "#a78bfa", sub: "Histórico" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase mb-1">Admin</p>
          <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white">Billetera del Negocio</h1>
          <p className="text-white/35 text-sm mt-1">Sin integración bancaria: depósitos y pagos son registros manuales</p>
        </div>
        <button onClick={() => setShowDeposit(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-black"
          style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
          <Plus className="w-4 h-4" /> Agregar Fondos
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-card border border-white/6 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <p className="text-[10px] text-white/35 tracking-[0.1em] uppercase">{label}</p>
            </div>
            <p className="font-syne font-extrabold text-lg text-white">{value}</p>
            {sub && <p className="text-[9px] text-white/25 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 border-b border-white/8">
        {[{ id: "movements", label: "Movimientos" }, { id: "payments", label: "Pagos a editores" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-4 py-2.5 text-[12px] font-semibold border-b-2 -mb-px transition-all",
              tab === t.id ? "text-[#3B6FD4] border-[#3B6FD4]" : "text-white/40 border-transparent hover:text-white/60")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "movements" && <MovementsList movements={data?.movements || []} />}
      {tab === "payments" && <PaymentsPanel onPaid={load} />}

      <DepositModal open={showDeposit} onClose={() => setShowDeposit(false)} onDone={load} />
    </div>
  );
}