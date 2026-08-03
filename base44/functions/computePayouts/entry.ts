import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Motor de bolsas: corre 100% en servidor para que no sea manipulable.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.user_type === 'admin';
    if (!isAdmin) return Response.json({ error: 'Solo admin' }, { status: 403 });

    const b44 = base44.asServiceRole;
    const { campaign_id } = await req.json().catch(() => ({}));
    if (!campaign_id) return Response.json({ error: 'campaign_id requerido' }, { status: 400 });

    const campaign = await b44.entities.Campaign.get(campaign_id);
    if (!campaign) return Response.json({ error: 'Campaña no encontrada' }, { status: 404 });

    const configs = await b44.entities.BonusConfig.filter({ key: 'main' });
    const config = configs[0] || {};
    const basePerClip = config.base_per_clip || 10;
    const clipTiers = (config.clip_tiers || []).slice().sort((a, b) => b.views - a.views);
    const editorTiers = (config.editor_tiers || []).slice().sort((a, b) => b.views - a.views);

    const [clips, assignments] = await Promise.all([
      b44.entities.Clip.filter({ campaign_id }),
      b44.entities.EditorAssignment.filter({ campaign_id }),
    ]);

    const approved = clips.filter(c => c.qa_status === 'aprobado' && !c.is_strike);
    // Editores con 3 strikes: conservan base, pierden todos los bonos
    const struckOut = new Set(assignments.filter(a => (a.strikes || 0) >= 3 || a.removed).map(a => a.editor_id));

    // ===== Pago base: $base × clip aprobado (garantizado, incluye editores con 3 strikes) =====
    const basePay = {};
    for (const c of approved) basePay[c.editor_id] = (basePay[c.editor_id] || 0) + basePerClip;

    // Clips elegibles para bonos (editor sin 3 strikes)
    const eligible = approved.filter(c => !struckOut.has(c.editor_id));
    const ts = (c) => new Date(c.published_at || c.created_date).getTime();

    // ===== Sub-bolsa A: escalón por clip. Ranking desc por vistas, desempate por timestamp. =====
    // Todo o nada: si no alcanza para el bono completo, ese clip queda en $0 y se detiene.
    const clipBonus = {};
    let remainingA = campaign.sub_a || 0;
    const rankedClips = eligible.slice().sort((a, b) => (b.total_views || 0) - (a.total_views || 0) || ts(a) - ts(b));
    for (const c of rankedClips) {
      const tier = clipTiers.find(t => (c.total_views || 0) >= t.views);
      if (!tier) continue;
      if (remainingA >= tier.bonus) {
        clipBonus[c.editor_id] = (clipBonus[c.editor_id] || 0) + tier.bonus;
        remainingA -= tier.bonus;
      } else break; // todo o nada: se detiene el reparto
    }

    // ===== Sub-bolsa B: acumulado por editor (paga la meta más alta) =====
    const accViews = {};
    for (const c of eligible) accViews[c.editor_id] = (accViews[c.editor_id] || 0) + (c.total_views || 0);
    const firstClipTs = {};
    for (const c of eligible) {
      const t = ts(c);
      if (!firstClipTs[c.editor_id] || t < firstClipTs[c.editor_id]) firstClipTs[c.editor_id] = t;
    }
    const accBonus = {};
    let remainingB = campaign.sub_b || 0;
    const rankedEditors = Object.keys(accViews).sort((a, b) => accViews[b] - accViews[a] || firstClipTs[a] - firstClipTs[b]);
    for (const editorId of rankedEditors) {
      const tier = editorTiers.find(t => accViews[editorId] >= t.views);
      if (!tier) continue;
      if (remainingB >= tier.bonus) {
        accBonus[editorId] = tier.bonus;
        remainingB -= tier.bonus;
      } else break;
    }

    // ===== Sub-bolsa C: 15% completo al clip #1 (un solo ganador) =====
    const topPrize = {};
    if (rankedClips.length > 0 && (rankedClips[0].total_views || 0) > 0 && (campaign.sub_c || 0) > 0) {
      topPrize[rankedClips[0].editor_id] = campaign.sub_c;
    }

    // ===== Upsert de pagos (no toca pagos ya marcados como pagados) =====
    const existing = await b44.entities.Payment.filter({ campaign_id });
    const editorIds = new Set([...Object.keys(basePay), ...Object.keys(clipBonus), ...Object.keys(accBonus), ...Object.keys(topPrize)]);
    const results = [];
    for (const editorId of editorIds) {
      const row = {
        base_pay: basePay[editorId] || 0,
        clip_bonus: clipBonus[editorId] || 0,
        accumulated_bonus: accBonus[editorId] || 0,
        top_prize: topPrize[editorId] || 0,
      };
      row.total = row.base_pay + row.clip_bonus + row.accumulated_bonus + row.top_prize;
      const prev = existing.find(p => p.editor_id === editorId);
      if (prev) {
        if (prev.status === 'pagado') { results.push({ editor_id: editorId, ...row, skipped: true }); continue; }
        await b44.entities.Payment.update(prev.id, row);
      } else {
        await b44.entities.Payment.create({ campaign_id, editor_id: editorId, ...row, status: 'pendiente' });
      }
      results.push({ editor_id: editorId, ...row });
    }

    // Actualizar métricas de campaña
    await b44.entities.Campaign.update(campaign_id, {
      total_views: approved.reduce((a, c) => a + (c.total_views || 0), 0),
      approved_clips_count: approved.length,
    });

    await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: 'calcular_pagos', detalle: `Motor de bolsas ejecutado en "${campaign.name}": ${results.length} editores. Sobrante A: $${remainingA.toFixed(2)}, B: $${remainingB.toFixed(2)}` });
    return Response.json({ success: true, payouts: results, leftover_a: remainingA, leftover_b: remainingB });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});