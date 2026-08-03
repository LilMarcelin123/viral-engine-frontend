import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, UserCog, UserPlus } from "lucide-react";
import { showAlert } from "@/lib/alerts";
import UserRow from "@/components/users/UserRow";
import InviteUserModal from "@/components/users/InviteUserModal";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadAll = async () => {
    try {
      const [res, c, cl] = await Promise.all([
        base44.functions.invoke("listUsers", {}),
        base44.entities.Campaign.list("-created_date").catch(() => []),
        base44.entities.Clip.list(null, 1000).catch(() => []),
      ]);
      setUsers(res.data?.users || []);
      setCampaigns(c);
      setClips(cl);
      setIsAdmin(true);
    } catch (e) {
      console.error("Error loading users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (currentUser) loadAll(); }, [currentUser?.id]);

  const approvalRate = (userId) => {
    const mine = clips.filter(c => c.editor_id === userId && c.qa_status !== "pendiente");
    if (!mine.length) return null;
    const ok = mine.filter(c => c.qa_status === "aprobado").length;
    return Math.round((ok / mine.length) * 100);
  };

  const handleTypeChange = async (userId, newType) => {
    setSavingId(userId);
    try {
      await base44.functions.invoke("updateUser", { user_id: userId, updates: { user_type: newType } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type: newType } : u));
    } catch (e) {
      showAlert("danger", "No tienes permiso para cambiar roles.");
    }
    setSavingId(null);
  };

  const toggleCampaign = async (userId, campaign) => {
    setSavingId(userId);
    const newClientId = campaign.client_id === userId ? "" : userId;
    try {
      await base44.entities.Campaign.update(campaign.id, { client_id: newClientId });
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, client_id: newClientId } : c));
    } catch (e) {
      showAlert("danger", "Error al asignar la campaña.");
    }
    setSavingId(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-white/30" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <UserCog className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Gestión de Usuarios</h1>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-white/35 text-sm">Roles y campañas asignadas a clientes</p>
          {isAdmin && (
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3B6FD4 0%, #1F47A1 50%, #143A8C 100%)" }}>
              <UserPlus className="w-3.5 h-3.5" /> Invitar usuario
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-4 text-[11px] text-white/35">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#3B6FD4" }} /> Admin — acceso total</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} /> Cliente — solo lectura de sus campañas</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#60a5fa" }} /> Editor — clipper</span>
      </div>

      <div className="space-y-3">
        {users.map(u => (
          <UserRow key={u.id} user={u} campaigns={campaigns}
            approvalRate={approvalRate(u.id)}
            onTypeChange={handleTypeChange}
            onToggleCampaign={toggleCampaign}
            saving={savingId === u.id}
            canEdit={isAdmin} />
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/30 text-sm">No hay usuarios registrados aún.</p>
        </div>
      )}

      <InviteUserModal open={showInvite} onClose={() => setShowInvite(false)} onInvited={loadAll} />
    </div>
  );
}