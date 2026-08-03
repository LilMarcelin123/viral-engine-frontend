import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Plus, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#e879f9", "#38bdf8", "#fb923c", "#4ade80", "#f472b6", "#a78bfa", "#3B6FD4", "#34d399"];

export default function ArtistSelector({ profile, onUpdated }) {
  const [artists, setArtists] = useState([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Artist.list().then(setArtists);
  }, []);

  const selectedIds = profile.artist_ids || (profile.artist_id ? [profile.artist_id] : []);
  const current = artists.filter(a => selectedIds.includes(a.id));

  const toggleArtist = async (artistId) => {
    setSaving(true);
    const next = selectedIds.includes(artistId)
      ? selectedIds.filter(id => id !== artistId)
      : [...selectedIds, artistId];
    await base44.entities.Profile.update(profile.id, { artist_ids: next });
    setSaving(false);
    onUpdated && onUpdated();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const color = COLORS[artists.length % COLORS.length];
    const artist = await base44.entities.Artist.create({ name: newName.trim(), color });
    setArtists(prev => [...prev, artist]);
    await base44.entities.Profile.update(profile.id, { artist_ids: [...selectedIds, artist.id] });
    setSaving(false);
    setCreating(false);
    setNewName("");
    onUpdated && onUpdated();
  };

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all",
          current.length > 0
            ? "border-transparent text-black font-semibold"
            : "border-white/15 text-white/40 hover:text-white/70 hover:border-white/25"
        )}
        style={current.length > 0 ? { background: current[0].color } : {}}
      >
        <User className="w-3 h-3" />
        {current.length === 0 ? "Sin artista" : current.length === 1 ? current[0].name : `${current.length} artistas`}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-white/12 rounded-xl shadow-xl min-w-[180px] overflow-hidden">
            {artists.map(artist => {
              const isSelected = selectedIds.includes(artist.id);
              return (
                <button
                  key={artist.id}
                  onClick={() => toggleArtist(artist.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/80 hover:bg-white/5 transition-colors"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: artist.color || "#888" }} />
                  {artist.name}
                  {isSelected && <Check className="w-3 h-3 ml-auto text-white/60" />}
                </button>
              );
            })}

            <div className="border-t border-white/8 p-2">
              {creating ? (
                <div className="flex gap-1">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
                    placeholder="Nombre del artista"
                    style={{ color: "#fff" }}
                    className="flex-1 bg-white/8 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white placeholder-white/40 outline-none"
                  />
                  <button onClick={handleCreate} disabled={saving} className="text-[11px] text-white/60 hover:text-white px-1">OK</button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-1 py-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Nuevo artista
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}