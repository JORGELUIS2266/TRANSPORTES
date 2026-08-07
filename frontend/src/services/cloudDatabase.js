/**
 * BASE DE DATOS MAESTRA EN LA NUBE EN TIEMPO REAL (MULTI-DISPOSITIVO)
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 * 
 * Conecta todas las computadoras, teléfonos Android, iPhones y tablets
 * en Vercel a un mismo almacén centralizado en tiempo real.
 */

const CLOUD_MASTER_ENDPOINT = 'https://jsonblob.com/api/jsonBlob/019fddc3-c9f1-74c4-b72f-b526ef1c370d';

let lastSyncTimestamp = 0;
let isSaving = false;

export const cloudDatabase = {
  /**
   * Consulta la base de datos central compartida en la nube.
   */
  async fetchCloudData() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(CLOUD_MASTER_ENDPOINT, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const doc = await res.json();
        if (doc && doc.app === 'TRANSPORTE TIERRA DE HUMOS') {
          lastSyncTimestamp = doc.updated_at || Date.now();
          return doc;
        }
      }
    } catch (e) {
      console.warn('[CloudDB] Error consultando nube central:', e.message);
    }
    return null;
  },

  /**
   * Guarda y actualiza la base de datos central en la nube.
   */
  async saveCloudData(payload) {
    if (isSaving) return false;
    isSaving = true;
    try {
      const now = Date.now();
      const envelope = {
        app: 'TRANSPORTE TIERRA DE HUMOS',
        ruta: 'Tlaxiaco ➔ Putla',
        updated_at: now,
        users: Array.isArray(payload.users) ? payload.users : [],
        registros: Array.isArray(payload.registros) ? payload.registros : [],
        unidades: Array.isArray(payload.unidades) ? payload.unidades : [],
        duenos: Array.isArray(payload.duenos) ? payload.duenos : [],
        conductores: Array.isArray(payload.conductores) ? payload.conductores : [],
        bitacora_auditoria: Array.isArray(payload.bitacora_auditoria) ? payload.bitacora_auditoria : [],
        prestamos: Array.isArray(payload.prestamos) ? payload.prestamos : [],
        semana_activa: payload.semana_activa || null
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(CLOUD_MASTER_ENDPOINT, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(envelope),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        lastSyncTimestamp = now;
        return true;
      }
    } catch (e) {
      console.warn('[CloudDB] Error subiendo cambios a la nube:', e.message);
    } finally {
      isSaving = false;
    }
    return false;
  },

  getLastSyncTimestamp() {
    return lastSyncTimestamp;
  }
};
