import { Switch } from "@/components/ui/switch";
import { Radar, Video, Trophy, Megaphone } from "lucide-react";

const NOTIF_OPTIONS = [
  { key: "notify_scrape_done", icon: Radar, label: "Scraping completado", desc: "Cuando termina un scraping de perfil o video" },
  { key: "notify_video_status", icon: Video, label: "Estado de videos", desc: "Cuando un video de campaña es aprobado o rechazado" },
  { key: "notify_missions", icon: Trophy, label: "Misiones desbloqueadas", desc: "Cuando alcanzas un hito de vistas y ganas un premio" },
  { key: "notify_campaigns", icon: Megaphone, label: "Nuevas campañas", desc: "Cuando se publica una campaña disponible" },
];

export default function NotificationsPanel({ prefs, setPrefs }) {
  return (
    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      {NOTIF_OPTIONS.map(({ key, icon: Icon, label, desc }) => (
        <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(31,71,161,0.1)", border: "1px solid rgba(31,71,161,0.2)" }}>
              <Icon className="w-4 h-4" style={{ color: "#5B8DEF" }} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-white/85">{label}</p>
              <p className="text-[11px] text-white/35">{desc}</p>
            </div>
          </div>
          <Switch
            checked={prefs[key] !== false}
            onCheckedChange={(v) => setPrefs(p => ({ ...p, [key]: v }))}
          />
        </div>
      ))}
    </div>
  );
}