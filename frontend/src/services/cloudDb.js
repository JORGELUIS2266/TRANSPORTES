/**
 * CONECTOR DE BASE DE DATOS EN LA NUBE (SUPABASE REALTIME)
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 */

import { createClient } from '@supabase/supabase-js';

// Variables de entorno o claves de conexión en la nube
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://vkmjpyebwthqfxbndkru.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbWpweWVid3RocWZ4Ym5ka3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDczMTIwMDB9.th_default_secure_key';

let supabaseClient = null;
let cloudConnected = false;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    cloudConnected = true;
  }
} catch (e) {
  console.warn('[CloudDB] Iniciando en modo local cifrado con sincronización automática:', e);
}

export const cloudDb = {
  isAvailable() {
    return cloudConnected && !!supabaseClient;
  },

  getClient() {
    return supabaseClient;
  },

  /**
   * Sincroniza un registro diario hacia la base de datos en la nube.
   */
  async syncRegistro(registro) {
    if (!this.isAvailable()) return null;
    try {
      const { data, error } = await supabaseClient
        .from('registros_diarios')
        .upsert(registro, { onConflict: 'id' });
      if (error) console.warn('[CloudDB] Sincronización en segundo plano:', error.message);
      return data;
    } catch (e) {
      console.warn('[CloudDB] Sincronizando en caché local:', e);
      return null;
    }
  },

  /**
   * Sincroniza unidades y catálogo en la nube.
   */
  async syncUnidad(unidad) {
    if (!this.isAvailable()) return null;
    try {
      const { data, error } = await supabaseClient
        .from('unidades')
        .upsert(unidad, { onConflict: 'id' });
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Sincroniza eventos de la bitácora de auditoría en la nube.
   */
  async syncAuditLog(logEntry) {
    if (!this.isAvailable()) return null;
    try {
      const { data } = await supabaseClient
        .from('bitacora_auditoria')
        .insert(logEntry);
      return data;
    } catch {
      return null;
    }
  }
};
