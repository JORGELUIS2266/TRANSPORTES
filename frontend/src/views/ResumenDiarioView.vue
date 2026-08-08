<template>
  <div class="resumen-container">

    <!-- Modal de Edición -->
    <div v-if="editando" class="modal-overlay" @click.self="cancelarEdicion">
      <div class="modal-box">
        <div class="modal-header">
          <h3>✏️ Editar Registro</h3>
          <button @click="cancelarEdicion" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Unidad</label>
              <input type="text" v-model="formEdit.numero_unidad" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Conductor</label>
              <input type="text" v-model="formEdit.nombre_conductor" class="form-input" />
            </div>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Bitácora 1 ($)</label>
              <input type="number" v-model.number="formEdit.bitacora_tlaxiaco_putla" class="form-input" min="0" step="10" />
            </div>
            <div class="form-group">
              <label class="form-label">Bitácora 2 ($)</label>
              <input type="number" v-model.number="formEdit.bitacora_putla_tlaxiaco" class="form-input" min="0" step="10" />
            </div>
            <div class="form-group">
              <label class="form-label">Intermedio ($)</label>
              <input type="number" v-model.number="formEdit.intermedios" class="form-input" min="0" step="10" />
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Combustible ($)</label>
              <input type="number" v-model.number="formEdit.combustible" class="form-input" min="0" step="50" />
            </div>
            <div class="form-group">
              <label class="form-label">Imprevistos ($)</label>
              <input type="number" v-model.number="formEdit.gastos_imprevistos" class="form-input" min="0" step="10" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select v-model="formEdit.estado" class="form-input">
              <option value="completado">✅ Completado</option>
              <option value="pendiente">⏳ Pendiente</option>
            </select>
          </div>
          <div class="preview-total">
            <span>Generado: <strong>${{ editTotalGen.toFixed(2) }}</strong></span>
            <span :class="editTotalNeto < 0 ? 'preview-neg' : 'preview-pos'">
              Neto: <strong>${{ editTotalNeto.toFixed(2) }}</strong>
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cancelarEdicion"  class="btn btn-secondary">Cancelar</button>
          <button @click="guardarEdicion"   class="btn btn-red">💾 Guardar Cambios</button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         BANNER OFICIAL Y SELECTOR DE SEMANA
    ══════════════════════════════════════ -->
    <div class="brand-hero-card">
      <img src="/logo_tierra_de_humo.jpg" alt="Logo TH" class="hero-logo-img" />
      <div class="hero-text-box">
        <h2 class="hero-company-title">TRANSPORTE TIERRA DE HUMO</h2>
        <span class="hero-company-corp">S.C. DE R.L. DE C.V.</span>
        <div class="hero-route-tag">
          <span>PASAJE · PAQUETERÍA · TURISMO</span>
          <strong class="route-pill">Ruta Oficial: Tlaxiaco ⇄ Putla</strong>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header-box">
        <div>
          <h2 style="color:var(--accent-red); font-size:1.2rem;">📊 Resumen de Planilla Semanal</h2>
          <p style="font-size:0.83rem; color:var(--text-muted);">
            Planilla completa con totales diarios y globales de la semana. Edita o elimina registros.
          </p>
        </div>
        <div class="header-actions">
          <button @click="irSemanaAnterior" class="btn-nav-week-sm">◀</button>
          <select v-model="semanaId" @change="onCambioSemana" class="semana-select-mini">
            <option v-for="s in (semanasDisponibles || [])" :key="s?.id || Math.random()" :value="s?.id || ''">
              {{ s?.label }}
            </option>
          </select>
          <button @click="irSemanaSiguiente" class="btn-nav-week-sm">▶</button>
          <button v-if="auth.puedeDescargarReportes" @click="exportarPDFClick"   class="btn btn-red btn-sm">📄 PDF</button>
          <button v-if="auth.puedeDescargarReportes" @click="exportarExcelClick" class="btn btn-success btn-sm">📊 Excel</button>
          <span v-else class="badge" style="background:#f1f5f9; color:#64748b; font-size:0.75rem;">🔒 Solo consulta</span>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           BANNER DE VUELTAS PENDIENTES (ARRASTRE DE SEMANA ANTERIOR)
      ══════════════════════════════════════ -->
      <div v-if="pendientesArrastre.length > 0" class="arrastre-banner">
        <div class="arrastre-header">
          <span class="arrastre-icon">⚠️</span>
          <div>
            <strong class="arrastre-title">
              Tienes {{ pendientesArrastre.length }} vuelta(s) PENDIENTE(s) arrastrada(s) de la semana anterior
            </strong>
            <p class="arrastre-desc">
              Estas vueltas no se contabilizaron en el corte pasado. Al completarlas aquí, su dinero entrará al corte de <strong>la semana que estás viendo ahora</strong>.
            </p>
          </div>
        </div>
        <div class="arrastre-list">
          <div v-for="r in pendientesArrastre" :key="r.id" class="arrastre-item">
            <div class="arrastre-item-info">
              <strong>🚐 Unidad {{ r.numero_unidad }}</strong>
              <span class="arrastre-chofer">{{ r.nombre_conductor }}</span>
              <span class="arrastre-fecha">Fecha original: {{ formatFechaLarga(r.fecha) }}</span>
              <span class="arrastre-montos">
                Ingreso: <strong>${{ Number(r.total_generado || 0).toFixed(2) }}</strong> ·
                Comb: <strong>${{ Number(r.combustible || 0).toFixed(2) }}</strong> ·
                Neto: <strong>${{ Number(r.total_neto || 0).toFixed(2) }}</strong>
              </span>
            </div>
            <button
              @click="completarArrastre(r.id)"
              class="btn btn-arrastre"
              :disabled="completandoArrastre[r.id]"
            >
              {{ completandoArrastre[r.id] ? '⏳ Procesando...' : '✅ Completar y mover a esta Semana' }}
            </button>
          </div>
        </div>
      </div>

      <!-- PANEL GLOBAL DE TOTALES DE SEMANA -->
      <div class="resumen-global-panel" v-if="registros.length > 0">
        <div class="rg-title">📈 Totales de la {{ semanaObj?.label || 'Semana Actual' }}</div>
        <div class="rg-grid">
          <div class="rg-item">
            <span class="rg-label">💰 Total Generado</span>
            <span class="rg-value green">${{ granTotalGenerado.toFixed(2) }}</span>
          </div>
          <div class="rg-item">
            <span class="rg-label">⛽ Total Combustible</span>
            <span class="rg-value orange">${{ granTotalCombustible.toFixed(2) }}</span>
          </div>
          <div class="rg-item" :class="granTotalNeto < 0 ? 'rg-negativo' : ''">
            <span class="rg-label">🏁 Total Neto (Ganancia)</span>
            <span class="rg-value" :class="granTotalNeto < 0 ? 'red' : 'green'">${{ granTotalNeto.toFixed(2) }}</span>
          </div>
          <div class="rg-item">
            <span class="rg-label">🔄 Vueltas Completadas</span>
            <span class="rg-value blue">{{ vueltasCompletadas }}</span>
          </div>
          <div class="rg-item" v-if="vueltasPendientes > 0">
            <span class="rg-label">⏳ Vueltas Pendientes</span>
            <span class="rg-value orange">{{ vueltasPendientes }}</span>
          </div>
        </div>
      </div>

      <!-- TABLAS POR DÍA -->
      <div v-for="grupo in gruposPorDia" :key="grupo?.fecha || Math.random()" class="sheet-block">
        <div class="sheet-date-row">
          <div class="sheet-date-box">
            <span class="sheet-date-label">FECHA</span>
            <span class="sheet-date-value">{{ formatFechaLarga(grupo?.fecha) }}</span>
          </div>
          <div class="sheet-day-summary">
            <span>💰 <strong>${{ Number(grupo?.sumGenerado || 0).toFixed(2) }}</strong></span>
            <span>⛽ <strong>${{ Number(grupo?.sumCombustible || 0).toFixed(2) }}</strong></span>
            <span :class="Number(grupo?.sumNeto || 0) < 0 ? 'text-danger' : 'text-success'">
              🏁 <strong>${{ Number(grupo?.sumNeto || 0).toFixed(2) }}</strong>
            </span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sheet">
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th>UNIDAD / CONDUCTOR</th>
                <th class="text-right">BIT. 1</th>
                <th class="text-right">BIT. 2</th>
                <th class="text-right">INTER.</th>
                <th class="text-right">TOTAL GEN.</th>
                <th class="text-right">COMBUSTIBLE</th>
                <th class="text-right">TOTAL NETO</th>
                <th>ESTADO</th>
                <th v-if="auth.puedeEditar || auth.puedeEliminar">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in (grupo?.registros || [])" :key="r?.id || Math.random()"
                  :class="r?.estado === 'pendiente' ? 'fila-pendiente' : ''">
                <td class="row-num">{{ idx + 1 }}</td>
                <td>
                  <strong>{{ r?.numero_unidad }} – {{ r?.nombre_conductor }}</strong>
                  <span v-if="r?.arrastre" class="chip-orange-sm">ARRASTRE</span>
                </td>
                <td class="text-right">${{ Number(r?.bitacora_tlaxiaco_putla || 0).toFixed(2) }}</td>
                <td class="text-right">${{ Number(r?.bitacora_putla_tlaxiaco || 0).toFixed(2) }}</td>
                <td class="text-right">${{ Number(r?.intermedios || 0).toFixed(2) }}</td>
                <td class="text-right text-bold">${{ Number(r?.total_generado || 0).toFixed(2) }}</td>
                <td class="text-right" style="color:#d97706;">${{ Number(r?.combustible || 0).toFixed(2) }}</td>
                <td class="text-right" :class="Number(r?.total_neto || 0) < 0 ? 'cell-negative' : 'cell-positive'">
                  ${{ Number(r?.total_neto || 0).toFixed(2) }}
                </td>
                <td>
                  <span class="badge" :class="r?.estado === 'pendiente' ? 'badge-warning' : 'badge-success'">
                    {{ r?.estado === 'pendiente' ? '⏳ PENDIENTE' : '✅ LISTO' }}
                  </span>
                </td>
                <td v-if="auth.puedeEditar || auth.puedeEliminar">
                  <div class="action-cell">
                    <button v-if="auth.puedeEditar" @click="abrirEdicion(r)" class="btn btn-sm btn-edit">✏️</button>
                    <button v-if="auth.puedeEliminar" @click="eliminar(r?.id)" class="btn btn-sm btn-delete">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="subtotal-row">
                <td colspan="2" class="subtotal-label">SUMA TOTAL DÍA</td>
                <td class="text-right subtotal-val">${{ Number(grupo?.sumB1 || 0).toFixed(2) }}</td>
                <td class="text-right subtotal-val">${{ Number(grupo?.sumB2 || 0).toFixed(2) }}</td>
                <td class="text-right subtotal-val">${{ Number(grupo?.sumInter || 0).toFixed(2) }}</td>
                <td class="text-right subtotal-val">${{ Number(grupo?.sumGenerado || 0).toFixed(2) }}</td>
                <td class="text-right subtotal-val" style="color:#d97706;">${{ Number(grupo?.sumCombustible || 0).toFixed(2) }}</td>
                <td class="text-right subtotal-val" :class="Number(grupo?.sumNeto || 0) < 0 ? 'cell-negative' : 'cell-positive'">
                  ${{ Number(grupo?.sumNeto || 0).toFixed(2) }}
                </td>
                <td :colspan="auth.puedeEditar || auth.puedeEliminar ? 2 : 1">–</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div v-if="registros.length === 0" class="text-center empty-state">
        No hay registros en la <strong>{{ semanaObj?.label || 'Semana Seleccionada' }}</strong>.
        Cambia de semana en el selector o ve a Captura Diaria para agregar registros.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { exportarPDF }   from '../utils/pdfExport';
import { exportarExcel } from '../utils/excelExport';
import {
  getSemanasSelectRecentFirst,
  getSemanaActualId,
  getSemanaAnteriorId,
  getSemanaSiguienteId,
  formatFechaLarga
} from '../utils/semanas';

const auth = useAuthStore();

const semanasDisponibles = ref(getSemanasSelectRecentFirst() || []);
const semanaId = ref(api.getSemanaActiva() || getSemanaActualId());
const semanaObj = computed(() => (semanasDisponibles.value || []).find(s => s && s.id === semanaId.value) || semanasDisponibles.value[0] || null);

const registros          = ref([]);
const pendientesArrastre = ref([]);
const completandoArrastre = ref({});
const editando  = ref(false);
const formEdit  = ref({});

async function cargar() {
  try {
    registros.value = await api.getRegistrosDeSemana(semanaId.value);
    // Cargar pendientes de la semana ANTERIOR para mostrar el banner de arrastre
    const semAntId = getSemanaAnteriorId(semanaId.value);
    if (semAntId) {
      pendientesArrastre.value = await api.getPendientesArrastre(semAntId).catch(() => []);
    } else {
      pendientesArrastre.value = [];
    }
  } catch (e) {
    console.error('[Resumen] Error cargando:', e);
    registros.value = [];
    pendientesArrastre.value = [];
  }
}

async function completarArrastre(id) {
  if (!confirm('¿Completar esta vuelta pendiente y moverla a la semana actual?\n\nSu ingreso, combustible y ganancia entrarán en el corte de esta semana.')) return;
  completandoArrastre.value[id] = true;
  try {
    await api.completarArrastre(id, semanaId.value);
    await cargar();
  } catch (e) {
    alert('Error al completar el arrastre: ' + e.message);
  } finally {
    completandoArrastre.value[id] = false;
  }
}

function onCambioSemana() {
  api.setSemanaActiva(semanaId.value);
  cargar();
}

function irSemanaAnterior() {
  const antId = getSemanaAnteriorId(semanaId.value);
  if (antId) {
    semanaId.value = antId;
    onCambioSemana();
  }
}

function irSemanaSiguiente() {
  const sigId = getSemanaSiguienteId(semanaId.value);
  if (sigId) {
    semanaId.value = sigId;
    onCambioSemana();
  }
}

const gruposPorDia = computed(() => {
  const mapa = {};
  (registros.value || []).forEach(r => {
    if (!r || !r.fecha) return;
    if (!mapa[r.fecha]) {
      mapa[r.fecha] = { fecha: r.fecha, registros: [], sumB1: 0, sumB2: 0, sumInter: 0, sumGenerado: 0, sumCombustible: 0, sumNeto: 0 };
    }
    mapa[r.fecha].registros.push(r);
    if (r.estado === 'completado') {
      mapa[r.fecha].sumB1          += (Number(r.bitacora_tlaxiaco_putla) || 0);
      mapa[r.fecha].sumB2          += (Number(r.bitacora_putla_tlaxiaco) || 0);
      mapa[r.fecha].sumInter       += (Number(r.intermedios)             || 0);
      mapa[r.fecha].sumGenerado    += (Number(r.total_generado)          || 0);
      mapa[r.fecha].sumCombustible += (Number(r.combustible)             || 0);
      mapa[r.fecha].sumNeto        += (Number(r.total_neto)              || 0);
    }
  });
  return Object.values(mapa).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
});

const completados       = computed(() => registros.value.filter(r => r.estado === 'completado'));
const granTotalGenerado    = computed(() => completados.value.reduce((s, r) => s + (Number(r.total_generado) || 0), 0));
const granTotalCombustible = computed(() => completados.value.reduce((s, r) => s + (Number(r.combustible)    || 0), 0));
const granTotalNeto        = computed(() => completados.value.reduce((s, r) => s + (Number(r.total_neto)     || 0), 0));
const vueltasCompletadas   = computed(() => completados.value.length);
const vueltasPendientes    = computed(() => registros.value.filter(r => r.estado === 'pendiente').length);

// Cálculos en tiempo real del form de edición
const editTotalGen  = computed(() => {
  const b1 = Number(formEdit.value.bitacora_tlaxiaco_putla) || 0;
  const b2 = Number(formEdit.value.bitacora_putla_tlaxiaco) || 0;
  const i  = Number(formEdit.value.intermedios)             || 0;
  return b1 + b2 + i;
});
const editTotalNeto = computed(() =>
  editTotalGen.value - (Number(formEdit.value.combustible) || 0) - (Number(formEdit.value.gastos_imprevistos) || 0)
);

function abrirEdicion(reg) {
  formEdit.value = { ...reg };
  editando.value = true;
}
function cancelarEdicion() {
  editando.value = false;
  formEdit.value = {};
}
async function guardarEdicion() {
  await api.guardarRegistro({ ...formEdit.value });
  editando.value = false;
  await cargar();
}

async function eliminar(id) {
  if (!confirm('¿Eliminar este registro? No se puede deshacer.')) return;
  await api.eliminarRegistro(id);
  await cargar();
}

function exportarPDFClick()   { exportarPDF(registros.value,   semanaObj.value); }
function exportarExcelClick() { exportarExcel(registros.value, semanaObj.value); }

import { onUnmounted } from 'vue';

let liveInterval = null;

onMounted(async () => {
  await api.pullFullStoreFromCloud().catch(() => {});
  await cargar();
  liveInterval = setInterval(async () => {
    await api.pullFullStoreFromCloud().catch(() => {});
    await cargar();
  }, 3500);
});

onUnmounted(() => {
  if (liveInterval) clearInterval(liveInterval);
});
</script>

<style scoped>
/* ── Banner de Arrastre de Pendientes ──────────────────── */
.arrastre-banner {
  background: #fffbeb;
  border: 2px solid #f59e0b;
  border-left: 6px solid #f59e0b;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.arrastre-header {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.arrastre-icon { font-size: 1.75rem; flex-shrink: 0; }

.arrastre-title {
  font-size: 1rem;
  font-weight: 900;
  color: #92400e;
}

.arrastre-desc {
  font-size: 0.8rem;
  color: #78350f;
  margin: 0.25rem 0 0;
}

.arrastre-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.arrastre-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.arrastre-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.arrastre-chofer { font-size: 0.82rem; color: #92400e; font-weight: 700; }
.arrastre-fecha  { font-size: 0.75rem; color: #a16207; }
.arrastre-montos { font-size: 0.78rem; color: #78350f; }

.btn-arrastre {
  background: #16a34a;
  color: #ffffff;
  border: none;
  font-weight: 900;
  font-size: 0.82rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-arrastre:hover    { background: #15803d; }
.btn-arrastre:disabled { background: #6b7280; cursor: not-allowed; }


.brand-hero-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: linear-gradient(135deg, #ffffff, #fff5f5);
  border: 2px solid #dc2626;
  border-radius: 14px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.08);
}
.hero-logo-img { width: 150px; height: auto; max-height: 55px; object-fit: contain; }
.hero-text-box { display: flex; flex-direction: column; }
.hero-company-title { margin: 0; font-size: 1.25rem; font-weight: 900; color: #dc2626; letter-spacing: -0.01em; }
.hero-company-corp { font-size: 0.78rem; font-weight: 800; color: #0f172a; letter-spacing: 0.06em; }
.hero-route-tag { display: flex; align-items: center; gap: 0.6rem; font-size: 0.74rem; font-weight: 700; color: #64748b; margin-top: 0.2rem; flex-wrap: wrap; }
.route-pill { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; padding: 0.1rem 0.45rem; border-radius: 6px; }

.header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.btn-nav-week-sm {
  background: #fef2f2;
  color: var(--accent-red);
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-nav-week-sm:hover { background: #fee2e2; }
.semana-select-mini {
  font-size: 0.85rem; font-weight: 700; color: var(--accent-red);
  border: 1px solid var(--border-color); border-radius: 8px;
  padding: 0.45rem 0.75rem; background: white; cursor: pointer;
}
.resumen-global-panel { background:#f8fafc; border:1px solid #cbd5e1; border-left:5px solid #dc2626; border-radius:10px; padding:1rem 1.25rem; margin-bottom:1.75rem; }
.rg-title { font-size:0.82rem; font-weight:800; text-transform:uppercase; color:#dc2626; margin-bottom:0.75rem; }
.rg-grid  { display:grid; grid-template-columns:repeat(5,1fr); gap:1rem; }
.rg-item  { display:flex; flex-direction:column; gap:0.2rem; background:white; border:1px solid #e2e8f0; border-radius:8px; padding:0.7rem 1rem; }
.rg-negativo { border-color:#fca5a5; background:#fef2f2; }
.rg-label { font-size:0.74rem; font-weight:700; color:#64748b; text-transform:uppercase; }
.rg-value { font-size:1.15rem; font-weight:900; }
.rg-value.green  { color:#059669; }
.rg-value.orange { color:#d97706; }
.rg-value.red    { color:#dc2626; }
.rg-value.blue   { color:#0284c7; }

.sheet-block { margin-bottom:2.5rem; }
.sheet-date-row { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:0.75rem; }
.sheet-date-box { display:flex; align-items:center; border:2px solid #0f172a; border-radius:4px; overflow:hidden; }
.sheet-date-label { background:#e2e8f0; font-weight:800; padding:0.4rem 0.85rem; border-right:2px solid #0f172a; font-size:0.85rem; }
.sheet-date-value { padding:0.4rem 1rem; font-size:0.9rem; font-weight:800; }
.sheet-day-summary { display:flex; gap:1rem; font-size:0.85rem; color:#475569; }

.table-sheet th { background:#f1f5f9; color:#0f172a; font-weight:800; border:1px solid #cbd5e1; font-size:0.74rem; text-align:center; }
.row-num { text-align:center; color:#94a3b8; font-size:0.78rem; font-weight:700; }
.subtotal-row { background:#e2e8f0; font-weight:800; }
.subtotal-label { font-weight:800; }
.subtotal-val   { font-weight:800; }
.fila-pendiente { background:#fffbeb !important; }
.chip-orange-sm { background:#fef3c7; color:#92400e; border:1px solid #fcd34d; padding:0.1rem 0.45rem; border-radius:12px; font-size:0.68rem; font-weight:800; margin-left:0.35rem; }

.action-cell { display:flex; gap:0.3rem; }
.btn-edit   { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; }
.btn-edit:hover  { background:#dbeafe; }
.btn-delete { background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; }
.btn-delete:hover{ background:#fee2e2; }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:999; display:flex; align-items:center; justify-content:center; padding:1rem; }
.modal-box { background:white; border-radius:12px; width:100%; max-width:640px; box-shadow:0 20px 60px rgba(0,0,0,0.28); animation:mIn 0.18s ease; }
@keyframes mIn { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.5rem; background:#fef2f2; border-radius:12px 12px 0 0; border-bottom:2px solid #fee2e2; }
.modal-header h3 { color:#dc2626; font-weight:800; font-size:1.05rem; margin:0; }
.modal-close { background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b; }
.modal-close:hover { color:#dc2626; }
.modal-body   { padding:1.5rem; }
.modal-footer { padding:1rem 1.5rem; border-top:1px solid #e2e8f0; display:flex; gap:0.75rem; justify-content:flex-end; }
.preview-total { display:flex; gap:1.5rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:0.75rem 1rem; margin-top:0.75rem; font-size:0.9rem; }
.preview-neg { color:#dc2626; font-weight:800; }
.preview-pos { color:#059669; font-weight:800; }

.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; }
.text-right { text-align:right; font-family:monospace; }
.text-bold { font-weight:700; }
.text-center { text-align:center; }
.text-danger  { color:#dc2626; font-weight:800; }
.text-success { color:#059669; font-weight:800; }
.empty-state  { padding:2.5rem; color:#64748b; }

@media (max-width:1200px) { .rg-grid { grid-template-columns:repeat(3,1fr); } }
@media (max-width:768px)  { .rg-grid { grid-template-columns:repeat(2,1fr); } .grid-2,.grid-3 { grid-template-columns:1fr; } }
</style>
