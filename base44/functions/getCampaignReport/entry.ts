import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { campaign_id } = await req.json();
    if (!campaign_id) return Response.json({ error: 'campaign_id es requerido' }, { status: 400 });

    const b44 = base44.asServiceRole;
    const campaign = await b44.entities.Campaign.get(campaign_id);
    if (!campaign) return Response.json({ error: 'Campaña no encontrada' }, { status: 404 });

    // El rol se resuelve EXCLUSIVAMENTE desde user_type
    const isAdmin = user.user_type === 'admin';
    const isOwner = campaign.client_id === user.id;
    if (!isAdmin && !isOwner) {
      return Response.json({ error: 'No tienes acceso a esta campaña' }, { status: 403 });
    }

    const [clips, payments, users] = await Promise.all([
      b44.entities.Clip.filter({ campaign_id }),
      b44.entities.Payment.filter({ campaign_id }),
      b44.entities.User.list(),
    ]);
    const editorName = (id: string) => {
      const u = users.find((x: any) => x.id === id);
      return u?.full_name || u?.email || 'Editor';
    };
    const clipLikes = (v: any) => (v.publications || []).reduce((a: number, p: any) => a + (p.likes || 0), 0);

    const approved = clips.filter(v => v.qa_status === 'aprobado' && !v.is_strike);
    // El cliente SOLO ve clips aprobados; nada de QA (pendientes/rechazados)
    const visibleClips = isAdmin ? clips : approved;
    const totalViews = approved.reduce((a, v) => a + (v.total_views || 0), 0);
    const budget = campaign.budget || 0;
    const paid = campaign.paid || 0;

    return Response.json({
      campaign: {
        id: campaign.id, name: campaign.name, artist_name: campaign.artist_name,
        title: campaign.title, status: campaign.status, cover_url: campaign.cover_url,
        start_date: campaign.start_date, end_date: campaign.end_date,
        target_platforms: campaign.target_platforms || [],
      },
      metrics: {
        total_views: totalViews,
        approved_videos: isAdmin ? approved.length : null,
        pending_videos: isAdmin ? clips.filter(v => v.qa_status === 'pendiente').length : null,
        rejected_videos: isAdmin ? clips.filter(v => v.qa_status === 'rechazado').length : null,
        engagement_rate: 0,
        total_likes: approved.reduce((a, v) => a + clipLikes(v), 0), total_comments: 0, total_shares: 0,
        enrolled_editors: new Set(clips.map(v => v.editor_id)).size,
      },
      financials: !isAdmin ? null : {
        creator_budget: budget,
        budget_paid: paid,
        budget_remaining: budget - paid,
        cost_per_thousand_views: totalViews > 0 ? Math.round((paid / totalViews) * 1000 * 100) / 100 : 0,
        payments_pending: payments.filter(p => p.status === 'pendiente').reduce((a, p) => a + (p.total || 0), 0),
        payments_done: payments.filter(p => p.status === 'pagado').reduce((a, p) => a + (p.total || 0), 0),
      },
      videos: visibleClips.map(v => ({
        id: v.id, tiktok_url: (v.publications || [])[0]?.url || '', title: v.title,
        tags: v.tags || [], editor_id: v.editor_id, editor_name: editorName(v.editor_id),
        status: isAdmin ? (v.qa_status === 'aprobado' ? 'approved' : v.qa_status === 'rechazado' ? 'rejected' : 'pending') : null,
        views: v.total_views || 0, likes: clipLikes(v), comments: 0, shares: 0,
        publications: v.publications || [],
        created_date: v.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});