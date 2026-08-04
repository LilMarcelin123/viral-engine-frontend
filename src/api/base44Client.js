/**
 * PUENTE (shim) v2 — reemplaza al SDK de base44.
 *
 * Reglas de traducción descubiertas al migrar:
 *   1) functions.invoke() devuelve { data: ... }  (forma del SDK)
 *   2) los códigos de catálogo van en minúsculas  (DEPOSITO -> deposito)
 *   3) la fecha se llama created_date, no created_at
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ---------- sesión ----------
export const session = {
  get token()  { return localStorage.getItem('ve_token'); },
  get role()   { return localStorage.getItem('ve_role'); },
  get userId() { return Number(localStorage.getItem('ve_uid')); },
  save({ token, role, id }) {
    localStorage.setItem('ve_token', token);
    localStorage.setItem('ve_role', role);
    localStorage.setItem('ve_uid', String(id));
  },
  clear() { ['ve_token','ve_role','ve_uid'].forEach(k => localStorage.removeItem(k)); }
};

async function req(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session.token ? { Authorization: `Bearer ${session.token}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { session.clear(); window.location.href = '/login'; return null; }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || data?.error || `Error ${res.status}`);
  return data;
}

const get   = (p)    => req('GET', p);
const post  = (p, b) => req('POST', p, b);
const patch = (p, b) => req('PATCH', p, b);
const put   = (p, b) => req('PUT', p, b);
const del   = (p, b) => req('DELETE', p, b);

const esAdmin  = () => session.role === 'ADMIN';
const esEditor = () => session.role === 'EDITOR';

// ---------- normalizadores (reglas 2 y 3) ----------
const lower = (v) => (v || '').toString().toLowerCase();
const fecha = (o) => ({ ...o, created_date: o.created_at ?? o.created_date ?? o.fecha_pago });

const normMovement = (m) => ({ ...fecha(m), tipo: lower(m.tipo), campaign_name: m.campana ?? null });
const normCampaign = (c) => {
  const est = lower(c.estado);
  return {
    ...fecha(c),
    id: c.campaign_id ?? c.id,
    // el tablero del editor llama al nombre `campana`
    name: c.nombre ?? c.campana,
    estado: est,
    // listas que la vista devuelve como cadenas
    target_platforms: c.plataformas
      ? String(c.plataformas).split(',').map(p => p.trim().toLowerCase()).filter(Boolean)
      : [],
    source_materials: c.materiales
      ? String(c.materiales).split('|').filter(Boolean).map(url => ({ url, label: url }))
      : [],
    // datos descriptivos: la ficha los muestra con estos nombres
    artist_name: c.artista_cancion,
    audio_url: c.url_audio,
    cover_url: c.imagen_url,
    title: c.titulo,
    description: c.descripcion,
    guidelines: c.pautas_contenido,
    start_date: c.fecha_inicio,
    end_date: c.fecha_cierre,
    client_id: c.client_id,
    // el front compara contra "active"/"closed"/"cancelled"
    status: { activa: 'active', cerrada: 'closed', completada: 'completed',
              cancelada: 'cancelled', draft: 'draft' }[est] || est,
    budget: c.presupuesto,
    paid: c.pagado,
    remaining: c.restante,
    num_videos: c.num_videos,
    videos_count: c.num_videos,
    total_views: c.vistas,
    total_likes: c.likes,
    clips_count: c.clips,
    approved_clips_count: c.clips_aprobados,
    editors_count: c.editores,
    pool_base: c.pool_base,
    sub_a: c.sub_bolsa_a,
    sub_b: c.sub_bolsa_b,
    sub_c: c.sub_bolsa_c,
    sub_bolsa_a: c.sub_bolsa_a,
    sub_bolsa_b: c.sub_bolsa_b,
    sub_bolsa_c: c.sub_bolsa_c,
  };
};
const normClip = (c) => ({
  ...fecha(c),
  estado_qa: lower(c.estado ?? c.estado_qa),
  status: lower(c.estado ?? c.estado_qa),
  // La ficha del editor solo entiende pendiente/aprobado/rechazado
  qa_status: ({ APROBADO: 'aprobado', NO_APROBADO: 'rechazado',
                SUBIDO: 'pendiente', EN_REVISION: 'pendiente'
              })[String(c.estado ?? c.estado_qa ?? '').toUpperCase()] || 'pendiente',
  title: c.titulo,
  vistas: c.vistas_totales,
  total_views: Number(c.vistas_totales ?? 0),
  likes: c.likes_totales,
  is_strike: Boolean(c.excluido_bonos),
  frozen: Boolean(c.fecha_congelado),
  // `motivo` guarda el texto tanto del rechazo como del strike
  rejection_reason: c.motivo,
  strike_reason: c.motivo,
  // "PLATAFORMA~link~cuenta~vistas~likes" separadas por "|"
  publications: c.publicaciones
    ? String(c.publicaciones).split('|').filter(Boolean).map(p => {
        const [platform, url, account, views, likes] = p.split('~');
        return {
          platform: lower(platform),
          url,
          account: account || null,
          views: Number(views ?? 0),
          likes: Number(likes ?? 0),
        };
      })
    : [],
});
const normPayment = (p) => ({
  ...fecha(p),
  estado: lower(p.estado),
  status: lower(p.estado),
  base_pay: p.pago_base,
  clip_bonus: p.bono_escalon,
  accumulated_bonus: p.bono_acumulado,
  top_prize: p.premio_1,
  amount: p.total,
  paypal_email: p.correo_paypal,
  editor_name: p.editor,
  campaign_name: p.campana,
});
// El backend manda los códigos del catálogo en MAYÚSCULAS (ADMIN/EDITOR/CLIENTE)
// y la UI compara contra minúsculas.
const normUser = (u) => ({
  ...fecha(u),
  full_name: u.nombre,
  name: u.nombre,
  user_type: lower(u.user_type ?? u.role),
  role: lower(u.role ?? u.user_type),
  estado: lower(u.estado),
  status: lower(u.estado),
  display_name: u.nombre,
  paypal_email: u.correo_paypal,
  phone: u.telefono,
  accounts_count: u.cuentas,
  content_accounts: u.cuentas,   // así lo llama el selector de editores del wizard
  strikes: u.strikes,
  campaign_ids: u.campanias_ids
    ? String(u.campanias_ids).split(',').map(Number).filter(Boolean)
    : [],
});

// La vista del editor entrega el id como assignment_id y las cuentas como
// "PLATAFORMA~url|PLATAFORMA~url". La ficha las espera como objetos.
const normAssignment = (a) => ({
  ...fecha(a),
  id: a.assignment_id ?? a.id,
  campaign_id: a.campaign_id,
  editor_id: a.editor_id ?? a.user_id,
  user_id: a.user_id ?? a.editor_id,
  confirmado: Boolean(a.confirmado),
  strikes: Number(a.strikes ?? 0),
  // La base marca la remoción a nivel campaña; el conteo es el respaldo.
  removed: Boolean(a.removido) || Number(a.strikes ?? 0) >= 3,
  motivo_remocion: a.motivo_remocion ?? null,
  // /assignments (admin) ya las manda como objetos; /me/dashboard como cadena.
  cuentas: Array.isArray(a.cuentas)
    ? a.cuentas.map(c => ({ ...c, platform: lower(c.platform ?? c.plataforma) }))
    : a.cuentas
      ? String(a.cuentas).split('|').filter(Boolean).map(par => {
          const [plataforma, url] = par.split('~');
          return { platform: lower(plataforma), url };
        })
      : [],
});

const arr = (x) => Array.isArray(x) ? x : (x ? [x] : []);

const noMigrado = (entidad) => {
  throw new Error(`La entidad "${entidad}" es del módulo de analítica de base44 y no está migrada.`);
};

// ---------- entidades ----------
const entities = {
  Campaign: {
    list:   ()  => (esAdmin() ? get('/campaigns') : esEditor() ? get('/me/dashboard') : get('/client/campaigns')).then(r => arr(r).map(normCampaign)),
    filter: (f = {}) => (esAdmin() ? get('/campaigns') : esEditor() ? get('/me/dashboard') : get('/client/campaigns'))
              .then(r => arr(r).map(normCampaign))
              .then(rows => f.id ? rows.filter(x => x.id == f.id) : rows),
    get:    (id) => get(esAdmin() ? `/campaigns/${id}` : `/client/campaigns/${id}`).then(normCampaign),
    create: (d)  => post('/campaigns', d),
    update: (id, d) => patch(`/campaigns/${id}`, d),
  },

  Clip: {
    list:   ()  => (esEditor() ? get('/me/clips') : get('/clips')).then(r => arr(r).map(normClip)),
    filter: (f = {}) => (esEditor()
              ? get(`/me/clips${f.campaign_id ? `?campaign=${f.campaign_id}` : ''}`)
              : get('/moderation')).then(r => arr(r).map(normClip)),
    // El backend crea el clip y las publicaciones por separado, y espera el id
    // numérico de la cuenta (la UI solo conoce su URL).
    create: async (d) => {
      const clip = await post('/clips', {
        campaignId: Number(d.campaign_id),
        titulo: d.title,
        tags: d.tags,
      });
      const pubs = arr(d.publications);
      if (pubs.length) {
        const porUrl = new Map(
          (await misCuentas()).map(c => [(c.url || '').trim().toLowerCase(), c.id]));
        for (const p of pubs) {
          const accountId = porUrl.get(String(p.account || '').trim().toLowerCase());
          if (!accountId)
            throw new Error(`La cuenta ${p.account} no está en tu registro. Vuelve a seleccionarla.`);
          await post(`/clips/${clip.id}/publications`, { accountId, link: p.url });
        }
      }
      return clip;
    },
    update: (id, d) => patch(`/clips/${id}/qa`, d),
  },

  Payment: {
    list:   ()  => (esEditor() ? get('/me/payments') : get('/payments')).then(r => arr(r).map(normPayment)),
    filter: (f = {}) => {
      if (esEditor()) return get('/me/payments').then(r => arr(r).map(normPayment));
      const q = new URLSearchParams();
      if (f.campaign_id) q.set('campaign', f.campaign_id);
      if (f.quincena)    q.set('quincena', f.quincena);
      return get(`/payments${q.toString() ? '?' + q : ''}`).then(r => arr(r).map(normPayment));
    },
  },

  EditorAssignment: {
    list:   ()  => (esEditor() ? get('/me/dashboard') : get('/assignments')).then(r => arr(r).map(normAssignment)),
    filter: (f = {}) => (esEditor()
              ? get('/me/dashboard')
              : get(`/campaigns/${f.campaign_id}/assignments`)).then(r => arr(r).map(normAssignment)),
  },

  EditorAccount: {
    list:   ()  => get('/me/accounts').then(arr),
    filter: ()  => get('/me/accounts').then(arr),
    create: (d) => post('/me/accounts', d),
    delete: (id)=> del(`/me/accounts/${id}`),
  },

  BonusConfig: { filter: () => get('/config').then(r => arr(r)), update: (id, d) => put('/config', d) },
  AuditLog:    { create: (d) => post('/audit', d).catch(() => null), list: () => get('/audit').then(arr) },

  // Analítica de base44 — no migrada
  Profile: { list: () => noMigrado('Profile'), filter: () => noMigrado('Profile'),
             create: () => noMigrado('Profile'), update: () => noMigrado('Profile'),
             delete: () => noMigrado('Profile') },
  Post:    { list: () => noMigrado('Post'), filter: () => noMigrado('Post'), delete: () => noMigrado('Post') },
  Edit:    { list: () => noMigrado('Edit'), create: () => noMigrado('Edit'),
             update: () => noMigrado('Edit'), delete: () => noMigrado('Edit') },
};

// ---------- funciones (todo envuelto en { data }) ----------
const functions = {
  invoke: async (name, payload = {}) => {
    switch (name) {

      case 'walletAdmin': {
        if (payload.action === 'deposit') {
          const w = await post('/wallet/deposits', {
            monto: Number(payload.monto ?? payload.amount),
            nota:  payload.nota  ?? payload.note,
          });
          return { data: { wallet: w } };
        }
        const [wallet, raw] = await Promise.all([get('/wallet'), get('/wallet/movements?limit=50')]);
        return { data: { wallet, movements: arr(raw).map(normMovement) } };
      }

      case 'campaignAdmin': {
        if (payload.action === 'create') {
          // El wizard usa nombres en inglés/snake_case; el backend espera camelCase en español.
          const fecha = (v) => (v && String(v).trim() ? v : null);
          const campania = await post('/campaigns', {
            nombre:         payload.name,
            artistaCancion: payload.artist_name || null,
            urlAudio:       payload.audio_url   || null,
            fechaInicio:    fecha(payload.start_date),
            fechaCierre:    fecha(payload.end_date),
            titulo:         payload.title       || null,
            descripcion:    payload.description || null,
            pautas:         payload.guidelines  || null,
            imagenUrl:      payload.cover_url   || null,
            numVideos:      Number(payload.num_videos),
            presupuesto:    Number(payload.budget),
            clientId:       payload.client_id ? Number(payload.client_id) : null,
            plataformas:    arr(payload.target_platforms).map(p => String(p).toUpperCase()),
            materiales:     arr(payload.source_materials).map(m => ({
                              tipo: String(m.type).toLowerCase() === 'file' ? 'ARCHIVO' : 'LINK',
                              url:  m.url,
                            })),
          });
          // El endpoint de alta no acepta editores; las asignaciones van aparte.
          const campaignId = campania.campaign_id ?? campania.id;
          for (const userId of arr(payload.editor_ids))
            await post(`/campaigns/${campaignId}/assignments`, { userId: Number(userId) });
          return { data: campania };
        }
        if (payload.action === 'activate') return { data: await post(`/campaigns/${payload.campaign_id}/activate`) };
        if (payload.action === 'close')    return { data: await post(`/campaigns/${payload.campaign_id}/close`) };
        if (payload.action === 'cancel')   return { data: await post(`/campaigns/${payload.campaign_id}/cancel`) };
        if (payload.action === 'update')   return { data: await patch(`/campaigns/${payload.campaign_id}`, payload) };
        const rows = await get('/campaigns');
        return { data: { campaigns: arr(rows).map(normCampaign) } };
      }

      case 'computePayouts':
        return { data: await post(`/campaigns/${payload.campaign_id}/compute-payouts`) };

      case 'markPayment':
        return { data: await post(`/payments/${payload.payment_id}/mark-paid`,
                                  { referencia: payload.referencia ?? payload.reference }) };

      case 'listPayments': {
        const q = new URLSearchParams();
        if (payload.campaign_id) q.set('campaign', payload.campaign_id);
        if (payload.quincena)    q.set('quincena', payload.quincena);
        const rows = await get(`/payments${q.toString() ? '?' + q : ''}`);
        return { data: { payments: arr(rows).map(normPayment) } };
      }

      case 'qaClip': {
        const motivo = payload.motivo ?? payload.reason;
        if (payload.action === 'strike')
          return { data: await post(`/clips/${payload.clip_id}/strike`, { motivo }) };
        if (payload.action === 'remove_strike')
          return { data: await del(`/strikes/${payload.strike_id}`, { motivo }) };
        if (payload.action === 'list' || !payload.action) {
          const rows = await get('/moderation');
          return { data: { clips: arr(rows).map(normClip) } };
        }
        // La UI manda approve/reject/review; la BD espera los códigos del catálogo.
        const ESTADOS = { approve: 'APROBADO', reject: 'NO_APROBADO', review: 'EN_REVISION' };
        const estado = payload.estado
          ? String(payload.estado).toUpperCase()
          : ESTADOS[payload.action];
        if (!estado)
          throw new Error(`Acción de QA desconocida: ${payload.action}`);
        return { data: await patch(`/clips/${payload.clip_id}/qa`, { estado, motivo }) };
      }

      case 'editorAssignment': {
        if (payload.action === 'confirm')
          return { data: await post(`/assignments/${payload.assignment_id}/confirm`) };
        if (payload.action === 'accounts')
          return { data: await put(`/assignments/${payload.assignment_id}/accounts`,
                                   { accountId: payload.account_id, agregar: payload.agregar }) };
        if (payload.action === 'select_accounts') {
          // La UI manda el conjunto elegido; el backend acepta una cuenta a la vez.
          // Resolvemos los ids y marcamos add/remove sobre TODAS las cuentas del editor.
          const todas   = await misCuentas();
          const elegidas = new Set(arr(payload.accounts).map(keyCuenta));
          for (const c of todas)
            await put(`/assignments/${payload.assignment_id}/accounts`,
                      { accountId: c.id, agregar: elegidas.has(keyCuenta(c)) });
          return { data: { ok: true } };
        }
        if (payload.action === 'claim')
          return { data: await post(`/assignments/${payload.assignment_id}/claim`,
                                    { cantidad: payload.cantidad }) };
        if (payload.action === 'create')
          return { data: await post(`/campaigns/${payload.campaign_id}/assignments`,
                                    { userId: payload.user_id }) };
        const rows = await get('/me/dashboard');
        return { data: { assignments: arr(rows) } };
      }

      case 'listStrikes': {
        const rows = await get(`/users/${payload.user_id}/strikes`);
        return { data: { strikes: arr(rows).map(s => ({ ...fecha(s), activo: Boolean(s.activo) })) } };
      }

      case 'listEditors': {
        const rows = await get('/editors');
        return { data: { editors: arr(rows).map(normUser) } };
      }

      case 'listUsers': {
        const rows = await get('/users');
        return { data: { users: arr(rows).map(normUser) } };
      }

      case 'updateUser':
        // La UI anida los campos en `updates`; el backend los espera planos.
        return { data: await patch(`/users/${payload.user_id}`,
                                   { ...payload, ...(payload.updates || {}) }) };

      case 'getCampaignReport': {
        const esCliente = session.role === 'CLIENTE';
        const rep = await get(esCliente
              ? `/client/campaigns/${payload.campaign_id}`
              : `/campaigns/${payload.campaign_id}`);
        const vids = await get(esCliente
              ? `/client/campaigns/${payload.campaign_id}/videos`
              : `/campaigns/${payload.campaign_id}/videos`).catch(() => []);
        const vistas = Number(rep.vistas ?? 0);
        const pagado = Number(rep.pagado ?? 0);
        return { data: {
          campaign: normCampaign(rep),
          metrics: {
            total_views: vistas,
            total_likes: rep.likes ?? 0,
            total_comments: 0,
            total_shares: 0,
            engagement_rate: 0,
            enrolled_editors: rep.editores ?? 0,
            pending_videos: esCliente ? null : Number(rep.clips ?? 0) - Number(rep.clips_aprobados ?? 0),
            approved_videos: Number(rep.clips_aprobados ?? 0),
            rejected_videos: 0,
            total_videos: Number(rep.clips ?? 0),
          },
          financials: esCliente ? null : {
            creator_budget: rep.presupuesto,
            budget_paid: pagado,
            budget_remaining: rep.restante,
            cost_per_thousand_views: vistas > 0 ? Math.round(pagado / (vistas / 1000)) : 0,
            pool_base: rep.pool_base,
            sub_a: rep.sub_bolsa_a,
            sub_b: rep.sub_bolsa_b,
            sub_c: rep.sub_bolsa_c,
          },
          videos: arr(vids).map(v => ({
            id: v.clip_id ?? v.id,
            editor_id: v.editor_id,
            editor_name: v.editor,
            title: v.titulo,
            views: Number(v.vistas_totales ?? 0),
            likes: Number(v.likes_totales ?? 0),
            tags: v.tags ? String(v.tags).split(',').map(t => t.trim()).filter(Boolean) : [],
            status: lower(v.estado_qa ?? v.estado),
            tiktok_url: v.link ?? null,
          })),
        } };
      }

      case 'getClientDashboard': {
        const rows = await get('/client/campaigns');
        return { data: { campaigns: arr(rows).map(normCampaign) } };
      }

      case 'ranking': {
        const rows = await get(`/ranking/editors?metric=${payload.metric || 'vistas'}`);
        return { data: { ranking: arr(rows) } };
      }

      case 'scrapeClips':
        throw new Error('El scrapeo se ejecuta manualmente desde el backend, no desde la app.');

      default:
        throw new Error(`Función no mapeada: ${name}`);
    }
  }
};

// ---------- auth ----------
// Clave de comparación de cuentas: debe coincidir con keyOf() de EditorAccountsSection.
const keyCuenta = (a) => `${a.platform}|${(a.url || '').trim().toLowerCase()}`;

// El backend expone las cuentas en /me/accounts, no dentro de /auth/me.
const misCuentas = async () => {
  const filas = arr(await get('/me/accounts').catch(() => []));
  return filas.map(a => ({
    id: a.id,
    platform: lower(a.plataforma),
    url: a.url,
    handle: a.handle,
    activo: a.activo,
  }));
};

// Deriva el handle a partir de la URL: .../@usuario -> usuario
const handleDeUrl = (url) => {
  const limpio = (url || '').split('?')[0].replace(/\/+$/, '');
  return (limpio.split('/').pop() || '').replace(/^@/, '') || limpio;
};

const auth = {
  login: async (email, password) => { const r = await post('/auth/login', { email, password }); session.save(r); return r; },

  me: async () => {
    const u = await get('/auth/me');
    // La UI usa estos alias
    u.full_name    = u.nombre;
    u.display_name = u.nombre;
    u.phone        = u.telefono;
    u.paypal_email = u.correoPaypal;
    u.user_type    = lower(u.role);
    // La UI de editor espera u.editor_accounts; el backend las tiene en otro endpoint.
    if (u.role === 'EDITOR') u.editor_accounts = (await misCuentas()).filter(a => a.activo !== false);
    return u;
  },

  updateMe: async (d = {}) => {
    // Un mismo updateMe se usa para el alta de cuentas y para el perfil.
    if (d.editor_accounts) {
      // Los componentes mandan SIEMPRE el registro completo, así que la
      // diferencia en ambos sentidos es lo que hay que aplicar.
      const actuales = (await misCuentas()).filter(a => a.activo !== false);
      const vigentes = new Map(actuales.map(a => [keyCuenta(a), a]));
      const deseadas = new Set(d.editor_accounts.map(keyCuenta));

      for (const a of d.editor_accounts.filter(x => !vigentes.has(keyCuenta(x))))
        await post('/me/accounts', {
          plataforma: String(a.platform).toUpperCase(),
          handle: a.handle || handleDeUrl(a.url),
          url: a.url,
        });

      for (const [clave, a] of vigentes)
        if (!deseadas.has(clave)) await del(`/me/accounts/${a.id}`);

      return { ok: true };
    }
    // Solo se mandan las llaves presentes: el backend no toca lo que no viene.
    const body = {};
    if ('display_name' in d || 'nombre'  in d) body.nombre       = d.display_name ?? d.nombre;
    if ('phone'        in d || 'telefono' in d) body.telefono    = d.phone ?? d.telefono;
    if ('paypal_email' in d || 'correoPaypal' in d)
      body.correoPaypal = d.paypal_email ?? d.correoPaypal;
    if (Object.keys(body).length === 0) return { ok: true };
    return put('/me/perfil', body);
  },

  logout: async () => { session.clear(); window.location.href = '/login'; }
};

const integrations = {
  Core: {
    UploadFile: async ({ file, tipo }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tipo', tipo || (file.type?.startsWith('video') ? 'video' : 'image'));
      const res = await fetch(API + '/files/upload', {
        method: 'POST',
        headers: { ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}) },
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || 'No se pudo subir el archivo');
      // el front espera la URL absoluta para mostrarla
      const url = data.url.startsWith('http') ? data.url : API + data.url;
      // OJO: a diferencia de functions.invoke(), UploadFile del SDK devuelve el
      // objeto PLANO. Los componentes hacen `const { file_url } = await ...`.
      return { file_url: url, url, name: data.name };
    }
  }
};
const agents = { createConversation: async () => { throw new Error('El agente de IA era de base44 y no se migró.'); } };
const legal = {
  pending: () => get('/legal/pending'),
  accept:  () => post('/legal/accept', {}),
  doc:     (tipo) => get('/legal/' + tipo),
};

const users = {
  // Se invoca como inviteUser(email, rol) o como inviteUser({ email, user_type }).
  inviteUser: (emailOrObj, rol) => {
    const d = typeof emailOrObj === 'string'
      ? { email: emailOrObj, user_type: rol }
      : { ...emailOrObj };
    const tipo = String(d.user_type ?? d.role ?? 'EDITOR').toUpperCase();
    // El catálogo solo acepta ADMIN | CLIENTE | EDITOR.
    if (!['ADMIN', 'CLIENTE', 'EDITOR'].includes(tipo))
      throw new Error(`Rol inválido: ${tipo}`);
    return post('/users/invite', { email: d.email, nombre: d.nombre, user_type: tipo });
  }
};

export const base44 = { entities, functions, auth, integrations, agents, users, legal };
export default base44;
