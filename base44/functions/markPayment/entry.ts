import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.user_type === 'admin';
    if (!isAdmin) return Response.json({ error: 'Solo admin' }, { status: 403 });

    const b44 = base44.asServiceRole;
    const { payment_id, reference } = await req.json().catch(() => ({}));
    if (!payment_id) return Response.json({ error: 'payment_id requerido' }, { status: 400 });

    const payment = await b44.entities.Payment.get(payment_id);
    if (!payment) return Response.json({ error: 'Pago no encontrado' }, { status: 404 });
    if (payment.status === 'pagado') return Response.json({ error: 'Este pago ya fue marcado como pagado' }, { status: 400 });

    const total = payment.total || 0;
    const campaign = await b44.entities.Campaign.get(payment.campaign_id).catch(() => null);
    const wallets = await b44.entities.BusinessWallet.filter({ key: 'main' });
    const wallet = wallets[0];
    if (!wallet) return Response.json({ error: 'Billetera no inicializada' }, { status: 400 });
    if (total > (wallet.saldo_total || 0)) {
      return Response.json({ error: `Saldo insuficiente en la billetera: disponible $${(wallet.saldo_total || 0).toLocaleString()}, requerido $${total.toLocaleString()}. Registra un depósito primero.` }, { status: 400 });
    }

    await b44.entities.Payment.update(payment_id, {
      status: 'pagado',
      paid_at: new Date().toISOString(),
      payment_reference: reference || '',
      marked_by: user.full_name,
    });

    // Descuenta del saldo total y, si la campaña sigue activa, de su garantía
    const updates = { saldo_total: (wallet.saldo_total || 0) - total };
    if (campaign && campaign.status === 'active') {
      updates.monto_en_garantia = Math.max(0, (wallet.monto_en_garantia || 0) - total);
    }
    await b44.entities.BusinessWallet.update(wallet.id, updates);

    if (campaign) {
      await b44.entities.Campaign.update(campaign.id, { paid: (campaign.paid || 0) + total });
    }

    await b44.entities.WalletMovement.create({
      tipo: 'pago_editor', monto: total,
      campaign_id: payment.campaign_id, campaign_name: campaign?.name || '',
      editor_id: payment.editor_id,
      nota: reference ? `Ref: ${reference}` : 'Pago manual a editor',
      hecho_por: user.full_name,
    });
    await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: 'marcar_pago', detalle: `Pago de $${total.toLocaleString()} marcado como pagado (campaña "${campaign?.name || payment.campaign_id}")` });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});