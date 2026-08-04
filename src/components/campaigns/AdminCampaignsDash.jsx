import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Play, Eye, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import CampaignWizard from "./CampaignWizard";
import ClipModerationPanel from "./ClipModerationPanel";
import AdminCampaignCard from "./AdminCampaignCard";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function AdminCampaignsDash() {
  const [campaigns, setCampaigns] = useState([]);
  const [pendingClips, setPendingClips] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");

  const loadAll = async () => {
    try {
      const [c, clips, u] = await Promise.all([
        base44.entities.Campaign.list("-created_date").catch(() => []),
        base44.entities.Clip.filter({ qa_status: "pendiente" }).catch(() => []),
        base44.functions.invoke("listUsers", {}).then(r => r.data?.users || []).catch(() => []),
      ]);
      setCampaigns(c);
      setPendingClips(clips);
      setUsers(u);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>;

  const totalBudget = campaigns.filter(c => c.status === "active").reduce((a, c) => a + (c.budget || 0), 0);
  const totalViews = campaigns.reduce((a, c) => a + (c.total_views || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase mb-1">Admin</p>
          <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white">Gestión de Campañas</h1>
        </div>
        <button onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-black"
          style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
          <Plus className="w-4 h-4" /> Crear campaña
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Campañas activas", value: campaigns.filter(c => c.status === "active").length, icon: Play, color: "#4ade80" },
          { label: "Total vistas", value: fmt(totalViews), icon: Eye, color: "#60a5fa" },
          { label: "En garantía activa", value: `$${fmt(totalBudget)}`, icon: DollarSign, color: "#3B6FD4" },
          { label: "Clips en cola QA", value: pendingClips.length, icon: Clock, color: "#fb923c" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-white/6 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <p className="text-[10px] text-white/35 tracking-[0.15em] uppercase">{label}</p>
            </div>
            <p className="font-syne font-extrabold text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 border-b border-white/8">
        {[
          { id: "campaigns", label: "Campañas" },
          { id: "moderation", label: `Moderación${pendingClips.length > 0 ? ` (${pendingClips.length})` : ""}` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-2.5 text-[12px] font-semibold border-b-2 -mb-px transition-all",
              activeTab === tab.id ? "text-[#3B6FD4] border-[#3B6FD4]" : "text-white/40 border-transparent hover:text-white/60")}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "campaigns" && (
        <div className="space-y-3">
          {campaigns.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎵</p>
              <p className="text-white/30 text-sm">No hay campañas. Crea la primera.</p>
            </div>
          )}
          {campaigns.map(c => (
            <AdminCampaignCard key={c.id} campaign={c} users={users}
              client={users.find(u => u.id === c.client_id)} onChanged={loadAll} />
          ))}
        </div>
      )}

      {activeTab === "moderation" && (
        <ClipModerationPanel clips={pendingClips} users={users} campaigns={campaigns} onDone={loadAll} />
      )}

      <CampaignWizard open={showWizard} onClose={() => setShowWizard(false)} users={users} onCreated={loadAll} />
    </div>
  );
}