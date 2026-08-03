import { useUserRole } from "@/hooks/useUserRole";
import Dashboard from "@/pages/Dashboard";
import ClientCampaignsDash from "@/components/campaigns/ClientCampaignsDash";
import EditorCampaignsDash from "@/components/campaigns/EditorCampaignsDash";

export default function Home() {
  const { user, isAdmin, isCliente } = useUserRole();

  if (!user) return null;
  if (isAdmin) return <Dashboard />;
  if (isCliente) return <ClientCampaignsDash />;
  return <EditorCampaignsDash />;
}