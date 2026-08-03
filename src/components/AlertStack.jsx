import { useEffect, useState } from "react";
import { subscribeAlerts } from "@/lib/alerts";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const STYLES = {
  success: { icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  danger:  { icon: XCircle, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  warning: { icon: AlertTriangle, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  info:    { icon: Info, color: "#1F47A1", bg: "#eff4ff", border: "#c3d4f5" },
};

export default function AlertStack() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    return subscribeAlerts((alert) => {
      setAlerts(prev => [...prev, alert]);
      setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== alert.id)), 4000);
    });
  }, []);

  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm">
      {alerts.map(({ id, type, message }) => {
        const s = STYLES[type] || STYLES.info;
        const Icon = s.icon;
        return (
          <div key={id}
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg"
            style={{ background: s.bg, border: `1px solid ${s.border}`, animation: "fadeUp 0.2s ease-out" }}>
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
            <p className="flex-1 text-[13px] leading-snug font-medium" style={{ color: s.color }}>{message}</p>
            <button onClick={() => dismiss(id)} className="flex-shrink-0 opacity-50 hover:opacity-100" style={{ color: s.color }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}