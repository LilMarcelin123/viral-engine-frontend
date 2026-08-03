import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, CheckCircle, Clock, Eye, DollarSign } from "lucide-react";
import EditorCampaignCard from "./EditorCampaignCard";
import SubmitClipModal from "./SubmitClipModal";
import EditorAccountsManager from "@/components/accounts/EditorAccountsManager";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function EditorCampaignsDash() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [clips, setClips] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null);
  const [accounts, setAccounts] = useState(user?.editor_accounts || []);

  const loadAll = async () => {
    try {
      const [asg, camps, myClips, pays] = await Promise.all([
        base44.entities.EditorAssignment.filter({ editor_id: user.id }).catch(() => []),
        base44.entities.Campaign.filter({ status: "active" }).catch(() => []),
        base44.entities.Clip.filter({ editor_id: user.id }).catch(() => []),
        base44.entities.Payment.filter({ editor_id: user.id }).catch(() => []),
      ]);
      setAssignments(asg);
      setCampaigns(camps);
      setClips(myClips);
      setPayments(pays);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadAll(); }, [user.id]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>;

  const myCampaigns = campaigns.filter(c => assignments.some(a => a.campaign_id === c.id));
  const approved = clips.filter(c => c.qa_status === "aprobado" && !c.is_strike);
  const totalViews = approved.reduce((a, c) => a + (c.total_views || 0), 0);
  const pendiente = payments.filter(p => p.status === "pendiente").reduce((a, p) => a + (p.total || 0), 0);
  const pagado = payments.filter(p => p.status === "pagado").reduce((a, p) => a + (p.total || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase mb-1">Editor · Clipper</p>
        <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white">Mis Campañas</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Clips aprobados", value: approved.length, icon: CheckCircle, color: "#4ade80" },
          { label: "Vistas acumuladas", value: fmt(totalViews), icon: Eye, color: "#60a5fa" },
          { label: "Por cobrar", value: `$${pendiente.toLocaleString("es-MX")}`, icon: Clock, color: "#fb923c" },
          { label: "Pagado", value: `$${pagado.toLocaleString("es-MX")}`, icon: DollarSign, color: "#3B6FD4" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-white/6 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <p className="text-[9px] text-white/35 uppercase tracking-widest">{label}</p>
            </div>
            <p className="font-syne font-extrabold text-xl text-white">{value}</p>
          </div>
        ))}
      </div>

      <EditorAccountsManager accounts={accounts} onAccountsChanged={setAccounts} />

      {myCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-white/30 text-sm">No tienes campañas asignadas. El admin te asigna al crear una campaña.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myCampaigns.map(campaign => (
            <EditorCampaignCard key={campaign.id}
              campaign={campaign}
              assignment={assignments.find(a => a.campaign_id === campaign.id)}
              clips={clips.filter(c => c.campaign_id === campaign.id)}
              onSubmit={() => setSubmitModal({ campaign, assignment: assignments.find(a => a.campaign_id === campaign.id) })}
              onChanged={loadAll} />
          ))}
        </div>
      )}

      {submitModal && (
        <SubmitClipModal campaign={submitModal.campaign} assignment={submitModal.assignment} onClose={() => setSubmitModal(null)} onSubmitted={loadAll} />
      )}
    </div>
  );
}