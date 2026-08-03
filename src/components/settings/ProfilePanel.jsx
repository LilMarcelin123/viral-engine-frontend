const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(31,71,161,0.2)" };
const disabledStyle = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" };

export default function ProfilePanel({ user, displayName, setDisplayName, phone, setPhone }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label className="text-[11px] font-medium text-white/45 block mb-1.5">Nombre para mostrar</label>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre"
          className="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#3B6FD4]/40 transition-shadow" style={inputStyle} />
        <p className="text-[10px] text-white/25 mt-1.5">Así te verá el resto del equipo en la plataforma.</p>
      </div>
      <div>
        <label className="text-[11px] font-medium text-white/45 block mb-1.5">Teléfono</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+52 55 0000 0000"
          className="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#3B6FD4]/40 transition-shadow" style={inputStyle} />
        <p className="text-[10px] text-white/25 mt-1.5">Opcional, para contacto del equipo.</p>
      </div>
      <div>
        <label className="text-[11px] font-medium text-white/45 block mb-1.5">Correo electrónico</label>
        <input value={user.email} disabled
          className="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white/40 outline-none cursor-not-allowed" style={disabledStyle} />
        <p className="text-[10px] text-white/25 mt-1.5">Vinculado a tu inicio de sesión, no se puede cambiar.</p>
      </div>
      <div>
        <label className="text-[11px] font-medium text-white/45 block mb-1.5">Rol en la plataforma</label>
        <input value={user.user_type || user.role || "usuario"} disabled
          className="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white/40 outline-none cursor-not-allowed capitalize" style={disabledStyle} />
        <p className="text-[10px] text-white/25 mt-1.5">Solo un administrador puede cambiar tu rol.</p>
      </div>
    </div>
  );
}