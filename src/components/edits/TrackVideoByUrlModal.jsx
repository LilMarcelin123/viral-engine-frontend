import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Link2, Video, Check, AlertCircle } from "lucide-react";

function fmt(n) {
  if (!n) return "0";
  return n.toLocaleString("es-MX");
}

export default function TrackVideoByUrlModal({ open, onClose, onSaved }) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [editor, setEditor] = useState(user?.full_name || "");
  const [cliente, setCliente] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleTrack = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await base44.functions.invoke("scrapeVideoByUrl", { url: url.trim() });
      const data = res.data?.data || res.data;

      if (!data || res.data?.error) {
        throw new Error(res.data?.error || "No se pudieron obtener las métricas del video");
      }

      const edit = await base44.entities.Edit.create({
        fecha: new Date().toISOString().split("T")[0],
        cuenta: "",
        editor: editor.trim() || user?.full_name || "",
        cliente_proyecto: cliente.trim(),
        plataforma: data.plataforma || "tiktok",
        url: url.trim(),
        views: data.views || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        saves: data.saves || 0,
        duration_seg: data.duration_seconds || 0,
      });

      setSuccess({
        views: data.views || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
      });

      setTimeout(() => {
        onSaved && onSaved(edit);
        setUrl("");
        setCliente("");
        setSuccess(null);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || "Error al rastrear el video");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setUrl("");
      setCliente("");
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-space flex items-center gap-2">
            <Video className="w-5 h-5" />
            Rastrear Video por URL
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-foreground font-medium mb-3">¡Video rastreado con éxito!</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>{fmt(success.views)} views</span>
              <span>{fmt(success.likes)} likes</span>
              <span>{fmt(success.comments)} comments</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">URL del video *</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://www.tiktok.com/@user/video/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && handleTrack()}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Pega el link directo del video de TikTok o Instagram</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Editor</label>
                <Input
                  placeholder="Nombre del editor"
                  value={editor}
                  onChange={e => setEditor(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Cliente / Proyecto</label>
                <Input
                  placeholder="Opcional"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleTrack}
              disabled={loading || !url.trim()}
              className="w-full gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Rastreando métricas…</>
              ) : (
                <><Video className="w-4 h-4" /> Rastrear video</>
              )}
            </Button>

            {loading && (
              <p className="text-[10px] text-muted-foreground text-center">
                Esto puede tardar 20-30 segundos mientras extraemos las métricas del video
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}