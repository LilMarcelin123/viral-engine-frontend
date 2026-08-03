import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Wallet, Loader2, CheckCircle, Clock, Mail, Check } from "lucide-react";
import BonusMissions from "./BonusMissions";
import PaymentSystemGuide from "./PaymentSystemGuide";
import EditorPaymentCard from "./EditorPaymentCard";

const fmt = (n) => `$${(n || 0).toLocaleString("es-MX")}`;

export default function EditorWallet() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [clips, setClips] = useState([]);
  const [config, setConfig] = useState(null);
  const [paypal, setPaypal] = useState(user?.paypal_email || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.Payment.filter({ editor_id: user.id }).catch(() => []),
      base44.entities.Campaign.list().catch(() => []),
      base44.entities.Clip.filter({ editor_id: user.id }).catch(() => []),
      base44.entities.BonusConfig.filter({ key: "main" }).then(r => r[0] || null).catch(() => null),
    ]).then(([p, c, cl, cfg]) => { setPayments(p); setCampaigns(c); setClips(cl); setConfig(cfg); })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const savePaypal = async () => {
    setSaving(true);
    await base44.auth.updateMe({ paypal_email: paypal.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>;

  const pendiente = payments.filter(p => p.status === "pendiente").reduce((a, p) => a + (p.total || 0), 0);
  const pagado = payments.filter(p => p.status === "pagado").reduce((a, p) => a + (p.total || 0), 0);
  const campName = (id) => campaigns.find(c => c.id === id)?.name || "Campaña";

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-[#3B6FD4]/60" />
          <h1 className="text-2xl md:text-3xl font-syne font-bold text-white">Mis Pagos</h1>
        </div>
        <p className="text-white/35 text-sm">Montos a cobrar y estado de pago (los pagos se procesan manualmente)</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Pendiente por cobrar", value: fmt(pendiente), icon: Clock, color: "#fb923c" },
          { label: "Total pagado", value: fmt(pagado), icon: CheckCircle, color: "#4ade80" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <p className="text-[10px] text-white/35 uppercase tracking-widest">{label}</p>
            </div>
            <p className="font-syne font-extrabold text-2xl text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Perfil de pago */}
      <div className="bg-card border border-white/6 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-white/30" />
          <p className="text-[11px] text-white/40 tracking-[0.2em] uppercase font-medium">Mi perfil de pago</p>
        </div>
        <label className="text-[11px] text-white/40 block mb-1.5">Correo de PayPal (aquí recibirás tus pagos)</label>
        <div className="flex gap-2">
          <input value={paypal} onChange={e => setPaypal(e.target.value)} placeholder="tucorreo@paypal.com"
            className="flex-1 bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/25 placeholder:text-white/25" />
          <button onClick={savePaypal} disabled={saving || !paypal.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-black disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#3B6FD4,#143A8C)" }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            {saved ? "Guardado" : "Guardar"}
          </button>
        </div>
      </div>

      {config && <BonusMissions clips={clips} config={config} />}

      <PaymentSystemGuide />

      <h2 className="font-syne font-bold text-white text-[15px] mb-3">Desglose por campaña</h2>
      {payments.length === 0 ? (
        <div className="bg-card border border-white/6 rounded-2xl p-10 text-center">
          <p className="text-white/25 text-[13px]">Aún no tienes pagos calculados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <EditorPaymentCard key={p.id} payment={p} campaignName={campName(p.campaign_id)} />
          ))}
        </div>
      )}
    </div>
  );
}