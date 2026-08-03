// Registro global de cuentas del editor (guardado en su usuario: editor_accounts)
export const PLATFORMS = ["tiktok", "instagram", "youtube"];
export const PLATFORM_LABELS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
export const MAX_PER_PLATFORM = 3;
export const MAX_TOTAL = 9;

export const shortUrl = (url) => (url || "").replace(/^https?:\/\/(www\.)?/, "").slice(0, 40);

// Devuelve un mensaje de error si no se puede agregar, o null si es válido
export function validateNewAccount(accounts, platform, url) {
  const u = (url || "").trim();
  if (!u) return "Ingresa el link o @usuario de la cuenta.";
  if (accounts.some(a => a.platform === platform && a.url.trim().toLowerCase() === u.toLowerCase()))
    return "Esa cuenta ya está registrada.";
  if (accounts.filter(a => a.platform === platform).length >= MAX_PER_PLATFORM)
    return `Máximo ${MAX_PER_PLATFORM} cuentas de ${PLATFORM_LABELS[platform]}. Elimina una para agregar otra.`;
  if (accounts.length >= MAX_TOTAL)
    return `Máximo ${MAX_TOTAL} cuentas en total.`;
  return null;
}