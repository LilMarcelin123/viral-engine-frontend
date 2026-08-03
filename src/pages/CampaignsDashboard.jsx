import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import AdminCampaignsDash from "@/components/campaigns/AdminCampaignsDash";
import ClientCampaignsDash from "@/components/campaigns/ClientCampaignsDash";
import EditorCampaignsDash from "@/components/campaigns/EditorCampaignsDash";
import { Loader2 } from "lucide-react";

export default function CampaignsDashboard() {
  const { isAdmin, isCliente, isEditor } = useUserRole();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Small delay to let auth settle
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  if (isAdmin) return <AdminCampaignsDash />;
  if (isCliente) return <ClientCampaignsDash />;
  return <EditorCampaignsDash />;
}