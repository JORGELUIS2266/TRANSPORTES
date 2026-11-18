/**
 * SISTEMA GLOBAL DE NOTIFICACIONES FUTURISTAS (TOASTS)
 * TRANSPORTE TIERRA DE HUMO — TLAXIACO ⇄ PUTLA
 */
import { reactive } from 'vue';

export const toastState = reactive({
  items: [],
  position: 'top-left' // 'top-left' | 'bottom-left'
});

let counter = 0;

export function notify({
  title = 'Sistema Tierra de Humo',
  message = '',
  type = 'info', // 'success' | 'error' | 'warning' | 'info' | 'camera'
  duration = 4800,
  actionText = '',
  onAction = null
}) {
  const id = ++counter + '_' + Date.now();
  const item = {
    id,
    title,
    message,
    type,
    duration,
    actionText,
    onAction,
    createdAt: Date.now()
  };

  toastState.items.unshift(item);

  // Limitar a máximo 5 notificaciones visibles al mismo tiempo
  if (toastState.items.length > 5) {
    toastState.items.pop();
  }

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

export function dismissToast(id) {
  const idx = toastState.items.findIndex(t => t.id === id);
  if (idx !== -1) {
    toastState.items.splice(idx, 1);
  }
}

export const toast = {
  success(title, message = '', duration = 4200) {
    return notify({ title, message, type: 'success', duration });
  },
  error(title, message = '', duration = 5500) {
    return notify({ title, message, type: 'error', duration });
  },
  warning(title, message = '', duration = 5000) {
    return notify({ title, message, type: 'warning', duration });
  },
  info(title, message = '', duration = 4500) {
    return notify({ title, message, type: 'info', duration });
  },
  camera(title, message = '', actionText = '', onAction = null, duration = 6000) {
    return notify({ title, message, type: 'camera', actionText, onAction, duration });
  }
};
