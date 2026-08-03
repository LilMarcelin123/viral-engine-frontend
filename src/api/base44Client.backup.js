/**
 * PUENTE (shim) — reemplaza al SDK de base44.
 * Mantiene la MISMA interfaz que usaban los 55 archivos del proyecto,
 * pero por debajo llama al backend propio de Spring Boot.
 *
 * Uso: sustituye src/api/base44Client.js por este archivo.
 * Los componentes NO se tocan: siguen llamando base44.entities.X, etc.
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

  if (!res.ok) {
    // Los SIGNAL de MySQL llegan como 422 con el mensaje de negocio real
    throw new Error(data?.message || data?.error || `Error ${res.status}`);
  }
  return data;
}

const get = (p) => req('GET', p);
const post = (p, b) => req('POST', p, b);
const patch = (p, b) => req('PATCH', p, b);
const put = (p, b) => req('PUT', p, b);
const del = (p, b) => req('DELETE', p, b);

const esAdmin  = () => session.role === 'ADMIN';
const esEditor = () => session.role === 'EDITOR';

const noMigrado = (entidad) => {
  throw new Error(
    `La entidad "${entidad}" pertenece al módulo de analítica de base44 y ` +
    `todavía no está migrada al backend propio.`
  );
};

// ---------- entidades ----------
const entities = {

  Campaign: {
    list:   ()  => esAdmin() ? get('/campaigns') : get('/client/campaigns'),
    filter: (f = {}) => f.id
        ? get(esAdmin() ? `/campaigns/${f.id}` : `/client/campaigns/${f.id}`).then(r => [r])
        : (esAdmin() ? get('/campaigns') : get('/client/campaigns')),
    get:    (id) => get(esAdmin() ? `/campaigns/${id}` : `/client/campaigns/${id}`),
    create: (d)  => post('/campaigns', d),
    update: (id, d) => patch(`/campaigns/${id}`, d),
  },

  Clip: {
    list:   ()  => esEditor() ? get('/me/clips') : get('/moderation'),
    filter: (f = {}) => esEditor()
        ? get(`/me/clips${f.campaign_id ? `?campaign=${f.campaign_id}` : ''}`)
        : get('/moderation'),
    create: (d) => post('/clips', d),
    update: (id, d) => patch(`/clips/${id}/qa`, d),
  },

  Payment: {
    list:   ()  => esEditor() ? get('/me/payments') : get('/payments'),
    filter: (f = {}) => {
      if (esEditor()) return get('/me/payments');
      const q = new URLSearchParams();
      if (f.campaign_id) q.set('campaign', f.campaign_id);
      if (f.quincena)    q.set('quincena', f.quincena);
      return get(`/payments${q.toString() ? '?' + q : ''}`);
    },
  },

  EditorAssignment: {
    list:   ()  => esEditor() ? get('/me/dashboard') : get('/campaigns/0/assignments'),
    filter: (f = {}) => esEditor()
        ? get('/me/dashboard')
        : get(`/campaigns/${f.campaign_id}/assignments`),
  },

  EditorAccount: {
    list:   ()  => get('/me/accounts'),
    filter: ()  => get('/me/accounts'),
    create: (d) => post('/me/accounts', d),
    delete: (id)=> del(`/me/accounts/${id}`),
  },

  BonusConfig: { filter: () => get('/config').then(r => [r]), update: (id, d) => put('/config', d) },
  AuditLog:    { create: (d) => post('/audit', d), list: () => get('/audit') },

  // Módulo de analítica: NO migrado al backend propio
  Profile: { list: () => noMigrado('Profile'), filter: () => noMigrado('Profile'),
             create: () => noMigrado('Profile'), update: () => noMigrado('Profile'),
             delete: () => noMigrado('Profile') },
  Post:    { list: () => noMigrado('Post'), filter: () => noMigrado('Post'),
             delete: () => noMigrado('Post') },
  Edit:    { list: () => noMigrado('Edit'), create: () => noMigrado('Edit'),
             update: () => noMigrado('Edit'), delete: () => noMigrado('Edit') },
};

// ---------- funciones de backend ----------
// Traduce los invoke() del SDK a los endpoints REST equivalentes.
const functions = {
  invoke: async (name, payload = {}) => {
    switch (name) {

case 'walletAdmin': {
        if (payload.action === 'deposit') {
          const w = await post('/wallet/deposits', { monto: payload.monto, nota: payload.nota });
          return { data: { wallet: w } };
        }
        const [wallet, raw] = await Promise.all([
          get('/wallet'),
          get('/wallet/movements?limit=50')
        ]);
        // El componente espera tipo en minúsculas y la fecha en created_date
        const movements = (raw || []).map(m => ({
          ...m,
          tipo: (m.tipo || '').toLowerCase(),
          created_date: m.created_at,
          campaign_name: m.campana || null,
        }));
        return { data: { wallet, movements } };
      }

      case 'campaignAdmin':
        if (payload.action === 'create')   return post('/campaigns', payload);
        if (payload.action === 'activate') return post(`/campaigns/${payload.campaign_id}/activate`);
        if (payload.action === 'close')    return post(`/campaigns/${payload.campaign_id}/close`);
        if (payload.action === 'cancel')   return post(`/campaigns/${payload.campaign_id}/cancel`);
        return get('/campaigns');

      case 'computePayouts':
        return post(`/campaigns/${payload.campaign_id}/compute-payouts`);

      case 'markPayment':
        return post(`/payments/${payload.payment_id}/mark-paid`, { referencia: payload.referencia });

      case 'qaClip':
        if (payload.action === 'strike')
          return post(`/clips/${payload.clip_id}/strike`, { motivo: payload.motivo });
        return patch(`/clips/${payload.clip_id}/qa`,
                     { estado: payload.estado || 'APROBADO', motivo: payload.motivo });

      case 'editorAssignment':
        if (payload.action === 'confirm')  return post(`/assignments/${payload.assignment_id}/confirm`);
        if (payload.action === 'accounts') return put(`/assignments/${payload.assignment_id}/accounts`,
                                                     { accountId: payload.account_id, agregar: payload.agregar });
        if (payload.action === 'claim')    return post(`/assignments/${payload.assignment_id}/claim`,
                                                     { cantidad: payload.cantidad });
        return get('/me/dashboard');

      case 'listUsers':  return get('/users');
      case 'updateUser': return patch(`/users/${payload.user_id}`, payload);
      case 'getCampaignReport':  return get(`/campaigns/${payload.campaign_id}`);
      case 'getClientDashboard': return get('/client/campaigns');
      case 'scrapeClips':
        throw new Error('El scrapeo se ejecuta manualmente desde el backend, no desde la app.');

      default:
        throw new Error(`Función no mapeada: ${name}`);
    }
  }
};

// ---------- auth ----------
const auth = {
  login: async (email, password) => {
    const r = await post('/auth/login', { email, password });
    session.save(r);
    return r;
  },
  me: () => get('/auth/me'),
  updateMe: (d) => put('/me/paypal', d),
  logout: async () => { session.clear(); window.location.href = '/login'; }
};

// ---------- stubs de lo que no aplica en el backend propio ----------
const integrations = {
  Core: {
    UploadFile: async () => {
      throw new Error('La subida de archivos aún no está implementada en el backend propio.');
    }
  }
};
const agents = {
  createConversation: async () => {
    throw new Error('El agente de IA era una función de base44 y no se migró.');
  }
};
const users = { inviteUser: (d) => post('/users/invite', d) };

export const base44 = { entities, functions, auth, integrations, agents, users };
export default base44;
