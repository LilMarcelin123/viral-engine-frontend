import { useEffect, useState } from "react";
import { registerConfirmHandler } from "@/lib/alerts";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog() {
  const [req, setReq] = useState(null);
  useEffect(() => registerConfirmHandler(setReq), []);
  if (!req) return null;

  const answer = (ok) => { req.resolve(ok); setReq(null); };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(13,26,58,0.4)" }} onClick={() => answer(false)}>
      <div className="w-full max-w-sm rounded-2xl p-5 shadow-xl"
        style={{ background: "#ffffff", border: "1px solid #c3d4f5", animation: "fadeUp 0.15s ease-out" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <AlertTriangle className="w-4 h-4" style={{ color: "#d97706" }} />
          </div>
          <div className="pt-0.5">
            {req.title && <p className="text-[14px] font-bold mb-0.5" style={{ color: "#143A8C" }}>{req.title}</p>}
            <p className="text-[13px] leading-snug font-medium" style={{ color: "#1F47A1" }}>{req.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => answer(false)}
            className="px-4 py-2 rounded-xl text-[12px] font-semibold"
            style={{ color: "#1F47A1", border: "1px solid #c3d4f5", background: "#f6f8fd" }}>
            Cancelar
          </button>
          <button onClick={() => answer(true)}
            className="px-4 py-2 rounded-xl text-[12px] font-semibold"
            style={{
              color: "#ffffff",
              background: req.danger ? "#dc2626" : "linear-gradient(135deg,#3B6FD4,#143A8C)",
            }}>
            {req.confirmLabel || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}