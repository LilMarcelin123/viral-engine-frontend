// Registro global de cuentas del editor (guardado en su usuario: editor_accounts)
export const PLATFORMS = ["tiktok", "instagram", "youtube"];
export const PLATFORM_LABELS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
export const MAX_PER_PLATFORM = 3;
export const MAX_TOTAL = 9;

export const shortUrl = (url) => (url || "").replace(/^https?:\/\/(www\.)?/, "").slice(0, 40);

// Espejo de cat_platform.perfil_regex. La base es la fuente de verdad y valida
// igual; esto solo evita el viaje al servidor y da un mensaje más claro.
// Si cambias el catálogo, cambia también esto.
//
// Se exige la URL del PERFIL, no un link corto: de un vt.tiktok.com/ZSxxxx no
// se puede sacar el usuario, y sin usuario no hay forma de verificar después
// que un video publicado sea de esa cuenta.
export const URL_PATTERNS = {
  tiktok:    /^https?:\/\/([a-z0-9-]+\.)?tiktok\.com\/@[A-Za-z0-9._-]+\/?$/i,
  instagram: /^https?:\/\/([a-z0-9-]+\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/i,
  youtube:   /^https?:\/\/([a-z0-9-]+\.)?youtube\.com\/(@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+)\/?$/i,
};

// Ejemplos que se muestran cuando el formato no cuadra.
export const PROFILE_EXAMPLES = {
  tiktok:    "https://www.tiktok.com/@tuusuario",
  instagram: "https://www.instagram.com/tuusuario",
  youtube:   "https://www.youtube.com/@tucanal",
};

// Mismo criterio que fn_handle_de_url en la base.
export const handleFromProfile = (url) => {
  const limpio = (url || "").split("?")[0].replace(/\/+$/, "");
  return (limpio.split("/").pop() || "").replace(/^@/, "").toLowerCase();
};

// Devuelve un mensaje de error si no se puede agregar, o null si es válido
export function validateNewAccount(accounts, platform, url) {
  const u = (url || "").trim();
  if (!u) return "Ingresa el link o @usuario de la cuenta.";

  const patron = URL_PATTERNS[platform];
  if (patron && !patron.test(u)) {
    const otra = Object.keys(URL_PATTERNS).find(p => URL_PATTERNS[p].test(u));
    if (otra)
      return `Ese link es de ${PLATFORM_LABELS[otra]}, pero tienes seleccionado ${PLATFORM_LABELS[platform]}.`;
    if (/vt\.tiktok\.com|vm\.tiktok\.com|youtu\.be/i.test(u))
      return `Ese es un link corto y no permite verificar de quién es la cuenta. Usa la URL de tu perfil: ${PROFILE_EXAMPLES[platform]}`;
    return `Registra la URL de tu perfil, no un video. Ejemplo: ${PROFILE_EXAMPLES[platform]}`;
  }

  if (accounts.some(a => a.platform === platform && a.url.trim().toLowerCase() === u.toLowerCase()))
    return "Esa cuenta ya está registrada.";
  if (accounts.filter(a => a.platform === platform).length >= MAX_PER_PLATFORM)
    return `Máximo ${MAX_PER_PLATFORM} cuentas de ${PLATFORM_LABELS[platform]}. Elimina una para agregar otra.`;
  if (accounts.length >= MAX_TOTAL)
    return `Máximo ${MAX_TOTAL} cuentas en total.`;
  return null;
}