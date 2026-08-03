import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.user_type === 'admin';
    if (!isAdmin) return Response.json({ error: 'Forbidden — solo administradores' }, { status: 403 });

    const body = await req.json();
    const { user_id, updates } = body;
    if (!user_id || !updates) return Response.json({ error: 'Missing user_id or updates' }, { status: 400 });

    // Whitelist allowed fields and forbid privilege escalation to admin
    const ALLOWED_FIELDS = ['user_type', 'assigned_artist_ids'];
    const safeUpdates = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in updates) safeUpdates[key] = updates[key];
    }
    if (safeUpdates.user_type === 'admin') {
      return Response.json({ error: 'No se puede asignar rol de administrador' }, { status: 403 });
    }
    if (Object.keys(safeUpdates).length === 0) {
      return Response.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.User.update(user_id, safeUpdates);
    return Response.json({ user: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});