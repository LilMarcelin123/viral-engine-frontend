import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { showAlert, confirmDialog } from "@/lib/alerts";

const fecha = (v) => (v ? new Date(v).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "");

/**
 * Lista los strikes de un editor y permite quitarlos.
 *
 * Al tercer strike el editor pasa a REMOVIDO y no puede iniciar sesión.
 * sp_strike_quitar lo reactiva solo en cuanto baja del límite, así que quitar
 * un strike es la única forma de revertir una remoción.
 */
export default function StrikesPanel({ editor, onChanged }) {
  const [strikes, setStrikes] = useState(null);
  const [quitando, setQuitando] = useState(null);

  const cargar = () =>
    base44.functions.invoke("listStrikes", { user_id: editor.id })
      .then(r => setStrikes(r.data?.strikes || []))
      .catch(e => { showAlert("danger", e.message); setStrikes([]); });

  useEffect(() => { cargar(); }, [editor.id]);

  const quitar = async (s) => {
    const motivo = window.prompt("¿Por qué se quita este strike? (queda en la bitácora)");
    if (motivo === null) return;
    if (!motivo.trim()) { showAlert("warning", "Escribe el motivo."); return; }
    if (!(await confirmDialog(
      `¿Quitar el strike "${s.motivo || "sin motivo"}"? Si el editor estaba removido, se reactiva.`,
      { confirmLabel: "Quitar strike" }))) return;

    setQuitando(s.id);
    try {
      await base44.functions.invoke("qaClip", { action: "remove_strike", strike_id: s.id, motivo: motivo.trim() });
      showAlert("success", "Strike quitado.");
      await cargar();
      onChanged?.();
    } catch (e) {
      showAlert("danger", e.message || "No se pudo quitar el strike.");
    } finally {
      setQuitando(null);
    }
  };

  if (strikes === null)
    return <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  if (strikes.length === 0)
    return <p className="text-[11px] text-muted-foreground py-2">Sin strikes.</p>;

  const activos = strikes.filter(s => s.activo).length;

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <p className="text-[11px] font-semibold text-foreground">
          Strikes · {activos} activo{activos !== 1 ? "s" : ""} de 3
        </p>
        {activos >= 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
            Editor removido · no puede entrar
          </span>
        )}
      </div>

      {strikes.map(s => (
        <div key={s.id}
          className={`flex items-start justify-between gap-3 px-3 py-2 rounded-lg border ${
            s.activo ? "border-amber-500/25 bg-amber-500/5" : "border-border bg-secondary/40 opacity-60"}`}>
          <div className="min-w-0">
            <p className="text-[12px] text-foreground">{s.motivo || "Sin motivo"}</p>
            <p className="text-[10px] text-muted-foreground">
              {fecha(s.created_date || s.created_at)}
              {s.campana ? ` · ${s.campana}` : ""}
              {s.clip ? ` · ${s.clip}` : ""}
              {!s.activo && s.motivo_remocion ? ` · quitado: ${s.motivo_remocion}` : ""}
            </p>
          </div>
          {s.activo && (
            <button onClick={() => quitar(s)} disabled={quitando === s.id}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-primary border border-border hover:bg-secondary disabled:opacity-40 flex-shrink-0">
              {quitando === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Quitar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
