import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId, topN = 10 } = await req.json();

  // Get top N viral posts for this profile that haven't been analyzed yet
  const allPosts = await base44.asServiceRole.entities.Post.filter({ profile_id: profileId });

  const topPosts = allPosts
    .filter(p => !p.ai_analysis_done)
    .sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0))
    .slice(0, topN);

  const results = [];
  for (const post of topPosts) {
    const postId = post.id;
    const prompt = `Eres un experto en marketing viral y análisis de contenido en redes sociales.

Analiza este post/video y desglosa su fórmula viral:

CAPTION: ${post.caption || "(sin texto)"}
TIPO: ${post.type}
PLATAFORMA: ${post.platform}
MÉTRICAS: ${post.views} views, ${post.likes} likes, ${post.comments} comentarios
DURACIÓN: ${post.duration_seconds || 0} segundos
HASHTAGS: ${(post.hashtags || []).join(", ")}

Devuelve JSON con esta estructura EXACTA:
{
  "hook_text": "el hook exacto de los primeros 3-5 segundos o primera línea",
  "hook_type": "question|shock|curiosity|story|how_to|list|challenge|other",
  "hook_analysis": "por qué este hook funciona",
  "topic": "tema principal en 3-5 palabras",
  "topic_category": "nicho o categoría",
  "retention_formula": "fórmula de retención en 1 oración",
  "content_structure": {
    "opening": "cómo abre",
    "middle": "cómo mantiene atención",
    "cta": "llamado a acción o cierre",
    "emotional_triggers": ["disparadores emocionales"],
    "virality_elements": ["elementos virales"],
    "replication_template": "plantilla para replicar en 3-5 pasos"
  }
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          hook_text: { type: "string" },
          hook_type: { type: "string" },
          hook_analysis: { type: "string" },
          topic: { type: "string" },
          topic_category: { type: "string" },
          retention_formula: { type: "string" },
          content_structure: { type: "object" }
        }
      }
    });

    await base44.asServiceRole.entities.Post.update(postId, {
      hook_text: result.hook_text || "",
      hook_type: result.hook_type || "other",
      topic: result.topic || "",
      topic_category: result.topic_category || "",
      retention_formula: result.retention_formula || "",
      content_structure: JSON.stringify(result.content_structure || {}),
      ai_analysis_done: true
    });

    results.push({ postId, analysis: result });
  }

  return Response.json({ success: true, analyzed: results.length });
});