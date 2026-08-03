import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Settings as SettingsIcon, User, Bell, KeyRound, Loader2, Check, Coins } from "lucide-react";
import BonusConfigPanel from "@/components/settings/BonusConfigPanel";
import ProfilePanel from "@/components/settings/ProfilePanel";
import NotificationsPanel from "@/components/settings/NotificationsPanel";
import ApiAccessPanel from "@/components/settings/ApiAccessPanel";

const TABS = [
  { key: "profile", label: "Perfil", icon: User },
  { key: "notifications", label: "Notificaciones", icon: Bell },
  { key: "api", label: "Accesos", icon: KeyRound },
  { key: "payouts", label: "Tabuladores de pago", icon: Coins, adminOnly: true },
];

const ROLE_LABELS = { admin: "Administrador", cliente: "Cliente", editor: "Editor" };

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");
  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [prefs, setPrefs] = useState(user?.notification_prefs || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const roleKey = user.user_type || (user.role === "admin" ? "admin" : "editor");
  const roleLabel = ROLE_LABELS[roleKey] || "Usuario";

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      display_name: displayName,
      phone,
      notification_prefs: prefs,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Configuración de Cuenta</h1>
        </div>
        <p className="text-white/35 text-sm">Administra tu perfil, notificaciones y accesos</p>
      </div>

      {/* Identity header */}
      <div className="flex items-center gap-4 p-5 rounded-2xl mb-6 relative overflow-hidden"
        style={{ background: "rgba(31,71,161,0.05)", border: "1px solid rgba(31,71,161,0.15)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,111,212,0.05) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-syne font-bold text-black flex-shrink-0 relative"
          style={{ background: "linear-gradient(135deg, #3B6FD4, #1F47A1)", boxShadow: "0 4px 20px rgba(31,71,161,0.35)" }}>
          {(displayName || user.email || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0 relative">
          <p className="text-[16px] font-syne font-bold text-white truncate">{displayName || "Sin nombre"}</p>
          <p className="text-[12px] text-white/40 truncate">{user.email}</p>
        </div>
        <span className="ml-auto text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider font-semibold flex-shrink-0 relative"
          style={{ background: "rgba(31,71,161,0.12)", color: "#5B8DEF", border: "1px solid rgba(31,71,161,0.3)" }}>
          {roleLabel}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.filter(t => !t.adminOnly || roleKey === "admin").map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={tab === key
              ? { background: "linear-gradient(135deg,#3B6FD4,#143A8C)", color: "#000" }
              : { color: "rgba(255,255,255,0.45)" }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="p-5 md:p-6 rounded-2xl mb-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {tab === "profile" && (
          <ProfilePanel user={user} displayName={displayName} setDisplayName={setDisplayName} phone={phone} setPhone={setPhone} />
        )}
        {tab === "notifications" && <NotificationsPanel prefs={prefs} setPrefs={setPrefs} />}
        {tab === "api" && <ApiAccessPanel user={user} />}
        {tab === "payouts" && <BonusConfigPanel />}
      </div>

      {/* Save — only for editable tabs */}
      {tab !== "api" && tab !== "payouts" && (
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold text-black transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 50%, #143A8C 100%)", boxShadow: "0 4px 20px rgba(31,71,161,0.25)" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
          </button>
          {saved && <span className="text-[12px] text-emerald-400/80">Tus cambios se guardaron correctamente</span>}
        </div>
      )}
    </div>
  );
}