/**
 * BASE DE DATOS GLOBAL EN LA NUBE EN TIEMPO REAL (MULTI-DISPOSITIVO)
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 * 
 * Conecta todas las computadoras, celulares y tablets desplegados en Vercel
 * a un mismo almacén central en la nube.
 */

const MASTER_DB_KEY = 'th_master_cloud_db_v2026_tlaxiaco_putla';
const PRIMARY_ENDPOINT = 'https://api.restful-api.dev/objects';

let masterObjectId = null;
let lastSyncTimestamp = 0;
let isSyncing = false;

// Recuperar ID del registro maestro en la nube si ya existe localmente
try {
  masterObjectId = localStorage.getItem('th_cloud_master_id') || null;
} catch {}

export const cloudDatabase = {
  /**
   * Carga la base de datos completa desde el servidor en la nube.
   */
  async fetchCloudData() {
    try {
      // 1. Si ya tenemos el ID del documento maestro, consultarlo directamente
      if (masterObjectId) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${PRIMARY_ENDPOINT}/${masterObjectId}`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const doc = await res.json();
          if (doc && doc.data && doc.data.app === 'TRANSPORTE TIERRA DE HUMOS') {
            lastSyncTimestamp = doc.data.updated_at || Date.now();
            return doc.data;
          }
        }
      }

      // 2. Si no tenemos el ID, buscar el registro maestro de la empresa
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 5000);
      const searchRes = await fetch(PRIMARY_ENDPOINT, { signal: controller2.signal });
      clearTimeout(timeout2);

      if (searchRes.ok) {
        const list = await searchRes.json();
        if (Array.isArray(list)) {
          const match = list.find(item => item && item.name === MASTER_DB_KEY && item.data && item.data.app === 'TRANSPORTE TIERRA DE HUMOS');
          if (match) {
            masterObjectId = match.id;
            localStorage.setItem('th_cloud_master_id', masterObjectId);
            lastSyncTimestamp = match.data.updated_at || Date.now();
            return match.data;
          }
        }
      }
    } catch (e) {
      console.warn('[CloudDatabase] Error consultando la nube central:', e.message);
    }
    return null;
  },

  /**
   * Guarda o actualiza la base de datos completa en el servidor en la nube.
   */
  async saveCloudData(payload) {
    if (isSyncing) return false;
    isSyncing = true;
    try {
      const now = Date.now();
      const envelope = {
        name: MASTER_DB_KEY,
        data: {
          app: 'TRANSPORTE TIERRA DE HUMOS',
          ruta: 'Tlaxiaco ➔ Putla',
          updated_at: now,
          users: payload.users || [],
          registros: payload.registros || [],
          unidades: payload.unidades || [],
          duenos: payload.duenos || [],
          conductores: payload.conductores || [],
          bitacora_auditoria: payload.bitacora_auditoria || [],
          prestamos: payload.prestamos || [],
          semana_activa: payload.semana_activa || null
        }
      };

      // Si ya tenemos ID, hacer PUT (actualizar)
      if (masterObjectId) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const putRes = await fetch(`${PRIMARY_ENDPOINT}/${masterObjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (putRes.ok) {
          lastSyncTimestamp = now;
          return true;
        }
      }

      // Si no existe, hacer POST (crear el maestro)
      const controllerPost = new AbortController();
      const timeoutPost = setTimeout(() => controllerPost.abort(), 4500);
      const postRes = await fetch(PRIMARY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope),
        signal: controllerPost.signal
      });
      clearTimeout(timeoutPost);

      if (postRes.ok) {
        const created = await postRes.json();
        if (created && created.id) {
          masterObjectId = created.id;
          localStorage.setItem('th_cloud_master_id', masterObjectId);
          lastSyncTimestamp = now;
          return true;
        }
      }
    } catch (e) {
      console.warn('[CloudDatabase] Error subiendo cambios a la nube:', e.message);
    } finally {
      isSyncing = false;
    }
    return false;
  },

  getLastSyncTimestamp() {
    return lastSyncTimestamp;
  }
};
