// Fuente única de alertas globales (toast). Uso: showAlert("success" | "danger" | "warning" | "info", "mensaje")
let listeners = [];
let nextId = 1;

export function showAlert(type, message) {
  const alert = { id: nextId++, type, message };
  listeners.forEach(fn => fn(alert));
}

export function subscribeAlerts(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

// Diálogo de confirmación con el estilo del sistema.
// Uso: const ok = await confirmDialog("¿Eliminar X?", { danger: true, confirmLabel: "Eliminar" });
let confirmHandler = null;

export function confirmDialog(message, opts = {}) {
  return new Promise(resolve => {
    if (!confirmHandler) return resolve(false);
    confirmHandler({ message, ...opts, resolve });
  });
}

export function registerConfirmHandler(fn) {
  confirmHandler = fn;
  return () => { confirmHandler = null; };
}