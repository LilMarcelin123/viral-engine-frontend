import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Facebook, Music2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function AddProfileModal({ open, onClose, onAdded }) {
  const [platform, setPlatform] = useState("instagram");
  const [username, setUsername] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [limit, setLimit] = useState(200);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!username.trim()) return;
    setLoading(true);
    const clean = username.replace("@", "").trim();
    const hashtagFilter = hashtags.split(",").map(t => t.replace("#", "").trim().toLowerCase()).filter(Boolean);
    const profile = await base44.entities.Profile.create({
      username: clean,
      platform,
      scrape_status: "pending",
      hashtag_filter: hashtagFilter,
      scrape_limit: Math.max(1, Math.min(200, Number(limit) || 200)),
    });
    setLoading(false);
    setUsername("");
    onAdded(profile);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-space">Agregar Competidor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-sm font-medium mb-2 block">Plataforma</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "instagram", Icon: Instagram, label: "Instagram", color: "from-purple-500 to-pink-500" },
                { id: "facebook", Icon: Facebook, label: "Facebook", color: "from-blue-600 to-blue-400" },
                { id: "tiktok", Icon: Music2, label: "TikTok", color: "from-gray-900 to-gray-700" }
              ].map(({ id, Icon, label, color }) => (
                <button
                  key={id}
                  onClick={() => setPlatform(id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-medium text-sm",
                    platform === id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center", color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="username" className="text-sm font-medium mb-2 block">
              Username / Handle
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="username"
                placeholder="nombre_usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Filtro de hashtags (opcional)</Label>
            <Input
              placeholder="belanova, popretro (separados por coma, sin #)"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Solo se guardarán videos que contengan estos hashtags. Vacío = guardar todo.
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Máximo de posts por scrapeo</Label>
            <div className="flex gap-2">
              {[50, 100, 150, 200].map(n => (
                <button key={n} type="button" onClick={() => setLimit(n)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[12px] font-semibold border-2 transition-all",
                    Number(limit) === n
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Menos posts = menos créditos de Apify.</p>
          </div>

          <Button onClick={handleAdd} disabled={loading || !username.trim()} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? "Creando..." : "Agregar y Scrapear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}