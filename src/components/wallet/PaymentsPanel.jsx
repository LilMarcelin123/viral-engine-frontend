import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle } from "lucide-react";
import PaymentRow from "./PaymentRow";

function quincena(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-Q${d.getDate() <= 15 ? 1 : 2}`;
}
function quincenaLabel(q) {
  const [y, m, half] = q.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${half === "Q1" ? "1–15" : "16–fin"} ${months[Number(m) - 1]} ${y}`;
}

export default function PaymentsPanel({ onPaid }) {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campFilter, setCampFilter] = useState("all");
  const [qFilter, setQFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    Promise.all([
      base44.entities.Payment.list("-created_date", 500).catch(() => []),
      base44.functions.invoke("listUsers", {}).then(r => r.data?.users || []).catch(() => []),
      base44.entities.Campaign.list("-created_date").catch(() => []),
    ]).then(([p, u, c]) => { setPayments(p); setUsers(u); setCampaigns(c); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>;

  const quincenas = [...new Set(payments.map(p => quincena(p.paid_at || p.created_date)).filter(Boolean))].sort().reverse();

  const filtered = payments.filter(p => {
    if (campFilter !== "all" && p.campaign_id !== campFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (qFilter !== "all" && quincena(p.paid_at || p.created_date) !== qFilter) return false;
    return true;
  });

  const totalPend = filtered.filter(p => p.status === "pendiente").reduce((a, p) => a + (p.total || 0), 0);
  const selCls = "bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={campFilter} onChange={e => setCampFilter(e.target.value)} className={selCls}>
          <option value="all">Todas las campañas</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={qFilter} onChange={e => setQFilter(e.target.value)} className={selCls}>
          <option value="all">Todos los cortes</option>
          {quincenas.map(q => <option key={q} value={q}>{quincenaLabel(q)}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selCls}>
          <option value="all">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagados</option>
        </select>
        <div className="ml-auto flex items-center gap-1.5 text-[12px] text-white/50">
          <CheckCircle className="w-3.5 h-3.5 text-[#fb923c]" />
          Pendiente por pagar: <span className="font-bold text-white">${totalPend.toLocaleString("es-MX")}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-white/6 rounded-2xl p-10 text-center">
          <p className="text-white/25 text-[13px]">No hay pagos. Ejecuta "Calcular pagos" en una campaña para generarlos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <PaymentRow key={p.id} payment={p}
              editor={users.find(u => u.id === p.editor_id)}
              campaign={campaigns.find(c => c.id === p.campaign_id)}
              onPaid={() => { load(); onPaid(); }} />
          ))}
        </div>
      )}
    </div>
  );
}