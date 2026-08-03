import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Zap, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProfileCard from "@/components/profiles/ProfileCard";
import AddProfileModal from "@/components/profiles/AddProfileModal";
import BulkTikTokModal from "@/components/profiles/BulkTikTokModal";
import MultiExportModal from "@/components/profiles/MultiExportModal";
import BulkScrapeModal from "@/components/profiles/BulkScrapeModal";
import { useAuth } from "@/lib/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { confirmDialog } from "@/lib/alerts";

export default function Profiles() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.user_type === "admin";
  const { filterProfilesByAccess } = useUserRole();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showBulkScrape, setShowBulkScrape] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfiles = () => base44.entities.Profile.list("-created_date", 50).then(p => { setProfiles(filterProfilesByAccess(p)); setLoading(false); });

  useEffect(() => { loadProfiles(); }, []);

  const handleDelete = async (profile) => {
    if (!(await confirmDialog(`¿Eliminar @${profile.username}? Se borrarán también sus posts.`, { danger: true, confirmLabel: "Eliminar" }))) return;
    // Borrar posts del perfil de forma secuencial para no exceder rate limit
    const posts = await base44.entities.Post.filter({ profile_id: profile.id });
    for (const p of posts) {
      try { await base44.entities.Post.delete(p.id); } catch (_) {}
    }
    await base44.entities.Profile.delete(profile.id);
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
  };

  const handleScrape = async (profile) => {
    await base44.entities.Profile.update(profile.id, { scrape_status: "scraping" });
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, scrape_status: "scraping" } : p));
    base44.functions.invoke("scrapeProfile", { profileId: profile.id })
      .then(() => loadProfiles())
      .catch(() => loadProfiles());
  };

  const filtered = profiles.filter(p =>
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-space font-bold text-foreground mb-1">Editores</h1>
          <p className="text-muted-foreground text-sm">{profiles.length} perfiles rastreados</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {profiles.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          )}
          {isAdmin && profiles.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowBulkScrape(true)} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar videos</span>
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowBulk(true)} className="gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bulk TikTok</span>
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar perfiles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-space font-semibold text-foreground mb-2">
            {profiles.length === 0 ? (isAdmin ? "Sin perfiles aún" : "Sin perfiles asignados") : "No hay resultados"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {profiles.length === 0 ? (isAdmin ? "Agrega competidores para comenzar a espiar" : "Tu cuenta aún no tiene campañas asignadas") : "Prueba con otro término de búsqueda"}
          </p>
          {isAdmin && profiles.length === 0 && (
            <Button onClick={() => setShowAdd(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Agregar Perfil
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(profile => (
            <ProfileCard key={profile.id} profile={profile} onScrape={isAdmin ? handleScrape : null} onDelete={isAdmin ? handleDelete : null} onUpdated={loadProfiles} />
          ))}
        </div>
      )}

      <MultiExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        profiles={profiles.filter(p => p.scrape_status === "done")}
      />
      <BulkTikTokModal
        open={showBulk}
        onClose={() => setShowBulk(false)}
        onDone={loadProfiles}
      />
      <BulkScrapeModal
        open={showBulkScrape}
        onClose={() => setShowBulkScrape(false)}
        profiles={profiles}
        onDone={loadProfiles}
      />
      <AddProfileModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={(p) => {
          setProfiles(prev => [p, ...prev]);
          handleScrape(p);
        }}
      />
    </div>
  );
}