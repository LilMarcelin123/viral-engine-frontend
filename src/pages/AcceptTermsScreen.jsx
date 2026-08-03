import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Pantalla bloqueante que se muestra al primer inicio de sesión hasta que el
 * usuario acepta el aviso de privacidad y los términos que le corresponden.
 */
export default function AcceptTermsScreen({ onAccepted }) {
  const [docs, setDocs] = useState(null);
  const [idx, setIdx] = useState(0);
  const [leido, setLeido] = useState({});
  const [marcado, setMarcado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.legal.pending()
      .then(r => setDocs(r.filter(d => !d.aceptado)))
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <p className="text-sm text-red-600">{error}</p>
    </div>
  );

  if (!docs) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (docs.length === 0) { onAccepted?.(); return null; }

  const doc = docs[idx];
  const esUltimo = idx === docs.length - 1;
  const todosLeidos = docs.every((d, i) => leido[i]);

  const onScroll = (e) => {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40)
      setLeido(prev => ({ ...prev, [idx]: true }));
  };

  const aceptar = async () => {
    setGuardando(true); setError("");
    try {
      await base44.legal.accept();
      onAccepted?.();
      window.location.reload();
    } catch (e) {
      setError(e.message || "No se pudo registrar la aceptación");
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col"
           style={{ maxHeight: "90vh" }}>

        <div className="px-8 pt-7 pb-4 border-b border-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
            Documento {idx + 1} de {docs.length}
          </p>
          <h1 className="text-xl font-bold text-slate-900">{doc.titulo}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Versión {doc.version} · Para continuar debes leer y aceptar
            {docs.length > 1 ? " todos los documentos" : " este documento"}.
          </p>
        </div>

        <div onScroll={onScroll}
             className="flex-1 overflow-y-auto px-8 py-5 text-[13px] leading-relaxed
                        text-slate-700 whitespace-pre-wrap">
          {doc.contenido}
        </div>

        <div className="px-8 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
          {!leido[idx] && (
            <p className="text-[11px] text-amber-600 mb-3">
              Desplázate hasta el final del documento para poder continuar.
            </p>
          )}

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {docs.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition ${
                    i === idx ? "bg-blue-700" : leido[i] ? "bg-emerald-500" : "bg-slate-300"}`}
                  title={docs[i].titulo} />
              ))}
            </div>

            {!esUltimo ? (
              <button disabled={!leido[idx]} onClick={() => setIdx(idx + 1)}
                className="rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-40
                           text-white text-sm font-medium px-5 py-2.5 transition">
                Siguiente documento
              </button>
            ) : (
              <div className="flex items-center gap-4 flex-wrap justify-end">
                <label className="flex items-center gap-2 text-[12px] text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={marcado} disabled={!todosLeidos}
                         onChange={(e) => setMarcado(e.target.checked)}
                         className="w-4 h-4 accent-blue-700" />
                  He leído y acepto {docs.length > 1 ? "los documentos" : "el documento"}
                </label>
                <button disabled={!marcado || !todosLeidos || guardando} onClick={aceptar}
                  className="rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-40
                             text-white text-sm font-medium px-5 py-2.5 transition">
                  {guardando ? "Guardando…" : "Aceptar y continuar"}
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-[12px] text-red-600 mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
