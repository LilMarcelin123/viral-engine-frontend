import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

export default function StrikeModal({ open, onClose, clip, onDone }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    await base44.functions.invoke("qaClip", { clip_id: clip.id, action: "strike", reason: reason.trim() });
    setBusy(false);
    setReason("");
    onClose();
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" /> Marcar strike
          </DialogTitle>
        </DialogHeader>
        <p className="text-[12px] text-muted-foreground">
          El clip "{clip.title || clip.id}" quedará excluido del cálculo y el editor sumará 1 strike (3 = fuera de campaña, conserva base y pierde bonos). El motivo es obligatorio.
        </p>
        <Textarea placeholder="Motivo del strike..." value={reason} onChange={e => setReason(e.target.value)} rows={3} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !reason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar strike"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}