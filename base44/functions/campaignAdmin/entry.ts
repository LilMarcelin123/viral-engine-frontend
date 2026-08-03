import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DEFAULT_CLIP_TIERS = [
  { views: 5000, bonus: 10 }, { views: 10000, bonus: 25 }, { views: 50000, bonus: 75 },
  { views: 100000, bonus: 200 }, { views: 500000, bonus: 600 }, { views: 1000000, bonus: 1500 },
];
const DEFAULT_EDITOR_TIERS = [
  { views: 50000, bonus: 30 }, { views: 100000, bonus: 60 }, { views: 200000, bonus: 120 },
];

async function getConfig(b44) {
  const configs = await b44.entities.BonusConfig.filter({ key: 'main' });
  if (configs.length) return configs[0];
  return await b44.entities.BonusConfig.create({
    key: 'main', price_per_video: 30, base_per_clip: 10, pool_base_pct: 33.3333,
    sub_a_pct: 60, sub_b_pct: 25, sub_c_pct: 15,
    clip_tiers: DEFAULT_CLIP_TIERS, editor_tiers: DEFAULT_EDITOR_TIERS,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.user_type === 'admin';
    if (!isAdmin) return Response.json({ error: 'Solo admin' }, { status: 403 });

    const b44 = base44.asServiceRole;
    const payload = await req.json().catch(() => ({}));
    const { action } = payload;

    const wallets = await b44.entities.BusinessWallet.filter({ key: 'main' });
    let wallet = wallets[0];
    if (!wallet) wallet = await b44.entities.BusinessWallet.create({ key: 'main', saldo_total: 0, monto_en_garantia: 0, total_depositado: 0 });

    if (action === 'create') {
      const budget = Number(payload.budget) || 0;
      if (budget <= 0) return Response.json({ error: 'El presupuesto debe ser mayor a 0' }, { status: 400 });
      const libre = (wallet.saldo_total || 0) - (wallet.monto_en_garantia || 0);
      if (budget > libre) {
        return Response.json({ error: `Monto libre insuficiente: disponible $${libre.toLocaleString()}, requerido $${budget.toLocaleString()}` }, { status: 400 });
      }
      if ((payload.title || '').length > 100) return Response.json({ error: 'Título máx 100 caracteres' }, { status: 400 });
      if ((payload.description || '').length > 1500) return Response.json({ error: 'Descripción máx 1500 caracteres' }, { status: 400 });
      if ((payload.source_materials || []).length > 10) return Response.json({ error: 'Máximo 10 materiales fuente' }, { status: 400 });

      const config = await getConfig(b44);
      const numVideos = Math.floor(budget / (config.price_per_video || 30));
      const poolBase = Math.round(budget * (config.pool_base_pct || 33.3333)) / 100;
      const bonusPool = Math.round((budget - poolBase) * 100) / 100;
      const subA = Math.round(bonusPool * (config.sub_a_pct || 60)) / 100;
      const subB = Math.round(bonusPool * (config.sub_b_pct || 25)) / 100;
      const subC = Math.round(bonusPool * (config.sub_c_pct || 15)) / 100;

      const campaign = await b44.entities.Campaign.create({
        name: payload.name, artist_name: payload.artist_name || '', audio_url: payload.audio_url || '',
        start_date: payload.start_date || '', end_date: payload.end_date || '',
        title: payload.title || '', description: payload.description || '', cover_url: payload.cover_url || '',
        source_materials: payload.source_materials || [], guidelines: payload.guidelines || '',
        target_platforms: payload.target_platforms || [], budget, paid: 0,
        client_id: payload.client_id || '', status: 'active',
        num_videos: numVideos, pool_base: poolBase, bonus_pool: bonusPool,
        sub_a: subA, sub_b: subB, sub_c: subC, total_views: 0, approved_clips_count: 0,
      });

      // Apartar garantía
      await b44.entities.BusinessWallet.update(wallet.id, { monto_en_garantia: (wallet.monto_en_garantia || 0) + budget });
      await b44.entities.WalletMovement.create({
        tipo: 'apartado_garantia', monto: budget, campaign_id: campaign.id, campaign_name: campaign.name,
        nota: 'Presupuesto apartado al crear campaña', hecho_por: user.full_name,
      });

      // Asignaciones de editores con cap dinámico
      const editorIds = payload.editor_ids || [];
      if (editorIds.length > 0) {
        const days = payload.start_date && payload.end_date
          ? Math.max(1, Math.round((new Date(payload.end_date) - new Date(payload.start_date)) / 86400000))
          : 30;
        const allUsers = await b44.entities.User.list();
        const basePerEditor = Math.floor(numVideos / editorIds.length);
        await b44.entities.EditorAssignment.bulkCreate(editorIds.map(id => {
          const editor = allUsers.find(u => u.id === id);
          const accounts = (editor?.editor_accounts || []).length || 1;
          const cap = Math.min(Math.floor(numVideos * 0.25), Math.floor(accounts * 1.5 * days)) || 1;
          return {
            campaign_id: campaign.id, editor_id: id,
            cap_dinamico: cap, asignacion_base: Math.min(basePerEditor, cap),
            extras: 0, confirmado: false, checkpoint_50: false, strikes: 0, removed: false,
          };
        }));
      }

      await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: 'crear_campana', detalle: `Campaña "${campaign.name}" creada con presupuesto $${budget.toLocaleString()} (${numVideos} videos)` });
      return Response.json({ success: true, campaign_id: campaign.id });
    }

    if (action === 'close' || action === 'cancel') {
      const campaign = await b44.entities.Campaign.get(payload.campaign_id);
      if (!campaign) return Response.json({ error: 'Campaña no encontrada' }, { status: 404 });
      if (campaign.status !== 'active') return Response.json({ error: 'La campaña no está activa' }, { status: 400 });

      const release = Math.max(0, (campaign.budget || 0) - (campaign.paid || 0));
      const newStatus = action === 'close' ? 'closed' : 'cancelled';
      await b44.entities.Campaign.update(campaign.id, { status: newStatus });
      if (release > 0) {
        await b44.entities.BusinessWallet.update(wallet.id, { monto_en_garantia: Math.max(0, (wallet.monto_en_garantia || 0) - release) });
        await b44.entities.WalletMovement.create({
          tipo: 'liberacion_garantia', monto: release, campaign_id: campaign.id, campaign_name: campaign.name,
          nota: `Garantía liberada al ${action === 'close' ? 'cerrar' : 'cancelar'} campaña`, hecho_por: user.full_name,
        });
      }
      await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: action === 'close' ? 'cerrar_campana' : 'cancelar_campana', detalle: `Campaña "${campaign.name}": $${release.toLocaleString()} liberados a saldo libre` });
      return Response.json({ success: true, released: release });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});