import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "admin",   label: "Admin",    color: "#3B6FD4" },
  { value: "cliente", label: "Cliente",  color: "#a78bfa" },
  { value: "editor",  label: "Editor",   color: "#60a5fa" },
];

export default function UserRow({ user, campaigns, approvalRate, onTypeChange, onToggleCampaign, saving, canEdit = true }) {
  const currentType = user.user_type || "editor";
  const myCampaigns = campaigns.filter(c => c.client_id === user.id);

  return (
    <div className={cn("bg-card border rounded-2xl p-5 transition-all",
      saving ? "border-[#3B6FD4]/30" : "border-white/8 hover:border-white/12")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/60 text-[13px] font-bold">
            {(user.full_name || user.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">{user.full_name || "Sin nombre"}</p>
            <p className="text-[11px] text-white/35">{user.email}{currentType === "editor" && user.paypal_email ? ` · PayPal: ${user.paypal_email}` : ""}</p>
          </div>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-[#3B6FD4]/60" />}
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase mb-2">Rol</p>
        <div className="flex gap-2">
          {TYPES.map(t => {
            const active = currentType === t.value;
            if (!canEdit) return active ? (
              <span key={t.value} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black" style={{ background: t.color }}>{t.label}</span>
            ) : null;
            return (
              <button key={t.value} onClick={() => onTypeChange(user.id, t.value)}
                className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border",
                  active ? "text-black border-transparent" : "text-white/50 border-white/10 hover:border-white/20")}
                style={active ? { background: t.color } : {}}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {currentType === "editor" && (
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase mb-1.5">Tasa de aprobación</p>
            <p className={cn("text-[13px] font-bold", approvalRate === null ? "text-white/30" : approvalRate >= 85 ? "text-green-400" : "text-orange-400")}>
              {approvalRate === null ? "Sin clips" : `${approvalRate}%`}
            </p>
          </div>
        </div>
      )}

      {currentType === "cliente" && (
        <div>
          <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase mb-2">
            Campañas asignadas {myCampaigns.length > 0 && `(${myCampaigns.length})`}
          </p>
          {campaigns.length === 0 ? (
            <p className="text-[11px] text-white/25">No hay campañas creadas aún.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {campaigns.map(c => {
                const selected = c.client_id === user.id;
                const Component = canEdit ? "button" : "span";
                return (
                  <Component key={c.id}
                    onClick={canEdit ? () => onToggleCampaign(user.id, c) : undefined}
                    className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
                      canEdit && "transition-all cursor-pointer",
                      selected ? "text-black border-transparent" : "text-white/40 border-white/10",
                      canEdit && !selected && "hover:border-white/20")}
                    style={selected ? { background: "#a78bfa" } : {}}>
                    {selected && <Check className="w-2.5 h-2.5" />}
                    {c.name}
                  </Component>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}