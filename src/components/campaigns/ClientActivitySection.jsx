import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function ClientActivitySection({ videos }) {
  const recent = videos.slice(0, 8);

  return (
    <div className="mt-6">
      <div className="bg-card border border-white/6 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-white/30" />
          <p className="text-[11px] text-white/40 tracking-[0.2em] uppercase font-medium">Actividad Reciente</p>
        </div>
        {recent.length === 0 ? (
          <p className="text-[12px] text-white/25 py-4 text-center">Sin envíos de clips todavía.</p>
        ) : (
          <div className="space-y-2.5">
            {recent.map(v => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/70 truncate">{v.campaign_name}</p>
                  <p className="text-[10px] text-white/25">
                    {v.created_date ? formatDistanceToNow(new Date(v.created_date), { addSuffix: true, locale: es }) : ""}
                  </p>
                </div>
                <span className="text-[11px] text-white/40 flex-shrink-0">{fmt(v.views)} vistas</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}