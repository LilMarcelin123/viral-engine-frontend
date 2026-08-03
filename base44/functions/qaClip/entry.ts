import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.user_type === 'admin';
    if (!isAdmin) return Response.json({ error: 'Solo admin' }, { status: 403 });

    const b44 = base44.asServiceRole;
    const { clip_id, action, reason } = await req.json().catch(() => ({}));
    if (!clip_id || !action) return Response.json({ error: 'clip_id y action requeridos' }, { status: 400 });

    const clip = await b44.entities.Clip.get(clip_id);
    if (!clip) return Response.json({ error: 'Clip no encontrado' }, { status: 404 });

    if (action === 'approve') {
      const publishedAt = clip.published_at || new Date().toISOString();
      const frozenAt = new Date(new Date(publishedAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
      await b44.entities.Clip.update(clip_id, { qa_status: 'aprobado', published_at: publishedAt, frozen_at: frozenAt, rejection_reason: '' });
      await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: 'aprobar_clip', detalle: `Clip "${clip.title || clip.id}" aprobado por QA` });
      return Response.json({ success: true });
    }

    if (action === 'reject') {
      await b44.entities.Clip.update(clip_id, { qa_status: 'rechazado', rejection_reason: reason || '' });
      await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: 'rechazar_clip', detalle: `Clip "${clip.title || clip.id}" rechazado: ${reason || 'sin motivo'}` });
      return Response.json({ success: true });
    }

    if (action === 'strike') {
      if (!reason) return Response.json({ error: 'El motivo del strike es obligatorio' }, { status: 400 });
      await b44.entities.Clip.update(clip_id, { is_strike: true, strike_reason: reason });

      // Actualizar strikes del editor en esta campaña
      const assignments = await b44.entities.EditorAssignment.filter({ campaign_id: clip.campaign_id, editor_id: clip.editor_id });
      let assignment = assignments[0];
      if (!assignment) {
        assignment = await b44.entities.EditorAssignment.create({ campaign_id: clip.campaign_id, editor_id: clip.editor_id, strikes: 0 });
      }
      const strikes = Math.min(3, (assignment.strikes || 0) + 1);
      const removed = strikes >= 3;
      await b44.entities.EditorAssignment.update(assignment.id, { strikes, removed: removed || assignment.removed });

      await b44.entities.AuditLog.create({ user_id: user.id, user_name: user.full_name, user_role: 'admin', accion: 'aplicar_strike', detalle: `Strike ${strikes}/3 al editor ${clip.editor_id} en campaña ${clip.campaign_id}. Motivo: ${reason}${removed ? '. EDITOR FUERA DE CAMPAÑA (conserva base, pierde bonos)' : ''}` });
      return Response.json({ success: true, strikes, removed });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});