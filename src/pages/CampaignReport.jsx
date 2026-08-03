import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2 } from "lucide-react";
import CampaignReportDetail from "@/components/campaigns/CampaignReportDetail";
import TagReportSection from "@/components/campaigns/TagReportSection";
import { useUserRole } from "@/hooks/useUserRole";

export default function CampaignReport() {
  const { user, isAdmin } = useUserRole();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    // El cliente obtiene su lista sanitizada desde backend (sin montos internos)
    const load = isAdmin
      ? base44.entities.Campaign.list("-created_date")
      : base44.functions.invoke("getClientDashboard", {}).then(r => r.data?.campaigns || []);
    load
      .then(camps => {
        setCampaigns(camps);
        if (camps.length > 0) setSelectedId(camps[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingReport(true);
    setError("");
    base44.functions.invoke("getCampaignReport", { campaign_id: selectedId })
      .then(res => setReport(res.data))
      .catch(e => {
        setReport(null);
        setError(e.response?.data?.error || "No se pudo cargar el reporte");
      })
      .finally(() => setLoadingReport(false));
  }, [selectedId]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Reporte de Campaña</h1>
        </div>
        <p className="text-white/35 text-sm">Rendimiento y avance de los videos de la campaña</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-sm">No tienes campañas disponibles.</p>
        </div>
      ) : (
        <>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="mb-6 w-full md:w-96 rounded-xl px-4 py-3 text-[13px] text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(31,71,161,0.2)" }}>
            {campaigns.map(c => (
              <option key={c.id} value={c.id} style={{ background: "#0a0912" }}>
                {c.name} {c.artist_name ? `— ${c.artist_name}` : ""}
              </option>
            ))}
          </select>

          {loadingReport && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          )}
          {error && !loadingReport && (
            <div className="text-center py-16">
              <p className="text-red-400/70 text-sm">{error}</p>
            </div>
          )}
          {report && !loadingReport && <CampaignReportDetail report={report} />}
          {isAdmin && <TagReportSection campaignId={selectedId} />}
        </>
      )}
    </div>
  );
}