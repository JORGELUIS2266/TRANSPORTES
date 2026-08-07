<template>
  <div class="bitacora-container">

    <div class="card">
      <div class="card-header-box">
        <div>
          <h2 style="color:var(--accent-red); font-size:1.3rem;">📜 Bitácora de Auditoría en Tiempo Real</h2>
          <p style="font-size:0.85rem; color:var(--text-muted);">
            Monitorea quién ingresó al sistema, a qué hora, desde qué dirección IP, dispositivo y qué movimientos o cambios realizó.
          </p>
        </div>

        <div style="display:flex; gap:0.6rem; flex-wrap:wrap; align-items:center;">
          <!-- Indicador En Vivo -->
          <span class="live-indicator">
            <span class="live-dot"></span> EN VIVO
          </span>

          <!-- Botón de Actualizar con Animación de Giro -->
          <button
            @click="cargar(true)"
            class="btn btn-secondary btn-sm btn-refresh"
            :class="{ 'is-spinning': cargando }"
            :disabled="cargando"
            title="Refrescar lista ahora"
          >
            <span class="refresh-icon">🔄</span>
            <span>{{ cargando ? 'Consultando...' : 'Actualizar' }}</span>
          </button>

          <!-- Botón Vaciar Bitácora -->
          <button v-if="auth.isAdmin && logs.length > 0" @click="limpiarBitacora" class="btn btn-delete btn-sm">
            🗑️ Vaciar Historial
          </button>
        </div>
      </div>

      <!-- Alerta de Notificación de Actualización (Toast) -->
      <transition name="fade">
        <div v-if="toastMsg" class="toast-refresh-banner" :class="toastTipo">
          <span class="toast-icon">{{ toastTipo === 'toast-info' ? 'ℹ️' : '✅' }}</span>
          <span>{{ toastMsg }}</span>
          <span class="toast-timestamp">· {{ ultimaHoraSincronizada }}</span>
        </div>
      </transition>

      <!-- Tarjetas de Métricas de Actividad -->
      <div class="audit-metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">📝</div>
          <div class="metric-info">
            <span class="metric-label">Total de Acciones</span>
            <strong class="metric-val blue">{{ logs.length }}</strong>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">🔑</div>
          <div class="metric-info">
            <span class="metric-label">Inicios de Sesión</span>
            <strong class="metric-val purple">{{ totalLogins }}</strong>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">💾</div>
          <div class="metric-info">
            <span class="metric-label">Vueltas Capturadas</span>
            <strong class="metric-val green">{{ totalCapturas }}</strong>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">✏️</div>
          <div class="metric-info">
            <span class="metric-label">Modificaciones</span>
            <strong class="metric-val orange">{{ totalEdiciones }}</strong>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="audit-filters-card">
        <div class="filter-group">
          <label class="filter-label">🔍 Buscar (Usuario, IP, Unidad, Detalle):</label>
          <input
            type="text"
            v-model="filtroTexto"
            placeholder="Ej. 192.168, Unidad 13, admin, operador..."
            class="form-input filter-input"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">👤 Filtrar por Usuario:</label>
          <select v-model="filtroUsuario" class="form-input filter-select">
            <option value="">— Todos los usuarios —</option>
            <option v-for="u in listaUsuariosUnicos" :key="u" :value="u">{{ u }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">🏷️ Categoría:</label>
          <select v-model="filtroCategoria" class="form-input filter-select">
            <option value="">— Todas las categorías —</option>
            <option value="seguridad">🔑 Seguridad e Inicios de Sesión</option>
            <option value="captura">💾 Captura de Vueltas</option>
            <option value="edicion">✏️ Edición / Modificación</option>
            <option value="eliminacion">🗑️ Eliminación</option>
            <option value="catalogo">🚐 Catálogo de Unidades</option>
            <option value="exportacion">☁️ Exportación y Respaldos</option>
          </select>
        </div>
      </div>

      <!-- Estado Vacío o Tabla de Eventos -->
      <div v-if="logsFiltrados.length === 0" class="empty-state text-center">
        No se encontraron registros de auditoría con los filtros seleccionados.
      </div>

      <div v-else class="table-responsive" style="margin-top:1.25rem;">
        <table class="table table-audit">
          <thead>
            <tr>
              <th style="width:170px;">Fecha y Hora</th>
              <th style="width:160px;">Usuario y Rol</th>
              <th style="width:180px;">Acción</th>
              <th style="width:170px;">Sección</th>
              <th style="width:200px;">Dirección IP y Dispositivo</th>
              <th>Detalle del Movimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logsFiltrados" :key="log.id" :class="getFilaClass(log.categoria)">
              <!-- Fecha y hora -->
              <td class="log-time-cell">
                <span class="log-time-date">{{ formatFechaLog(log.timestamp) }}</span>
                <span class="log-time-hour">{{ formatHoraLog(log.timestamp) }}</span>
              </td>

              <!-- Usuario y Rol -->
              <td>
                <div class="log-user-box">
                  <span class="log-username">👤 {{ log.usuario }}</span>
                  <span class="badge badge-sm" :class="getBadgeRolClass(log.rol)">
                    {{ getRolLabel(log.rol) }}
                  </span>
                </div>
              </td>

              <!-- Acción -->
              <td>
                <span class="log-action-badge" :class="'cat-' + log.categoria">
                  {{ log.icono || '📝' }} {{ log.accion }}
                </span>
              </td>

              <!-- Sección -->
              <td style="font-size:0.78rem; font-weight:700; color:#475569;">
                {{ log.seccion || '📱 Sistema' }}
              </td>

              <!-- IP y Dispositivo -->
              <td>
                <div class="ip-device-box">
                  <span class="ip-tag">🌐 {{ log.ip || '127.0.0.1' }}</span>
                  <span class="device-tag">💻 {{ log.dispositivo || 'Navegador Web' }}</span>
                </div>
              </td>

              <!-- Detalle -->
              <td class="log-detail-cell">
                <strong>{{ log.detalle }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const logs = ref([]);
const cargando = ref(false);
const toastMsg = ref('');
const toastTipo = ref('toast-success');
const ultimaHoraSincronizada = ref('');

const filtroTexto     = ref('');
const filtroUsuario   = ref('');
const filtroCategoria = ref('');
let intervalId = null;
let toastTimeout = null;

async function cargar(esManual = false) {
  if (esManual) cargando.value = true;
  try {
    const conteoAnterior = logs.value.length;
    const datos = await api.getBitacoraAuditoria();
    logs.value = Array.isArray(datos) ? datos : [];

    const ahora = new Date();
    ultimaHoraSincronizada.value = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    if (esManual) {
      const nuevos = logs.value.length - conteoAnterior;
      if (nuevos > 0) {
        mostrarToast(`Se sincronizaron ${nuevos} nuevo(s) evento(s). Total: ${logs.value.length}`, 'toast-info');
      } else {
        mostrarToast(`Bitácora al día: No hay nuevos cambios (${logs.value.length} eventos)`, 'toast-success');
      }
    }
  } catch (e) {
    console.error('[Bitácora] Error cargando logs:', e);
    if (esManual) mostrarToast('Error al consultar bitácora: ' + e.message, 'toast-error');
  } finally {
    if (esManual) {
      setTimeout(() => { cargando.value = false; }, 350);
    }
  }
}

function mostrarToast(mensaje, tipo = 'toast-success') {
  toastMsg.value = mensaje;
  toastTipo.value = tipo;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMsg.value = '';
  }, 4000);
}

// ── Métricas ──────────────────────────────────────────────────────────────────
const totalCapturas = computed(() => logs.value.filter(l => l.categoria === 'captura').length);
const totalEdiciones = computed(() => logs.value.filter(l => l.categoria === 'edicion').length);
const totalLogins   = computed(() => logs.value.filter(l => l.categoria === 'seguridad').length);

const listaUsuariosUnicos = computed(() => {
  const set = new Set(logs.value.map(l => l.usuario).filter(Boolean));
  return Array.from(set);
});

// ── Filtrado Reactivo ─────────────────────────────────────────────────────────
const logsFiltrados = computed(() => {
  return logs.value.filter(log => {
    if (filtroUsuario.value && log.usuario !== filtroUsuario.value) return false;
    if (filtroCategoria.value && log.categoria !== filtroCategoria.value) return false;
    if (filtroTexto.value) {
      const q = filtroTexto.value.toLowerCase().trim();
      const matchDetalle = (log.detalle || '').toLowerCase().includes(q);
      const matchAccion  = (log.accion || '').toLowerCase().includes(q);
      const matchUser    = (log.usuario || '').toLowerCase().includes(q);
      const matchIp      = (log.ip || '').toLowerCase().includes(q);
      const matchDisp    = (log.dispositivo || '').toLowerCase().includes(q);
      const matchSec     = (log.seccion || '').toLowerCase().includes(q);
      if (!matchDetalle && !matchAccion && !matchUser && !matchIp && !matchDisp && !matchSec) return false;
    }
    return true;
  });
});

// ── Formatos ──────────────────────────────────────────────────────────────────
function formatFechaLog(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatHoraLog(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function getRolLabel(rol) {
  if (rol === 'admin') return 'ADMIN';
  if (rol === 'capturista') return 'CAPTURISTA';
  return 'LECTOR';
}

function getBadgeRolClass(rol) {
  if (rol === 'admin') return 'badge-danger';
  if (rol === 'capturista') return 'badge-info';
  return 'badge-success';
}

function getFilaClass(cat) {
  if (cat === 'eliminacion') return 'fila-eliminacion';
  if (cat === 'edicion') return 'fila-edicion';
  return '';
}

async function limpiarBitacora() {
  if (!confirm('⚠️ ¿Estás seguro de vaciar la bitácora de auditoría?\nEsta acción borrará el registro de movimientos históricos.')) return;
  await api.borrarBitacoraAuditoria();
  await cargar(true);
}

onMounted(() => {
  cargar();
  // Auto-refresco periódico cada 3 segundos
  intervalId = setInterval(() => cargar(false), 3000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  if (toastTimeout) clearTimeout(toastTimeout);
});
</script>

<style scoped>
.bitacora-container {
  max-width: 1750px;
  margin: 0 auto;
}

/* ── Live Indicator y Botón Actualizar ─────────────── */
.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  letter-spacing: 0.05em;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 800;
  transition: all 0.15s;
}

.btn-refresh:hover {
  background: #e2e8f0;
}

.refresh-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.is-spinning .refresh-icon {
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Toast de Actualización ────────────────────────── */
.toast-refresh-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0.75rem 0 0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.toast-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #86efac;
}

.toast-info {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.toast-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.toast-timestamp {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Métricas ──────────────────────────────────────── */
.audit-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1.25rem 0;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.metric-icon { font-size: 2.2rem; }
.metric-info { display: flex; flex-direction: column; }
.metric-label { font-size: 0.74rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
.metric-val { font-size: 1.5rem; font-weight: 900; }
.metric-val.blue   { color: #0284c7; }
.metric-val.green  { color: #059669; }
.metric-val.orange { color: #d97706; }
.metric-val.purple { color: #7c3aed; }

/* ── Filtros ───────────────────────────────────────── */
.audit-filters-card {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-top: 1rem;
}

.filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
.filter-label { font-size: 0.74rem; font-weight: 800; color: #475569; text-transform: uppercase; }
.filter-input, .filter-select { font-size: 0.85rem; padding: 0.5rem 0.75rem; border-radius: 6px; }

/* ── Tabla de Auditoría ────────────────────────────── */
.table-audit th {
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 800;
  font-size: 0.76rem;
  text-transform: uppercase;
}

.log-time-cell {
  display: flex;
  flex-direction: column;
  font-size: 0.78rem;
}

.log-time-date { font-weight: 800; color: #0f172a; }
.log-time-hour { color: #64748b; font-size: 0.72rem; }

.log-user-box { display: flex; flex-direction: column; gap: 0.2rem; }
.log-username { font-weight: 800; font-size: 0.82rem; color: #0f172a; }

.log-action-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  white-space: nowrap;
}

.cat-captura     { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.cat-edicion     { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.cat-eliminacion { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.cat-seguridad   { background: #f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe; }
.cat-catalogo    { background: #f0f9ff; color: #075985; border: 1px solid #bae6fd; }
.cat-exportacion { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

.ip-device-box {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.75rem;
}

.ip-tag {
  font-family: monospace;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.device-tag {
  color: #64748b;
  font-size: 0.72rem;
}

.log-detail-cell { font-size: 0.84rem; color: #1e293b; }

.fila-eliminacion { background: #fff5f5 !important; }
.fila-edicion     { background: #fffdf5 !important; }

.badge-danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.badge-info    { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
.badge-success { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
.badge-sm      { font-size: 0.65rem; padding: 0.1rem 0.35rem; }

@media (max-width: 900px) {
  .audit-filters-card { grid-template-columns: 1fr; }
}
</style>
