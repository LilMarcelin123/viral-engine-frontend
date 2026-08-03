import { Eye, Heart, MessageCircle, Share2, Users } from "lucide-react";
import CampaignVideosSection from "@/components/campaigns/CampaignVideosSection";

const fmt = (n) => (n || 0) >= 1000000 ? `${((n || 0) / 1000000).toFixed(1)}M` : (n || 0) >= 1000 ? `${((n || 0) / 1000).toFixed(1)}K` : `${n || 0}`;
const money = (n) => `$${(n || 0).toLocaleString("es-MX")}`;

const STATUS = {
  approved: { label: "Aprobado", color: "#34d399" },
  pending: { label: "Pendiente", color: "#fbbf24" },
  rejected: { label: "Rechazado", color: "#f87171" },
};

export default function CampaignReportDetail({ report }) {
  const { campaign, metrics, financials, videos } = report;

  const statCards = [
    { label: "Vistas totales", value: fmt(metrics.total_views), icon: Eye },
    { label: "Likes", value: fmt(metrics.total_likes), icon: Heart },
    { label: "Comentarios", value: fmt(metrics.total_comments), icon: MessageCircle },
    { label: "Compartidos", value: fmt(metrics.total_shares), icon: Share2 },
    { label: "Engagement", value: `${metrics.engagement_rate}%`, icon: Heart },
    { label: "Editores", value: metrics.enrolled_editors, icon: Users },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-3.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon className="w-4 h-4 mb-2" style={{ color: "rgba(59,111,212,0.6)" }} />
            <p className="text-lg font-syne font-bold text-white">{value}</p>
            <p className="text-[10px] text-white/35">{label}</p>
          </div>
        ))}
      </div>

      {financials && (
        <div className="p-5 rounded-2xl mb-6"
          style={{ background: "rgba(31,71,161,0.05)", border: "1px solid rgba(31,71,161,0.15)" }}>
          <h3 className="font-syne font-bold text-white text-[14px] mb-3">Retorno de inversión</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[15px] font-syne font-bold" style={{ color: "#3B6FD4" }}>{money(financials.creator_budget)}</p>
              <p className="text-[10px] text-white/35">Presupuesto creadores</p>
            </div>
            <div>
              <p className="text-[15px] font-syne font-bold text-white/85">{money(financials.budget_paid)}</p>
              <p className="text-[10px] text-white/35">Pagado a editores</p>
            </div>
            <div>
              <p className="text-[15px] font-syne font-bold text-emerald-400">{money(financials.budget_remaining)}</p>
              <p className="text-[10px] text-white/35">Presupuesto restante</p>
            </div>
            <div>
              <p className="text-[15px] font-syne font-bold text-white/85">{money(financials.cost_per_thousand_views)}</p>
              <p className="text-[10px] text-white/35">Costo por 1,000 vistas</p>
            </div>
          </div>
        </div>
      )}

      <CampaignVideosSection videos={videos} metrics={metrics} campaignName={campaign.name} />
    </div>
  );
}