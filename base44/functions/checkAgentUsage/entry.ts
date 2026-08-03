import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DAILY_LIMIT = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
    const records = await base44.asServiceRole.entities.AgentUsage.filter({ user_id: user.id, date: today });

    let usageRecord = records[0] || null;
    let currentCount = usageRecord ? (usageRecord.count || 0) : 0;

    if (currentCount >= DAILY_LIMIT) {
      return Response.json({ allowed: false, count: currentCount, limit: DAILY_LIMIT });
    }

    const newCount = currentCount + 1;
    if (usageRecord) {
      await base44.asServiceRole.entities.AgentUsage.update(usageRecord.id, { count: newCount });
    } else {
      usageRecord = await base44.asServiceRole.entities.AgentUsage.create({ user_id: user.id, date: today, count: newCount });
    }

    return Response.json({ allowed: true, count: newCount, limit: DAILY_LIMIT });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});