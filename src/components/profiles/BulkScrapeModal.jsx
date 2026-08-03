import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Instagram, Facebook, Music2, Loader2, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PlatformIcon = { instagram: Instagram, facebook: Facebook, tiktok: Music2 };

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function BulkScrapeModal({ open, onClose, profiles, onDone }) {
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  // Estado local de daily_scrape por perfil
  const [dailyMap, setDailyMap] = useState(() =>
    Object.fromEntries(profiles.map(p => [p.id, p.daily_scrape ?? false]))
  );
  // Selección para scrape manual inmediato
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleDaily = (id) => setDailyMap(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSelect = (id) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const selectAll = () => setSelectedIds(profiles.map(p => p.id));
  const clearAll = () => setSelectedIds([]);

  const handleSaveRoutine = async () => {
    setSaving(true);
    await Promise.all(
      profiles.map(p => base44.entities.Profile.update(p.id, { daily_scrape: dailyMap[p.id] ?? false }))
    );
    setSaving(false);
  };

  const handleRunNow = async () => {
    if (selectedIds.length === 0) return;
    setRunning(true);
    setResult(null);
    const res = await base44.functions.invoke("bulkScrapeRoutine", { profileIds: selectedIds });
    setResult(res.data);
    setRunning(false);
    onDone && onDone();
  };

  const routineCount = Object.values(dailyMap).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-syne text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5" /> Re-scrapear en Masa
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Sección: Rutina diaria */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-white/50" />
              <p className="text-[12px] font-semibold text-white/70 tracking-wide uppercase">Rutina diaria automática</p>
              <span className="ml-auto text-[11px] text-white/30">{routineCount} perfiles</span>
            </div>
            <p className="text-[11px] text-white/35 mb-4">Activa el switch en los perfiles que quieres que se scrapen automáticamente cada día.</p>

            <div className="space-y-2">
              {profiles.map(p => {
                const Icon = PlatformIcon[p.platform] || Music2;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white/80 truncate">@{p.username}</p>
                      {p.followers > 0 && <p className="text-[10px] text-white/30">{fmt(p.followers)} seguidores</p>}
                    </div>
                    <Switch
                      checked={dailyMap[p.id] ?? false}
                      onCheckedChange={() => toggleDaily(p.id)}
                      className="scale-90"
                    />
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleSaveRoutine}
              disabled={saving}
              size="sm"
              className="w-full mt-4 gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
              {saving ? "Guardando..." : "Guardar rutina diaria"}
            </Button>
          </div>

          {/* Sección: Scrape manual */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-white/70 tracking-wide uppercase">Scrapear ahora</p>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[10px] text-white/40 hover:text-white/70 transition-colors">Todos</button>
                <span className="text-white/15">·</span>
                <button onClick={clearAll} className="text-[10px] text-white/40 hover:text-white/70 transition-colors">Ninguno</button>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              {profiles.map(p => {
                const Icon = PlatformIcon[p.platform] || Music2;
                const selected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all",
                      selected ? "bg-white/10 border border-white/15" : "border border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center",
                      selected ? "bg-white border-white" : "border-white/20"
                    )}>
                      {selected && <span className="text-black text-[9px] font-black">✓</span>}
                    </div>
                    <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <span className="text-[12px] text-white/75 flex-1 truncate">@{p.username}</span>
                    {p.last_scraped && (
                      <span className="text-[10px] text-white/25 flex-shrink-0">
                        {new Date(p.last_scraped).toLocaleDateString("es-MX")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {result && (
              <div className={cn(
                "rounded-lg px-3 py-2 text-[12px] mb-3",
                result.failed > 0 ? "bg-[#1F47A1]/10 text-[#3B6FD4] border border-[#1F47A1]/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
              )}>
                ✅ {result.scraped} scrapeados · {result.failed > 0 ? `⚠️ ${result.failed} con error` : "Sin errores"}
              </div>
            )}

            <Button
              onClick={handleRunNow}
              disabled={running || selectedIds.length === 0}
              size="sm"
              variant="outline"
              className="w-full gap-2"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {running ? `Scrapeando ${selectedIds.length} perfiles...` : `Scrapear ${selectedIds.length} seleccionados`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}