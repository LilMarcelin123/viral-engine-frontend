import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Mail, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "editor", label: "Editor", desc: "Creador de contenido · sube videos a campañas", color: "#60a5fa" },
  { value: "cliente", label: "Cliente", desc: "Discográfica · ve solo sus campañas asignadas", color: "#a78bfa" },
  { value: "admin", label: "Admin", desc: "Acceso total al sistema", color: "#3B6FD4" },
];

export default function InviteUserModal({ open, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [creado, setCreado] = useState(null);   // { email, role, password_temporal }
  const [copiado, setCopiado] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError("");
    try {
      // El rol elegido se manda tal cual: editor | cliente | admin
      const r = await base44.users.inviteUser(email.trim(), role);
      // No cerramos: sin esta contraseña el invitado no puede entrar
      // (todavía no hay recuperación de contraseña).
      setCreado(r);
      onInvited();
    } catch (e) {
      setError(e.message || "Error al invitar usuario");
    } finally {
      setSending(false);
    }
  };

  const cerrar = () => {
    setEmail(""); setRole("editor"); setCreado(null); setCopiado(false); setError("");
    onClose();
  };

  if (!open) return null;

  if (creado) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cerrar} />
      <div className="relative z-10 bg-card border border-white/12 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="font-syne font-bold text-white text-[15px]">Usuario creado</h3>
          <button onClick={cerrar} className="text-white/40 hover:text-white/80"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px] text-white/70">
            <span className="text-white/40">Cuenta:</span> {creado.email} · {creado.role}
          </p>
          <div>
            <label className="text-[11px] text-white/40 tracking-[0.15em] uppercase block mb-2">Contraseña temporal</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-white/5 border border-white/12 rounded-xl px-3 py-2.5 text-[14px] text-white font-mono break-all">
                {creado.password_temporal}
              </code>
              <button
                onClick={() => { navigator.clipboard?.writeText(creado.password_temporal); setCopiado(true); }}
                className="px-3 rounded-xl border border-white/12 text-[12px] text-white/60 hover:text-white/90">
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <p className="text-[12px] text-amber-300/80 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-2">
            Anótala y compártela ahora. No se puede volver a consultar, y todavía no hay
            recuperación de contraseña: si se pierde, hay que reiniciarla en la base de datos.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-white/8">
          <button onClick={cerrar}
            className="w-full px-4 py-2 rounded-xl text-[13px] font-semibold text-black"
            style={{ background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 50%, #143A8C 100%)" }}>
            Ya la guardé
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card border border-white/12 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#3B6FD4]/60" />
            <h3 className="font-syne font-bold text-white text-[15px]">Invitar Usuario</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-[11px] text-white/40 tracking-[0.15em] uppercase block mb-2">Correo electrónico</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !sending && handleSubmit()}
              placeholder="usuario@correo.com"
              style={{ color: "#1F47A1", backgroundColor: "#ffffff", caretColor: "#1F47A1", borderColor: "rgba(31,71,161,0.25)" }}
              className="w-full border border-white/15 rounded-xl px-4 py-2.5 text-[14px] outline-none focus:border-white/30 transition-colors placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-[11px] text-white/40 tracking-[0.15em] uppercase block mb-2">Rol</label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all",
                    role === r.value ? "border-white/25 bg-white/8" : "border-white/8 bg-white/3 hover:border-white/15"
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white/85">{r.label}</p>
                    <p className="text-[11px] text-white/35">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-[12px] text-red-400 bg-red-400/8 border border-red-400/15 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-white/12 text-[13px] text-white/50 hover:text-white/80 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!email.trim() || sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-black transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 50%, #143A8C 100%)" }}
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sending ? "Enviando..." : "Enviar invitación"}
          </button>
        </div>
      </div>
    </div>
  );
}