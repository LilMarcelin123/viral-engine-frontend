import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Library, Loader2, Eye, Heart, ExternalLink, Download } from "lucide-react";

const fmt = (n) => (n || 0) >= 1000000 ? `${((n || 0) / 1000000).toFixed(1)}M` : (n || 0) >= 1000 ? `${((n || 0) / 1000).toFixed(0)}K` : `${n || 0}`;

const DATE_FILTERS = [
  { key: "all", label: "Todo", days: null },
  { key: "7d", label: "7 días", days: 7 },
  { key: "30d", label: "30 días", days: 30 },
  { key: "90d", label: "90 días", days: 90 },
];

export default function ContentLibrary() {
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("all");
  const [campaignId, setCampaignId] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const [p, v, c, pr] = await Promise.all([
        base44.entities.Post.list("-published_at", 300).catch(() => []),
        base44.entities.Clip.list("-created_date", 200).catch(() => []),
        base44.entities.Campaign.list().catch(() => []),
        base44.entities.Profile.list().catch(() => []),
      ]);
      setPosts(p); setVideos(v); setCampaigns(c); setProfiles(pr);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  const profileName = (id) => {
    const p = profiles.find(x => x.id === id);
    return p ? `@${p.username}` : "Cuenta";
  };
  const campaignName = (id) => campaigns.find(c => c.id === id)?.name || "Campaña";

  // Normalize into one list
  let items = [];
  if (source !== "campaigns") {
    items = items.concat(posts.map(p => ({
      kind: "post", id: `p-${p.id}`, url: p.url, thumbnail: p.thumbnail_url,
      title: p.caption || "(sin descripción)", subtitle: `${profileName(p.profile_id)} · ${p.platform}`,
      views: p.views, likes: p.likes, date: p.published_at || p.created_date, campaign_id: null,
    })));
  }
  if (source !== "accounts") {
    items = items.concat(videos.map(v => ({
      kind: "video", id: `v-${v.id}`, url: (v.publications || [])[0]?.url || "", thumbnail: null,
      title: v.title || (v.publications || [])[0]?.url || "Clip",
      subtitle: `${campaignName(v.campaign_id)} · ${v.qa_status === "aprobado" ? "Aprobado" : v.qa_status === "rechazado" ? "Rechazado" : "Pendiente"}`,
      views: v.total_views || 0,
      likes: (v.publications || []).reduce((a, p) => a + (p.likes || 0), 0),
      date: v.published_at || v.created_date, campaign_id: v.campaign_id,
    })));
  }

  if (campaignId !== "all") items = items.filter(i => i.campaign_id === campaignId);
  const df = DATE_FILTERS.find(d => d.key === dateFilter);
  if (df?.days) {
    const cutoff = Date.now() - df.days * 86400000;
    items = items.filter(i => i.date && new Date(i.date).getTime() >= cutoff);
  }
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const download = () => {
    const rows = [
      ["Tipo", "Título", "Origen", "Link", "Vistas", "Likes", "Fecha"],
      ...items.map(i => [
        i.kind === "post" ? "Post" : "Video",
        i.title, i.subtitle, i.url, i.views || 0, i.likes || 0,
        i.date ? new Date(i.date).toLocaleDateString("es-MX") : "",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "biblioteca_contenido.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const pill = (active) => active
    ? { background: "linear-gradient(135deg,#3B6FD4,#143A8C)", color: "#000" }
    : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Library className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Biblioteca de Contenido</h1>
        </div>
        <p className="text-white/35 text-sm">Todos los videos scrapeados y guardados, filtrables por campaña o fecha</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[["all", "Todo"], ["accounts", "Cuentas"], ["campaigns", "Campañas"]].map(([k, l]) => (
          <button key={k} onClick={() => setSource(k)}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all" style={pill(source === k)}>
            {l}
          </button>
        ))}
        <span className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
        {DATE_FILTERS.map(d => (
          <button key={d.key} onClick={() => setDateFilter(d.key)}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all" style={pill(dateFilter === d.key)}>
            {d.label}
          </button>
        ))}
        {campaigns.length > 0 && (
          <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-[12px] text-white/70 outline-none ml-auto"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(31,71,161,0.2)" }}>
            <option value="all" style={{ background: "#0a0912" }}>Todas las campañas</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id} style={{ background: "#0a0912" }}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-white/30">{items.length} elementos</p>
        {items.length > 0 && (
          <button onClick={download}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-black"
            style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
            <Download className="w-3.5 h-3.5" /> Descargar CSV
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-sm">No hay contenido con estos filtros.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase"
                  style={{ background: "rgba(31,71,161,0.1)", color: "rgba(91,141,239,0.6)", border: "1px solid rgba(31,71,161,0.2)" }}>
                  {item.kind === "post" ? "Post" : "Vid"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/85 truncate">{item.title}</p>
                <p className="text-[11px] text-white/35 truncate">
                  {item.subtitle}{item.date ? ` · ${new Date(item.date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/45 flex-shrink-0">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(item.views)}</span>
                <span className="hidden md:flex items-center gap-1"><Heart className="w-3 h-3" />{fmt(item.likes)}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-white/30 hover:text-white/70">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}