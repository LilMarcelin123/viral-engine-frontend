import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.user_type === 'admin';
    if (!isAdmin) return Response.json({ error: 'Solo admin' }, { status: 403 });

    const b44 = base44.asServiceRole;
    const { action, amount, note } = await req.json().catch(() => ({}));

    // Singleton wallet
    let wallets = await b44.entities.BusinessWallet.filter({ key: 'main' });
    let wallet = wallets[0];
    if (!wallet) {
      wallet = await b44.entities.BusinessWallet.create({ key: 'main', saldo_total: 0, monto_en_garantia: 0, total_depositado: 0 });
    }

    if (action === 'deposit') {
      const monto = Number(amount);
      if (!monto || monto <= 0) return Response.json({ error: 'Monto inválido' }, { status: 400 });
      await b44.entities.BusinessWallet.update(wallet.id, {
        saldo_total: (wallet.saldo_total || 0) + monto,
        total_depositado: (wallet.total_depositado || 0) + monto,
      });
      await b44.entities.WalletMovement.create({ tipo: 'deposito', monto, nota: note || '', hecho_por: user.full_name });
      await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: 'deposito_billetera', detalle: `Depósito manual de $${monto.toLocaleString()}` });
      wallet = (await b44.entities.BusinessWallet.filter({ key: 'main' }))[0];
    }

    const movements = await b44.entities.WalletMovement.list('-created_date', 200);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentPays = await b44.entities.WalletMovement.filter({ tipo: 'pago_editor', created_date: { $gte: thirtyDaysAgo } });
    const gastado30 = recentPays.reduce((a, m) => a + (m.monto || 0), 0);

    return Response.json({
      wallet: {
        saldo_total: wallet.saldo_total || 0,
        monto_en_garantia: wallet.monto_en_garantia || 0,
        monto_libre: (wallet.saldo_total || 0) - (wallet.monto_en_garantia || 0),
        total_depositado: wallet.total_depositado || 0,
        gastado_30_dias: gastado30,
      },
      movements,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});