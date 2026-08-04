// Registro global de cuentas del editor (guardado en su usuario: editor_accounts)
export const PLATFORMS = ["tiktok", "instagram", "youtube"];
export const PLATFORM_LABELS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
export const MAX_PER_PLATFORM = 3;
export const MAX_TOTAL = 9;

export const shortUrl = (url) => (url || "").replace(/^https?:\/\/(www\.)?/, "").slice(0, 40);

// Espejo de cat_platform.url_regex. La base es la fuente de verdad y valida
// igual; esto solo evita el viaje al servidor y da un mensaje más claro.
// Si cambias el catálogo, cambia también esto.
export const URL_PATTERNS = {
  tiktok:    /^https?:\/\/([a-z0-9-]+\.)?tiktok\.com\/.+$/i,
  instagram: /^https?:\/\/([a-z0-9-]+\.)?instagram\.com\/.+$/i,
  youtube:   /^https?:\/\/([a-z0-9-]+\.)?(youtube\.com|youtu\.be)\/.+$/i,
};

// Devuelve un mensaje de error si no se puede agregar, o null si es válido
export function validateNewAccount(accounts, platform, url) {
  const u = (url || "").trim();
  if (!u) return "Ingresa el link o @usuario de la cuenta.";

  const patron = URL_PATTERNS[platform];
  if (patron && !patron.test(u)) {
    const otra = Object.keys(URL_PATTERNS).find(p => URL_PATTERNS[p].test(u));
    return otra
      ? `Ese link es de ${PLATFORM_LABELS[otra]}, pero tienes seleccionado ${PLATFORM_LABELS[platform]}.`
      : `El link no parece de ${PLATFORM_LABELS[platform]}. Pega la URL completa de tu perfil.`;
  }

  if (accounts.some(a => a.platform === platform && a.url.trim().toLowerCase() === u.toLowerCase()))
    return "Esa cuenta ya está registrada.";
  if (accounts.filter(a => a.platform === platform).length >= MAX_PER_PLATFORM)
    return `Máximo ${MAX_PER_PLATFORM} cuentas de ${PLATFORM_LABELS[platform]}. Elimina una para agregar otra.`;
  if (accounts.length >= MAX_TOTAL)
    return `Máximo ${MAX_TOTAL} cuentas en total.`;
  return null;
}