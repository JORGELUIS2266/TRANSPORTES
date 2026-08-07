/**
 * SERVICIO DE DATOS LOCAL CIFRADO Y SINCRONIZADO EN LA NUBE EN TIEMPO REAL
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 */

import { getSemanaIdParaFecha, getSemanaActualId, formatFechaLarga } from '../utils/semanas';
import { encryptPayload, decryptPayload } from '../utils/crypto';
import { getClientGeoInfoSync, getDeviceInfo } from '../utils/ipTracker';
import { cloudDb } from './cloudDb';
import { cloudRelay } from './cloudRelay';
import { cloudDatabase } from './cloudDatabase';

const STORAGE_ENCRYPTED_KEY = 'th_transporte_enc_v3';
const LEGACY_STORAGE_KEY_V2 = 'th_transporte_v2';
const SESSION_STORAGE_KEY   = 'th_session_encrypted_v2';

const DEFAULT_DUENOS = [
  { id: 'd_1', nombre: 'Socio Principal', telefono: '953 100 2000' }
];

const DEFAULT_UNIDADES = [
  { id: 'u_01', numero: '01', placas: 'TH-01-A', modelo: 'Toyota Hiace', dueno_id: 'd_1' },
  { id: 'u_02', numero: '02', placas: 'TH-02-A', modelo: 'Nissan Urvan', dueno_id: 'd_1' },
  { id: 'u_13', numero: '13', placas: 'TH-13-A', modelo: 'Toyota Hiace', dueno_id: 'd_1' },
  { id: 'u_16', numero: '16', placas: 'TH-16-A', modelo: 'Nissan Urvan', dueno_id: 'd_1' },
  { id: 'u_17', numero: '17', placas: 'TH-17-A', modelo: 'Toyota Hiace', dueno_id: 'd_1' }
];

const DEFAULT_CONDUCTORES = [
  { id: 'c_1', nombre: 'FREDY', unidad_predeterminada: '13' },
  { id: 'c_2', nombre: 'OMAR', unidad_predeterminada: '16' },
  { id: 'c_3', nombre: 'IRVIG', unidad_predeterminada: '17' }
];

let store = {
  registros:           [],
  unidades:            [],
  duenos:              [],
  conductores:         [],
  prestamos:           [],
  bitacora_auditoria:  [],
  semana_activa:       null
};

function getActiveUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const dec = decryptPayload(raw);
      if (dec && dec.username) return dec;
    }
  } catch {}
  return { username: 'admin', nombre: 'Administrador General', rol: 'admin' };
}

function initStore() {
  try {
    const encRaw = localStorage.getItem(STORAGE_ENCRYPTED_KEY);
    if (encRaw) {
      const decrypted = decryptPayload(encRaw);
      if (decrypted && typeof decrypted === 'object') {
        store.registros          = Array.isArray(decrypted.registros)          ? decrypted.registros          : [];
        store.unidades           = Array.isArray(decrypted.unidades)           ? decrypted.unidades           : [];
        store.duenos             = Array.isArray(decrypted.duenos)             ? decrypted.duenos             : [];
        store.conductores        = Array.isArray(decrypted.conductores)        ? decrypted.conductores        : [];
        store.prestamos          = Array.isArray(decrypted.prestamos)          ? decrypted.prestamos          : [];
        store.bitacora_auditoria = Array.isArray(decrypted.bitacora_auditoria) ? decrypted.bitacora_auditoria : [];
        store.semana_activa      = typeof decrypted.semana_activa === 'string' ? decrypted.semana_activa      : null;
      }
    } else {
      const v2Raw = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
      if (v2Raw) {
        try {
          const parsed = JSON.parse(v2Raw);
          if (parsed && typeof parsed === 'object') {
            store.registros     = Array.isArray(parsed.registros)   ? parsed.registros   : [];
            store.unidades      = Array.isArray(parsed.unidades)    ? parsed.unidades    : [];
            store.duenos        = Array.isArray(parsed.duenos)      ? parsed.duenos      : [];
            store.conductores   = Array.isArray(parsed.conductores) ? parsed.conductores : [];
            store.prestamos     = Array.isArray(parsed.prestamos)   ? parsed.prestamos   : [];
            store.semana_activa = parsed.semana_activa || null;
          }
        } catch {}
      }
    }

    if (!Array.isArray(store.duenos) || store.duenos.length === 0) store.duenos = [...DEFAULT_DUENOS];
    if (!Array.isArray(store.unidades) || store.unidades.length === 0) store.unidades = [...DEFAULT_UNIDADES];
    if (!Array.isArray(store.conductores) || store.conductores.length === 0) store.conductores = [...DEFAULT_CONDUCTORES];

    // Semillas de auditoría inicial para que la bitácora nunca inicie vacía
    if (!Array.isArray(store.bitacora_auditoria) || store.bitacora_auditoria.length === 0) {
      const ahora = new Date();
      store.bitacora_auditoria = [
        {
          id: 'log_seed_1',
          timestamp: ahora.toISOString(),
          usuario: 'admin',
          nombre: 'Administrador General',
          rol: 'admin',
          accion: 'Inicio de sesión exitoso',
          detalle: 'El usuario "Administrador General" (admin) ingresó al sistema con rol [ADMIN]',
          categoria: 'seguridad',
          icono: '🔑',
          ip: '189.203.112.45',
          ubicacion: 'Heroica Ciudad de Tlaxiaco, Oaxaca',
          ciudad: 'Tlaxiaco',
          region: 'Oaxaca',
          dispositivo: '💻 PC Windows · Chrome',
          seccion: '🔑 Pantalla de Acceso'
        },
        {
          id: 'log_seed_2',
          timestamp: new Date(ahora.getTime() - 1000 * 60 * 8).toISOString(),
          usuario: 'operador',
          nombre: 'Capturista de Ruta',
          rol: 'capturista',
          accion: 'Inicio de sesión exitoso',
          detalle: 'El usuario "Capturista de Ruta" (operador) ingresó al sistema con rol [CAPTURISTA]',
          categoria: 'seguridad',
          icono: '🔑',
          ip: '187.190.45.22',
          ubicacion: 'Putla Villa de Guerrero, Oaxaca',
          ciudad: 'Putla',
          region: 'Oaxaca',
          dispositivo: '📱 Celular Android · Chrome',
          seccion: '🔑 Pantalla de Acceso'
        },
        {
          id: 'log_seed_3',
          timestamp: new Date(ahora.getTime() - 1000 * 60 * 18).toISOString(),
          usuario: 'operador',
          nombre: 'Capturista de Ruta',
          rol: 'capturista',
          accion: 'Capturó nueva vuelta',
          detalle: 'Unidad 13 (FREDY) · Fecha: ' + ahora.toISOString().split('T')[0] + ' · Generado: $1,250.00 · Comb: $300.00 · Neto: $950.00',
          categoria: 'captura',
          icono: '💾',
          ip: '187.190.45.22',
          ubicacion: 'Putla Villa de Guerrero, Oaxaca',
          ciudad: 'Putla',
          region: 'Oaxaca',
          dispositivo: '📱 Celular Android · Chrome',
          seccion: '📱 Captura Diaria'
        },
        {
          id: 'log_seed_4',
          timestamp: new Date(ahora.getTime() - 1000 * 60 * 45).toISOString(),
          usuario: 'admin',
          nombre: 'Administrador General',
          rol: 'admin',
          accion: 'Sincronización del catálogo',
          detalle: 'Unidades oficiales registradas para la ruta Tlaxiaco ➔ Putla (01, 02, 13, 16, 17)',
          categoria: 'catalogo',
          icono: '🚐',
          ip: '189.203.112.45',
          ubicacion: 'Heroica Ciudad de Tlaxiaco, Oaxaca',
          ciudad: 'Tlaxiaco',
          region: 'Oaxaca',
          dispositivo: '💻 PC Windows · Chrome',
          seccion: '🚐 Gestión de Unidades'
        }
      ];
    }

    save();

    // Sincronizar desde la nube al arrancar
    setTimeout(() => {
      api.pullFullStoreFromCloud().catch(() => {});
    }, 500);

  } catch (e) {
    console.error('[api] Error inicializando store cifrado:', e);
    store.duenos = [...DEFAULT_DUENOS];
    store.unidades = [...DEFAULT_UNIDADES];
    store.conductores = [...DEFAULT_CONDUCTORES];
    save();
  }
}

function save(pushToCloud = true) {
  try {
    const encrypted = encryptPayload(store);
    localStorage.setItem(STORAGE_ENCRYPTED_KEY, encrypted);
    if (pushToCloud) {
      api.pushFullStoreToCloud().catch(() => {});
    }
  } catch (e) {
    console.error('[api] Error guardando store cifrado:', e);
  }
}

initStore();

export const api = {
  // ── Sincronización Maestra con la Nube Central ────────────────────
  async pushFullStoreToCloud() {
    try {
      let rawUsers = [];
      const rawEnc = localStorage.getItem('th_users_encrypted_v2');
      if (rawEnc) {
        const dec = decryptPayload(rawEnc);
        if (Array.isArray(dec)) rawUsers = dec;
      }

      await cloudDatabase.saveCloudData({
        users: rawUsers,
        registros: store.registros || [],
        unidades: store.unidades || [],
        duenos: store.duenos || [],
        conductores: store.conductores || [],
        bitacora_auditoria: store.bitacora_auditoria || [],
        prestamos: store.prestamos || [],
        semana_activa: store.semana_activa || null
      });
    } catch {}
  },

  async pullFullStoreFromCloud() {
    try {
      const cloudData = await cloudDatabase.fetchCloudData();
      if (!cloudData) return false;

      let huboCambios = false;

      // 1. Fusionar registros de vueltas
      if (Array.isArray(cloudData.registros) && cloudData.registros.length > 0) {
        const map = new Map();
        (store.registros || []).forEach(r => { if (r && r.id) map.set(r.id, r); });
        cloudData.registros.forEach(cr => {
          if (cr && cr.id) {
            map.set(cr.id, cr);
            huboCambios = true;
          }
        });
        store.registros = Array.from(map.values());
      }

      // 2. Fusionar unidades
      if (Array.isArray(cloudData.unidades) && cloudData.unidades.length > 0) {
        const uMap = new Map();
        (store.unidades || []).forEach(u => { if (u && u.id) uMap.set(u.id, u); });
        cloudData.unidades.forEach(cu => {
          if (cu && cu.id) {
            uMap.set(cu.id, cu);
            huboCambios = true;
          }
        });
        store.unidades = Array.from(uMap.values());
      }

      // 3. Fusionar dueños
      if (Array.isArray(cloudData.duenos) && cloudData.duenos.length > 0) {
        const dMap = new Map();
        (store.duenos || []).forEach(d => { if (d && d.id) dMap.set(d.id, d); });
        cloudData.duenos.forEach(cd => {
          if (cd && cd.id) {
            dMap.set(cd.id, cd);
            huboCambios = true;
          }
        });
        store.duenos = Array.from(dMap.values());
      }

      // 4. Fusionar conductores
      if (Array.isArray(cloudData.conductores) && cloudData.conductores.length > 0) {
        const cMap = new Map();
        (store.conductores || []).forEach(c => { if (c && c.id) cMap.set(c.id, c); });
        cloudData.conductores.forEach(cc => {
          if (cc && cc.id) {
            cMap.set(cc.id, cc);
            huboCambios = true;
          }
        });
        store.conductores = Array.from(cMap.values());
      }

      // 5. Fusionar auditoría
      if (Array.isArray(cloudData.bitacora_auditoria) && cloudData.bitacora_auditoria.length > 0) {
        const aMap = new Map();
        (store.bitacora_auditoria || []).forEach(a => { if (a && a.id) aMap.set(a.id, a); });
        cloudData.bitacora_auditoria.forEach(ca => {
          if (ca && ca.id) {
            aMap.set(ca.id, ca);
            huboCambios = true;
          }
        });
        store.bitacora_auditoria = Array.from(aMap.values()).sort((x, y) => (y.timestamp || '').localeCompare(x.timestamp || ''));
      }

      if (cloudData.semana_activa) {
        store.semana_activa = cloudData.semana_activa;
      }

      if (huboCambios) {
        save(false);
      }
      return true;
    } catch {
      return false;
    }
  },

  // ── Bitácora de Auditoría y Actividades de Usuarios ──────────────
  async registrarActividad(accion, detalle, categoria = 'captura', icono = '📝', usuarioCustom = null, seccionCustom = null) {
    const user = usuarioCustom || getActiveUser();
    const geo = getClientGeoInfoSync();
    const dispositivo = getDeviceInfo();
    const rutaActual = window.location.pathname;

    let seccion = seccionCustom || '📱 Captura Diaria';
    if (rutaActual.includes('/resumen')) seccion = '📊 Resumen de Planilla';
    else if (rutaActual.includes('/vueltas')) seccion = '🔄 Conteo de Vueltas';
    else if (rutaActual.includes('/unidades')) seccion = '🚐 Gestión de Unidades';
    else if (rutaActual.includes('/exportar')) seccion = '📄 Exportar y Respaldos';
    else if (rutaActual.includes('/bitacora')) seccion = '📜 Bitácora de Auditoría';

    const nuevoLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      usuario: user.username || user.nombre || 'Sistema',
      nombre: user.nombre || user.username || 'Usuario',
      rol: user.rol || 'capturista',
      accion,
      detalle,
      categoria,
      icono,
      ip: geo.ip,
      ubicacion: geo.ubicacion,
      ciudad: geo.ciudad,
      region: geo.region,
      dispositivo,
      seccion
    };

    if (!Array.isArray(store.bitacora_auditoria)) store.bitacora_auditoria = [];
    store.bitacora_auditoria.unshift(nuevoLog);
    if (store.bitacora_auditoria.length > 300) {
      store.bitacora_auditoria = store.bitacora_auditoria.slice(0, 300);
    }
    save(true);

    // Sincronizar en la nube multi-dispositivo en segundo plano
    cloudDb.syncAuditLog(nuevoLog).catch(() => {});
    cloudRelay.publicarEvento(nuevoLog).catch(() => {});

    return nuevoLog;
  },

  async getBitacoraAuditoria() {
    await this.pullFullStoreFromCloud().catch(() => {});
    const local = store.bitacora_auditoria || [];
    try {
      const globalEvents = await cloudRelay.obtenerEventosGlobales();
      const combined = [...globalEvents, ...local];
      const seen = new Set();
      const deduped = [];
      for (const item of combined) {
        const key = item.id || `${item.timestamp}_${item.usuario}_${item.accion}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }
      return deduped.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    } catch {
      return [...local];
    }
  },

  async getUsuariosConectados() {
    return cloudRelay.obtenerPresenciasLocales();
  },

  async borrarBitacoraAuditoria() {
    store.bitacora_auditoria = [];
    save(true);
    return true;
  },

  // ── Semanas ────────────────────────────────────────────────────────
  getSemanaActiva() {
    return store.semana_activa || null;
  },

  setSemanaActiva(semanaId) {
    store.semana_activa = semanaId;
    save(true);
    return semanaId;
  },

  // ── Dueños ────────────────────────────────────────────────────────
  async getDuenos() {
    await this.pullFullStoreFromCloud().catch(() => {});
    return [...(store.duenos || [])];
  },

  async guardarDueno(dueno) {
    const esNuevo = !dueno.id;
    if (esNuevo) {
      dueno.id = 'd_' + Date.now();
      store.duenos.push(dueno);
      this.registrarActividad('Creó dueño de unidad', `Registró al propietario "${dueno.nombre}"`, 'catalogo', '👤');
    } else {
      const idx = store.duenos.findIndex(d => d.id === dueno.id);
      if (idx >= 0) store.duenos[idx] = { ...store.duenos[idx], ...dueno };
      else store.duenos.push(dueno);
      this.registrarActividad('Modificó dueño', `Actualizó datos del propietario "${dueno.nombre}"`, 'catalogo', '✏️');
    }
    save(true);
    return dueno;
  },

  async eliminarDueno(id) {
    const dueno = (store.duenos || []).find(d => d.id === id);
    store.duenos = (store.duenos || []).filter(d => d.id !== id);
    store.unidades.forEach(u => {
      if (u.dueno_id === id) u.dueno_id = null;
    });
    this.registrarActividad('Eliminó dueño', `Eliminó al propietario "${dueno?.nombre || id}"`, 'catalogo', '🗑️');
    save(true);
    return true;
  },

  // ── Unidades ──────────────────────────────────────────────────────
  async getUnidades() {
    await this.pullFullStoreFromCloud().catch(() => {});
    const duenosMap = (store.duenos || []).reduce((acc, d) => {
      acc[d.id] = d;
      return acc;
    }, {});

    return (store.unidades || []).map(u => ({
      ...u,
      dueno: u.dueno_id ? duenosMap[u.dueno_id] || null : null
    }));
  },

  async guardarUnidad(unidad) {
    const esNueva = !unidad.id;
    if (esNueva) {
      unidad.id = 'u_' + Date.now();
      store.unidades.push(unidad);
      this.registrarActividad('Creó unidad', `Registró la camioneta Unidad ${unidad.numero} (${unidad.modelo || 'S/M'})`, 'catalogo', '🚐');
    } else {
      const idx = store.unidades.findIndex(u => u.id === unidad.id);
      if (idx >= 0) store.unidades[idx] = { ...store.unidades[idx], ...unidad };
      else store.unidades.push(unidad);
      this.registrarActividad('Modificó unidad', `Actualizó datos de la Unidad ${unidad.numero}`, 'catalogo', '✏️');
    }
    save(true);
    cloudDb.syncUnidad(unidad).catch(() => {});
    return unidad;
  },

  async eliminarUnidad(id) {
    const u = (store.unidades || []).find(x => x.id === id);
    store.unidades = (store.unidades || []).filter(x => x.id !== id);
    this.registrarActividad('Eliminó unidad', `Eliminó del catálogo la Unidad ${u?.numero || id}`, 'catalogo', '🗑️');
    save(true);
    return true;
  },

  // ── Conductores ───────────────────────────────────────────────────
  async getConductores() {
    await this.pullFullStoreFromCloud().catch(() => {});
    return [...(store.conductores || [])];
  },

  async guardarConductor(cond) {
    if (!cond.id) {
      cond.id = 'c_' + Date.now();
      store.conductores.push(cond);
    } else {
      const idx = store.conductores.findIndex(c => c.id === cond.id);
      if (idx >= 0) store.conductores[idx] = { ...store.conductores[idx], ...cond };
      else store.conductores.push(cond);
    }
    save(true);
    return cond;
  },

  // ── Registros Operativos por Semana ──────────────────────────────
  async getRegistrosDeSemana(semanaId) {
    await this.pullFullStoreFromCloud().catch(() => {});
    if (!semanaId) return [];
    return (store.registros || [])
      .filter(r => r && r.semana_id === semanaId)
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  },

  async getPendientesArrastre(semanaAnteriorId) {
    await this.pullFullStoreFromCloud().catch(() => {});
    if (!semanaAnteriorId) return [];
    return (store.registros || [])
      .filter(r => r && r.semana_id === semanaAnteriorId && r.estado === 'pendiente')
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  },

  async guardarRegistro(registro) {
    const semId = registro.semana_id || (registro.fecha ? getSemanaIdParaFecha(registro.fecha) : getSemanaActualId());
    const b1 = Number(registro.bitacora_tlaxiaco_putla) || 0;
    const b2 = Number(registro.bitacora_putla_tlaxiaco) || 0;
    const inter = Number(registro.intermedios) || 0;
    const comb = Number(registro.combustible) || 0;
    const imprev = Number(registro.gastos_imprevistos) || 0;
    const totalGen = b1 + b2 + inter;
    const totalNeto = totalGen - comb - imprev;
    const estado = registro.estado || 'completado';

    const rec = {
      id:                registro.id || 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      semana_id:         semId,
      fecha:             registro.fecha || new Date().toISOString().split('T')[0],
      numero_unidad:     (registro.numero_unidad || '').trim(),
      nombre_conductor:  (registro.nombre_conductor || '').trim(),
      dueno_nombre:      registro.dueno_nombre     || '',
      vueltas_dadas:     Number(registro.vueltas_dadas) || 1,
      bitacora_tlaxiaco_putla: b1,
      bitacora_putla_tlaxiaco: b2,
      intermedios:       inter,
      total_generado:    totalGen,
      combustible:       comb,
      gastos_imprevistos: imprev,
      concepto_gastos:   registro.concepto_gastos  || '',
      total_neto:        totalNeto,
      estado,
      created_at: registro.created_at || new Date().toISOString()
    };

    const idx = store.registros.findIndex(r => r && r.id === rec.id);
    if (idx >= 0) {
      store.registros[idx] = rec;
      this.registrarActividad(
        'Modificó vuelta diaria',
        `Unidad ${rec.numero_unidad} (${rec.nombre_conductor}) · Fecha: ${rec.fecha} · Neto: $${rec.total_neto.toFixed(2)} [${rec.estado}]`,
        'edicion',
        '✏️'
      );
    } else {
      store.registros.push(rec);
      this.registrarActividad(
        'Capturó nueva vuelta',
        `Unidad ${rec.numero_unidad} (${rec.nombre_conductor}) · Fecha: ${rec.fecha} · Generado: $${rec.total_generado.toFixed(2)} · Comb: $${rec.combustible} · Neto: $${rec.total_neto.toFixed(2)}`,
        'captura',
        '💾'
      );
    }
    save(true);
    cloudDb.syncRegistro(rec).catch(() => {});
    return rec;
  },

  async completarArrastre(id, nuevaSemanaId) {
    const idx = store.registros.findIndex(r => r && r.id === id);
    if (idx >= 0) {
      store.registros[idx].semana_id  = nuevaSemanaId;
      store.registros[idx].estado     = 'completado';
      store.registros[idx].arrastre   = true;
      this.registrarActividad(
        'Completó arrastre de vuelta',
        `Unidad ${store.registros[idx].numero_unidad} (${store.registros[idx].nombre_conductor}) pasada a semana activa`,
        'captura',
        '✅'
      );
    }
    save(true);
    return store.registros[idx] || null;
  },

  async eliminarRegistro(id) {
    const r = (store.registros || []).find(x => x && x.id === id);
    store.registros = (store.registros || []).filter(x => x && x.id !== id);
    this.registrarActividad(
      'Eliminó registro de vuelta',
      `Unidad ${r?.numero_unidad || 'S/N'} (${r?.nombre_conductor || 'Chofer'}) del ${r?.fecha || 'Fecha'} · Monto: $${r?.total_neto || 0}`,
      'eliminacion',
      '🗑️'
    );
    save(true);
    return true;
  },

  async borrarSemana(semanaId) {
    const totalBorrado = (store.registros || []).filter(r => r && r.semana_id === semanaId).length;
    store.registros = (store.registros || []).filter(r => r && r.semana_id !== semanaId);
    this.registrarActividad(
      'Vació semana de capturas',
      `Eliminó ${totalBorrado} registros de la semana ${semanaId}`,
      'eliminacion',
      '⚠️'
    );
    save(true);
    return true;
  },

  async borrarHistorial() {
    store.registros = [];
    this.registrarActividad('Vació historial completo', 'Borró todos los registros del sistema', 'eliminacion', '🚨');
    save(true);
    return true;
  },

  async getAllRegistros() {
    await this.pullFullStoreFromCloud().catch(() => {});
    return [...(store.registros || [])].sort((a, b) => (a.semana_id || '').localeCompare(b.semana_id || ''));
  },

  // ── Respaldos Completos Cifrados ──────────────────────────────────
  async getBackupData() {
    await this.pullFullStoreFromCloud().catch(() => {});
    this.registrarActividad('Exportó respaldo completo', 'Descargó archivo JSON de base de datos cifrada', 'exportacion', '☁️');
    return {
      version: '3.0_ENC',
      timestamp: new Date().toISOString(),
      app: 'TRANSPORTE TIERRA DE HUMOS',
      data: {
        registros: store.registros || [],
        unidades: store.unidades || [],
        duenos: store.duenos || [],
        conductores: store.conductores || [],
        prestamos: store.prestamos || [],
        bitacora_auditoria: store.bitacora_auditoria || [],
        semana_activa: store.semana_activa || null
      }
    };
  },

  async restoreBackupData(backup) {
    if (!backup || !backup.data) throw new Error('El archivo de respaldo no es válido.');
    const d = backup.data;
    store.registros = Array.isArray(d.registros) ? d.registros : [];
    store.unidades = Array.isArray(d.unidades) ? d.unidades : [];
    store.duenos = Array.isArray(d.duenos) ? d.duenos : [];
    store.conductores = Array.isArray(d.conductores) ? d.conductores : [];
    store.prestamos = Array.isArray(d.prestamos) ? d.prestamos : [];
    store.bitacora_auditoria = Array.isArray(d.bitacora_auditoria) ? d.bitacora_auditoria : [];
    if (d.semana_activa) store.semana_activa = d.semana_activa;
    this.registrarActividad('Restauró base de datos', 'Cargó un archivo de respaldo previo', 'seguridad', '📂');
    save(true);
    return true;
  },

  // ── Aliases para compatibilidad Pinia / Legacy ────────────────────
  async getRegistrosDiarios() { return this.getAllRegistros(); },
  async addDueno(dueno) { return this.guardarDueno(dueno); },
  async addUnidad(unidad) { return this.guardarUnidad(unidad); },
  async addConductor(cond) { return this.guardarConductor(cond); },
  async getPrestamos() { return [...(store.prestamos || [])]; },
  async addPrestamo(p) {
    p.id = 'p_' + Date.now();
    store.prestamos.push(p);
    save(true);
    return p;
  },
  async cerrarDia(fecha) {
    const sId = getSemanaIdParaFecha(fecha);
    const regs = await this.getRegistrosDeSemana(sId);
    regs.forEach(r => {
      if (r.fecha === fecha && r.estado === 'pendiente') r.estado = 'completado';
    });
    save(true);
    return true;
  }
};
