import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { History, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_LABELS = {
  login: { label: "Login", color: "#60a5fa" },
  subir_clip: { label: "Clip subido", color: "#a78bfa" },
  aprobar_clip: { label: "QA · Aprobado", color: "#4ade80" },
  rechazar_clip: { label: "QA · Rechazado", color: "#fb923c" },
  aplicar_strike: { label: "Strike", color: "#f87171" },
  crear_campana: { label: "Campaña creada", color: "#3B6FD4" },
  cerrar_campana: { label: "Campaña cerrada", color: "#60a5fa" },
  cancelar_campana: { label: "Campaña cancelada", color: "#f87171" },
  deposito_billetera: { label: "Depósito", color: "#4ade80" },
  marcar_pago: { label: "Pago marcado", color: "#4ade80" },
  calcular_pagos: { label: "Motor de bolsas", color: "#3B6FD4" },
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${Math.max(mins, 1)} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 300)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const actions = [...new Set(logs.map(l => l.accion))];
  const filtered = filter === "all" ? logs : logs.filter(l => l.accion === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Log de Auditoría</h1>
        </div>
        <p className="text-white/35 text-sm">Registro de cada acción de cada perfil desde el login · solo visible para admin</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", ...actions].map(a => {
          const info = a === "all" ? { label: "Todo" } : ACTION_LABELS[a] || { label: a };
          return (
            <button key={a} onClick={() => setFilter(a)}
              className={cn("px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                filter === a ? "text-black" : "text-white/50 border border-white/10")}
              style={filter === a ? { background: "linear-gradient(135deg,#3B6FD4,#143A8C)" } : {}}>
              {info.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/30 text-sm">No hay actividad registrada aún.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(l => {
          const info = ACTION_LABELS[l.accion] || { label: l.accion, color: "#888" };
          return (
            <div key={l.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6">
              <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: info.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white/85">
                  {info.label}
                  <span className="text-white/35 font-normal"> · {l.user_name || "Sistema"}{l.user_role ? ` (${l.user_role})` : ""}</span>
                </p>
                <p className="text-[11px] text-white/35">{l.detalle}</p>
              </div>
              <span className="text-[11px] text-white/25 flex-shrink-0 mt-0.5">{timeAgo(l.created_date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}