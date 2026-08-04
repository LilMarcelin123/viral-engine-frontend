import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Check, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Asigna editores a una campaña ya creada.
 *
 * Solo agrega: quitar a un editor que ya tiene videos apartados no es borrar un
 * renglón, es liberar esos videos al pool de reasignación (POST /assignments/{id}/release),
 * que es otra operación con sus propias reglas. Por eso los ya asignados se
 * muestran bloqueados en vez de permitir desmarcarlos.
 */
export default function AssignEditorsModal({ open, campaign, users, onClose, onDone }) {
  const [asignados, setAsignados] = useState(null);   // null = cargando
  const [seleccion, setSeleccion] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const editores = (users || []).filter(u => u.user_type === "editor");

  useEffect(() => {
    if (!open) return;
    setError(""); setSeleccion([]); setAsignados(null);
    base44.entities.EditorAssignment.filter({ campaign_id: campaign.id })
      .then(rows => setAsignados(rows.map(a => a.user_id)))
      .catch(e => { setError(e.message); setAsignados([]); });
  }, [open, campaign.id]);

  if (!open) return null;

  const alternar = (id) =>
    setSeleccion(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      for (const userId of seleccion)
        await base44.functions.invoke("editorAssignment", {
          action: "create", campaign_id: campaign.id, user_id: userId,
        });
      onDone();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "No se pudo asignar");
    } finally {
      setGuardando(false);
    }
  };

  const yaAsignado = (id) => (asignados || []).includes(id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card border border-white/12 rounded-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2 min-w-0">
            <UserPlus className="w-4 h-4 text-[#3B6FD4]/70 flex-shrink-0" />
            <h3 className="font-syne font-bold text-white text-[15px] truncate">
              Asignar editores · {campaign.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {asignados === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            </div>
          ) : editores.length === 0 ? (
            <p className="text-[13px] text-white/40 text-center py-8">
              No hay usuarios con rol de editor. Invítalos desde Usuarios.
            </p>
          ) : (
            <div className="space-y-1.5">
              {editores.map(u => {
                const fijo = yaAsignado(u.id);
                const sel  = seleccion.includes(u.id);
                return (
                  <button key={u.id} disabled={fijo} onClick={() => alternar(u.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                      fijo ? "border-white/8 bg-white/3 opacity-50 cursor-default"
                           : sel ? "border-[#3B6FD4]/50 bg-[#3B6FD4]/10"
                                 : "border-white/8 bg-white/3 hover:border-white/20")}>
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                      fijo || sel ? "bg-[#3B6FD4] border-[#3B6FD4]" : "border-white/20")}>
                      {(fijo || sel) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/85 truncate">{u.full_name || u.email}</p>
                      <p className="text-[11px] text-white/35 truncate">{u.email}</p>
                    </div>
                    {fijo && <span className="text-[10px] text-white/40 flex-shrink-0">Ya asignado</span>}
                  </button>
                );
              })}
            </div>
          )}

          {error && <p className="text-[12px] text-red-400 mt-3">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-white/12 text-[13px] text-white/50 hover:text-white/80">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando || seleccion.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-black disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {guardando ? "Asignando..." : `Asignar (${seleccion.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
