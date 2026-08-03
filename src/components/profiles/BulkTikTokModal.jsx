import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Music2, X, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function BulkTikTokModal({ open, onClose, onDone }) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const usernames = [...new Set(
    raw.split(/[\n,\s]+/)
      .map(u => u.replace("@", "").trim())
      .filter(Boolean)
  )];

  const handleScrape = async () => {
    if (!usernames.length) return;
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke("scrapeTikTokBulk", { usernames });
    setLoading(false);
    setResult(res.data);
    if (res.data?.success) {
      onDone && onDone();
    }
  };

  const handleClose = () => {
    if (loading) return;
    setRaw("");
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-space flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            Importar TikToks en Masa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Pega los usernames de TikTok — separados por coma, espacio o salto de línea.
            </p>
            <Textarea
              placeholder={"@artista1\n@artista2, @artista3\nartista4"}
              value={raw}
              onChange={e => setRaw(e.target.value)}
              className="h-32 font-mono text-sm resize-none"
              disabled={loading}
            />
          </div>

          {/* Preview de usernames */}
          {usernames.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                {usernames.length} perfil{usernames.length !== 1 ? "es" : ""} detectado{usernames.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {usernames.map(u => (
                  <span key={u} className="text-xs bg-white/8 border border-white/12 text-white/70 px-2.5 py-1 rounded-full font-mono">
                    @{u}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className={cn(
              "rounded-xl px-4 py-3 text-sm font-medium border",
              result.success
                ? "bg-green-500/10 border-green-500/25 text-green-400"
                : "bg-red-500/10 border-red-500/25 text-red-400"
            )}>
              {result.success
                ? `✅ ${result.profilesProcessed} perfiles scrapeados · ${result.totalPosts} posts importados`
                : `❌ Error: ${result.error || "Algo salió mal"}`
              }
            </div>
          )}

          <Button
            onClick={handleScrape}
            disabled={loading || usernames.length === 0}
            className="w-full gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Scrapeando {usernames.length} perfiles…</>
              : <><Zap className="w-4 h-4" /> Scrapear {usernames.length} perfil{usernames.length !== 1 ? "es" : ""} en 1 solicitud</>
            }
          </Button>

          {loading && (
            <p className="text-xs text-center text-muted-foreground">
              Apify procesa todos los perfiles en paralelo. Puede tardar 2–5 minutos.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}