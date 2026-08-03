import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";
import ClientCampaignsList from "./ClientCampaignsList";
import ClientStatsRow from "./ClientStatsRow";
import ClientPortfolioPanel from "./ClientPortfolioPanel";
import ClientActivitySection from "./ClientActivitySection";

export default function ClientCampaignsDash() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Todo pasa por el backend: el cliente solo recibe datos sanitizados (sin dinero interno)
    base44.functions.invoke("getClientDashboard", {})
      .then(r => { setCampaigns(r.data?.campaigns || []); setVideos(r.data?.videos || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase mb-1">Cliente · Solo lectura</p>
        <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white">Mis Campañas</h1>
        <p className="text-white/35 text-sm mt-1">Dashboards y reportes de las campañas que te fueron asignadas</p>
      </div>

      <ClientStatsRow campaigns={campaigns} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        <ClientCampaignsList campaigns={campaigns} />
        <ClientPortfolioPanel campaigns={campaigns} />
      </div>
      <ClientActivitySection videos={videos} />
    </div>
  );
}