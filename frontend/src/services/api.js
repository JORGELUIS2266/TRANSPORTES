/**
 * SERVICIO DE DATOS CON SUPABASE — BASE DE DATOS REAL EN LA NUBE
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 *
 * Cada operación (leer, guardar, borrar) ocurre directamente en la base de datos
 * PostgreSQL alojada en Supabase. Todos los dispositivos ven los mismos datos.
 */

import { supabase } from './supabase';
import { decryptPayload } from '../utils/crypto';
import { getSemanaIdParaFecha, getSemanaActualId } from '../utils/semanas';
import { getClientGeoInfoSync, getDeviceInfo } from '../utils/ipTracker';

const SESSION_STORAGE_KEY = 'th_session_encrypted_v2';

function getActiveUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const dec = decryptPayload(raw);
      if (dec && dec.username) return dec;
    }
  } catch {}
  return { username: 'sistema', nombre: 'Sistema', rol: 'admin' };
}

export const api = {

  // ── Bitácora de Auditoría ──────────────────────────────────────────────────
  async registrarActividad(accion, detalle, categoria = 'captura', icono = '📝', usuarioCustom = null, seccionCustom = null) {
    const user = usuarioCustom || getActiveUser();
    const geo  = getClientGeoInfoSync();
    const dispositivo = getDeviceInfo();
    const rutaActual  = window?.location?.pathname || '';

    let seccion = seccionCustom || '📱 Captura Diaria';
    if (rutaActual.includes('/resumen'))  seccion = '📊 Resumen de Planilla';
    else if (rutaActual.includes('/vueltas'))  seccion = '🔄 Conteo de Vueltas';
    else if (rutaActual.includes('/unidades')) seccion = '🚐 Gestión de Unidades';
    else if (rutaActual.includes('/exportar')) seccion = '📄 Exportar y Respaldos';
    else if (rutaActual.includes('/bitacora')) seccion = '📜 Bitácora de Auditoría';

    const log = {
      id:         'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp:  new Date().toISOString(),
      usuario:    user.username || 'sistema',
      nombre:     user.nombre   || 'Sistema',
      rol:        user.rol      || 'capturista',
      accion,
      detalle,
      categoria,
      icono,
      ip:         geo.ip,
      ubicacion:  geo.ubicacion,
      ciudad:     geo.ciudad,
      region:     geo.region,
      dispositivo,
      seccion
    };

    await supabase.from('bitacora_auditoria').insert([log]).catch(e => {
      console.warn('[api] Error registrando actividad:', e?.message);
    });
    return log;
  },

  async getBitacoraAuditoria() {
    const { data, error } = await supabase
      .from('bitacora_auditoria')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);
    if (error) { console.warn('[api] Error leyendo bitácora:', error.message); return []; }
    return data || [];
  },

  async borrarBitacoraAuditoria() {
    await supabase.from('bitacora_auditoria').delete().neq('id', '');
    return true;
  },

  async getUsuariosConectados() {
    // Retorna los últimos usuarios que tuvieron actividad en las últimas 10 minutos
    const hace10min = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('bitacora_auditoria')
      .select('usuario, nombre, rol, dispositivo, ubicacion, timestamp')
      .gte('timestamp', hace10min)
      .order('timestamp', { ascending: false })
      .limit(50);
    if (!data) return [];
    const seen = new Set();
    return data.filter(d => {
      if (seen.has(d.usuario)) return false;
      seen.add(d.usuario);
      return true;
    });
  },

  // ── Semana Activa ──────────────────────────────────────────────────────────
  getSemanaActiva() {
    return localStorage.getItem('th_semana_activa') || getSemanaActualId();
  },

  setSemanaActiva(semanaId) {
    localStorage.setItem('th_semana_activa', semanaId);
    return semanaId;
  },

  // ── Dueños ─────────────────────────────────────────────────────────────────
  async getDuenos() {
    const { data, error } = await supabase.from('duenos').select('*').order('nombre');
    if (error) { console.warn('[api] getDuenos error:', error.message); return []; }
    return data || [];
  },

  async guardarDueno(dueno) {
    const esNuevo = !dueno.id;
    if (esNuevo) dueno.id = 'd_' + Date.now();
    const { data, error } = await supabase.from('duenos').upsert([dueno]).select();
    if (error) throw new Error('Error guardando dueño: ' + error.message);
    this.registrarActividad(
      esNuevo ? 'Creó dueño de unidad' : 'Modificó dueño',
      `Propietario "${dueno.nombre}"`,
      'catalogo', '👤'
    );
    return data?.[0] || dueno;
  },

  async eliminarDueno(id) {
    const { data: dueno } = await supabase.from('duenos').select('nombre').eq('id', id).single();
    await supabase.from('unidades').update({ dueno_id: null }).eq('dueno_id', id);
    await supabase.from('duenos').delete().eq('id', id);
    this.registrarActividad('Eliminó dueño', `Eliminó al propietario "${dueno?.nombre || id}"`, 'catalogo', '🗑️');
    return true;
  },

  // ── Unidades ───────────────────────────────────────────────────────────────
  async getUnidades() {
    const { data, error } = await supabase
      .from('unidades')
      .select('*, dueno:duenos(id, nombre, telefono)')
      .order('numero');
    if (error) { console.warn('[api] getUnidades error:', error.message); return []; }
    return data || [];
  },

  async guardarUnidad(unidad) {
    const esNueva = !unidad.id;
    if (esNueva) unidad.id = 'u_' + Date.now();
    const payload = {
      id:       unidad.id,
      numero:   unidad.numero,
      placas:   unidad.placas,
      modelo:   unidad.modelo,
      dueno_id: unidad.dueno_id || null
    };
    const { data, error } = await supabase.from('unidades').upsert([payload]).select();
    if (error) throw new Error('Error guardando unidad: ' + error.message);
    this.registrarActividad(
      esNueva ? 'Creó unidad' : 'Modificó unidad',
      `Unidad ${unidad.numero} (${unidad.modelo || 'S/M'})`,
      'catalogo', '🚐'
    );
    return data?.[0] || unidad;
  },

  async eliminarUnidad(id) {
    const { data: u } = await supabase.from('unidades').select('numero').eq('id', id).single();
    await supabase.from('unidades').delete().eq('id', id);
    this.registrarActividad('Eliminó unidad', `Eliminó del catálogo la Unidad ${u?.numero || id}`, 'catalogo', '🗑️');
    return true;
  },

  // ── Conductores ────────────────────────────────────────────────────────────
  async getConductores() {
    const { data, error } = await supabase.from('conductores').select('*').order('nombre');
    if (error) { console.warn('[api] getConductores error:', error.message); return []; }
    return data || [];
  },

  async guardarConductor(cond) {
    if (!cond.id) cond.id = 'c_' + Date.now();
    const { data, error } = await supabase.from('conductores').upsert([cond]).select();
    if (error) throw new Error('Error guardando conductor: ' + error.message);
    return data?.[0] || cond;
  },

  // ── Registros de Vueltas Diarias ───────────────────────────────────────────
  async getRegistrosDeSemana(semanaId) {
    if (!semanaId) return [];
    const { data, error } = await supabase
      .from('registros')
      .select('*')
      .eq('semana_id', semanaId)
      .order('fecha', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) { console.warn('[api] getRegistrosDeSemana error:', error.message); return []; }
    return data || [];
  },

  async getPendientesArrastre(semanaAnteriorId) {
    if (!semanaAnteriorId) return [];
    const { data, error } = await supabase
      .from('registros')
      .select('*')
      .eq('semana_id', semanaAnteriorId)
      .eq('estado', 'pendiente')
      .order('fecha');
    if (error) { console.warn('[api] getPendientesArrastre error:', error.message); return []; }
    return data || [];
  },

  async guardarRegistro(registro) {
    const semId = registro.semana_id || (registro.fecha ? getSemanaIdParaFecha(registro.fecha) : getSemanaActualId());
    const b1      = Number(registro.bitacora_tlaxiaco_putla) || 0;
    const b2      = Number(registro.bitacora_putla_tlaxiaco) || 0;
    const inter   = Number(registro.intermedios)    || 0;
    const comb    = Number(registro.combustible)    || 0;
    const imprev  = Number(registro.gastos_imprevistos) || 0;
    const totalGen  = b1 + b2 + inter;
    const totalNeto = totalGen - comb - imprev;

    const esNuevo = !registro.id;
    const rec = {
      id:                      registro.id || 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      semana_id:               semId,
      fecha:                   registro.fecha || new Date().toISOString().split('T')[0],
      numero_unidad:           (registro.numero_unidad || '').trim(),
      nombre_conductor:        (registro.nombre_conductor || '').trim(),
      dueno_nombre:            registro.dueno_nombre || '',
      vueltas_dadas:           Number(registro.vueltas_dadas) || 1,
      bitacora_tlaxiaco_putla: b1,
      bitacora_putla_tlaxiaco: b2,
      intermedios:             inter,
      total_generado:          totalGen,
      combustible:             comb,
      gastos_imprevistos:      imprev,
      concepto_gastos:         registro.concepto_gastos || '',
      total_neto:              totalNeto,
      estado:                  registro.estado || 'completado',
      arrastre:                registro.arrastre || false
    };

    const { data, error } = await supabase.from('registros').upsert([rec]).select();
    if (error) throw new Error('Error guardando registro: ' + error.message);

    this.registrarActividad(
      esNuevo ? 'Capturó nueva vuelta' : 'Modificó vuelta diaria',
      `Unidad ${rec.numero_unidad} (${rec.nombre_conductor}) · Fecha: ${rec.fecha} · Gen: $${rec.total_generado.toFixed(2)} · Comb: $${rec.combustible} · Neto: $${rec.total_neto.toFixed(2)}`,
      esNuevo ? 'captura' : 'edicion',
      esNuevo ? '💾' : '✏️'
    );
    return data?.[0] || rec;
  },

  async completarArrastre(id, nuevaSemanaId) {
    const { data, error } = await supabase
      .from('registros')
      .update({ semana_id: nuevaSemanaId, estado: 'completado', arrastre: true })
      .eq('id', id)
      .select();
    if (error) throw new Error('Error en arrastre: ' + error.message);
    this.registrarActividad('Completó arrastre de vuelta', `Registro ${id} → semana ${nuevaSemanaId}`, 'captura', '✅');
    return data?.[0] || null;
  },

  async eliminarRegistro(id) {
    const { data: r } = await supabase.from('registros').select('*').eq('id', id).single();
    await supabase.from('registros').delete().eq('id', id);
    this.registrarActividad(
      'Eliminó registro de vuelta',
      `Unidad ${r?.numero_unidad || 'S/N'} (${r?.nombre_conductor || ''}) del ${r?.fecha || ''} · Monto: $${r?.total_neto || 0}`,
      'eliminacion', '🗑️'
    );
    return true;
  },

  async borrarSemana(semanaId) {
    const { count } = await supabase.from('registros').select('id', { count: 'exact' }).eq('semana_id', semanaId);
    await supabase.from('registros').delete().eq('semana_id', semanaId);
    this.registrarActividad('Vació semana de capturas', `Eliminó ${count || 0} registros de la semana ${semanaId}`, 'eliminacion', '⚠️');
    return true;
  },

  async borrarHistorial() {
    await supabase.from('registros').delete().neq('id', '');
    this.registrarActividad('Vació historial completo', 'Borró todos los registros del sistema', 'eliminacion', '🚨');
    return true;
  },

  async getAllRegistros() {
    const { data, error } = await supabase.from('registros').select('*').order('semana_id').order('fecha');
    if (error) { console.warn('[api] getAllRegistros error:', error.message); return []; }
    return data || [];
  },

  // ── Respaldos ──────────────────────────────────────────────────────────────
  async getBackupData() {
    const [registros, unidades, duenos, conductores, bitacora] = await Promise.all([
      this.getAllRegistros(),
      this.getUnidades(),
      this.getDuenos(),
      this.getConductores(),
      this.getBitacoraAuditoria()
    ]);
    this.registrarActividad('Exportó respaldo completo', 'Descargó archivo JSON de respaldo', 'exportacion', '☁️');
    return {
      version: '4.0_SUPABASE',
      timestamp: new Date().toISOString(),
      app: 'TRANSPORTE TIERRA DE HUMOS',
      data: { registros, unidades, duenos, conductores, bitacora_auditoria: bitacora, semana_activa: this.getSemanaActiva() }
    };
  },

  async restoreBackupData(backup) {
    if (!backup?.data) throw new Error('El archivo de respaldo no es válido.');
    const d = backup.data;
    if (d.duenos?.length)    await supabase.from('duenos').upsert(d.duenos);
    if (d.unidades?.length)  await supabase.from('unidades').upsert(d.unidades.map(u => ({ id: u.id, numero: u.numero, placas: u.placas, modelo: u.modelo, dueno_id: u.dueno_id || null })));
    if (d.conductores?.length) await supabase.from('conductores').upsert(d.conductores);
    if (d.registros?.length) await supabase.from('registros').upsert(d.registros);
    this.registrarActividad('Restauró base de datos', 'Cargó un archivo de respaldo previo', 'seguridad', '📂');
    return true;
  },

  // ── Aliases Legacy ─────────────────────────────────────────────────────────
  async getRegistrosDiarios() { return this.getAllRegistros(); },
  async addDueno(dueno) { return this.guardarDueno(dueno); },
  async addUnidad(unidad) { return this.guardarUnidad(unidad); },
  async addConductor(cond) { return this.guardarConductor(cond); },
  async getPrestamos() { return []; },
  async addPrestamo() { return null; },

  // Stubs para compatibilidad con Navbar (ya no se necesitan para cloud sync)
  async pushFullStoreToCloud() { return true; },
  async pullFullStoreFromCloud() { return true; }
};
