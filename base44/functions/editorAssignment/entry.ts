import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Escrituras del editor sobre su asignación, validadas en servidor.
// El editor NO puede escribir EditorAssignment directo (RLS: solo admin).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const b44 = base44.asServiceRole;
    const { action, assignment_id, accounts } = await req.json().catch(() => ({}));
    if (!action || !assignment_id) return Response.json({ error: 'action y assignment_id requeridos' }, { status: 400 });

    const assignment = await b44.entities.EditorAssignment.get(assignment_id);
    if (!assignment) return Response.json({ error: 'Asignación no encontrada' }, { status: 404 });
    if (assignment.editor_id !== user.id) return Response.json({ error: 'No es tu asignación' }, { status: 403 });
    if (assignment.removed) return Response.json({ error: 'Estás fuera de esta campaña' }, { status: 400 });

    if (action === 'confirm') {
      await b44.entities.EditorAssignment.update(assignment_id, {
        confirmado: true,
        confirmed_at: new Date().toISOString(),
      });
      return Response.json({ success: true });
    }

    if (action === 'select_accounts') {
      const list = Array.isArray(accounts) ? accounts : [];
      if (!list.length) return Response.json({ error: 'Selecciona al menos una cuenta' }, { status: 400 });

      // Solo cuentas dadas de alta en el registro global del editor
      const keyOf = (a: any) => `${a.platform}|${(a.url || '').trim().toLowerCase()}`;
      const regKeys = new Set((user.editor_accounts || []).map(keyOf));
      for (const a of list) {
        if (!regKeys.has(keyOf(a))) {
          return Response.json({ error: `La cuenta ${a.url || ''} no está en tu registro de cuentas` }, { status: 400 });
        }
      }

      // Recalcular cap dinámico en servidor: min(25% videos campaña, cuentas × 1.5 × días)
      const campaign = await b44.entities.Campaign.get(assignment.campaign_id).catch(() => null);
      const days = campaign?.start_date && campaign?.end_date
        ? Math.max(1, Math.round((new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()) / 86400000))
        : 30;
      const cap = Math.min(
        Math.floor((campaign?.num_videos || 0) * 0.25),
        Math.floor(list.length * 1.5 * days)
      ) || 1;

      await b44.entities.EditorAssignment.update(assignment_id, {
        cuentas: list.map((a: any) => ({ platform: a.platform, url: (a.url || '').trim() })),
        cap_dinamico: cap,
      });
      return Response.json({ success: true, cap_dinamico: cap });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});