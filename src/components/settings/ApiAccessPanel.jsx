import { useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

export default function ApiAccessPanel({ user }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(user?.id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <label className="text-[11px] font-medium text-white/45 block mb-1.5">Tu ID de usuario</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-xl px-3.5 py-2.5 text-[12px] text-white/60 truncate"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {user.id}
        </code>
        <button onClick={copyId}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-medium text-white/60 hover:text-white/90 transition-colors flex-shrink-0"
          style={{ border: "1px solid rgba(31,71,161,0.2)" }}>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="text-[10px] text-white/25 mt-1.5">Identificador único de tu cuenta dentro de la plataforma.</p>

      <div className="flex items-start gap-3 mt-5 p-4 rounded-xl"
        style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-white/50 leading-relaxed">
          Las claves de integraciones externas (Apify, IA) las gestiona el administrador desde el panel del sistema
          y nunca se exponen en esta pantalla, para proteger la seguridad de tus datos.
        </p>
      </div>
    </div>
  );
}