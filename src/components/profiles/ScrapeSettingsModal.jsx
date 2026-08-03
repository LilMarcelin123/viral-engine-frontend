import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Hash, Gauge } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ScrapeSettingsModal({ profile, open, onClose, onSaved }) {
  const [tags, setTags] = useState((profile.hashtag_filter || []).join(", "));
  const [limit, setLimit] = useState(Math.min(200, profile.scrape_limit || 200));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const parsed = tags.split(",").map(t => t.replace("#", "").trim().toLowerCase()).filter(Boolean);
    await base44.entities.Profile.update(profile.id, {
      hashtag_filter: parsed,
      scrape_limit: Math.max(1, Math.min(200, Number(limit) || 200)),
    });
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-space">Ajustes de scraping — @{profile.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#3B6FD4]" /> Filtro de hashtags
            </Label>
            <Input
              placeholder="belanova, popretro, musica2000"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Separa con comas y sin #. Solo se guardarán los videos cuyos hashtags o descripción contengan alguno de estos términos. Déjalo vacío para guardar todo.
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#3B6FD4]" /> Máximo de posts por scrapeo
            </Label>
            <div className="flex gap-2">
              {[50, 100, 150, 200].map(n => (
                <button key={n} onClick={() => setLimit(n)}
                  className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
                  style={Number(limit) === n
                    ? { background: "linear-gradient(135deg,#3B6FD4,#143A8C)", color: "#000" }
                    : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Menos posts = menos créditos de Apify por corrida. Apify cobra por cada video obtenido.
            </p>
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar ajustes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}