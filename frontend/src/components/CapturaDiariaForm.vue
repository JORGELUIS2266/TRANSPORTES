<template>
  <div class="captura-container">

    <!-- ══════════════════════════════════════════
         ENCABEZADO CON LOGO OFICIAL Y SELECTOR DE DÍA
    ══════════════════════════════════════════ -->
    <div class="brand-hero-card">
      <img src="/logo_tierra_de_humo.jpg" alt="Transporte Tierra de Humo" class="hero-logo-img" />
      <div class="hero-text-box">
        <h2 class="hero-company-title">TRANSPORTE TIERRA DE HUMO</h2>
        <span class="hero-company-corp">S.C. DE R.L. DE C.V.</span>
        <div class="hero-route-tag">
          <span>🚐 PASAJE · PAQUETERÍA · TURISMO</span>
          <strong class="route-pill">Ruta: Tlaxiaco ⇄ Putla</strong>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         SELECTOR DE FECHA DE CAPTURA DEL DÍA
    ══════════════════════════════════════════ -->
    <div class="dia-selector-card">
      <div class="dia-icon">📅</div>
      <div class="dia-info">
        <div class="dia-label-small">FECHA DE CAPTURA DEL DÍA</div>
        <div class="dia-nav-row">
          <button @click="irDiaAnterior" class="btn-nav-day" title="Día Anterior">◀ Día Anterior</button>

          <input
            type="date"
            v-model="form.fecha"
            @change="onCambioFechaDirecta"
            class="dia-input-picker"
          />

          <button @click="irDiaSiguiente" class="btn-nav-day" title="Día Siguiente">Día Siguiente ▶</button>
        </div>
      </div>

      <div class="dia-today-box">
        <span class="dia-badge-current">{{ formatFechaEspanol(form.fecha) }}</span>
        <small class="dia-week-context">Semana: {{ semanaActualObj?.label || 'Activa' }}</small>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         FORMULARIO DE CAPTURA DIARIA
    ══════════════════════════════════════════ -->
    <div class="card form-card-box">
      <div class="card-title-row">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:1.4rem;">📝</span>
          <div>
            <h3 class="form-main-title">Nueva Captura de Vuelta</h3>
            <small style="color:var(--text-muted);">
              Captura de turno para el día: <strong>{{ formatFechaEspanol(form.fecha) }}</strong>
            </small>
          </div>
        </div>

        <span class="badge-single-turn">🔒 Vuelta fija: 1 por registro</span>
      </div>

      <form @submit.prevent="guardar" class="form-grid">

        <!-- 1. UNIDAD Y CONDUCTOR -->
        <div class="form-section-card">
          <div class="form-section-title">🚐 1. Unidad y Conductor</div>

          <div class="grid-2-cols">
            <!-- Unidad -->
            <div class="form-group">
              <label class="form-label">Unidad (Número) <span class="req">*</span></label>
              <div class="autocomplete-wrap">
                <input
                  type="text"
                  v-model="form.numero_unidad"
                  @input="onInputUnidad"
                  placeholder="Ej. 01, 02, 11, 13, 16, 17..."
                  class="form-input"
                  :class="{ 'input-error': errores.numero_unidad }"
                  autocomplete="off"
                  required
                />
                <!-- Sugerencias rápidas de camionetas -->
                <div v-if="sugerenciasUnidades.length > 0" class="suggestions-box">
                  <div
                    v-for="u in sugerenciasUnidades"
                    :key="u.id"
                    @click="seleccionarUnidad(u)"
                    class="suggestion-item"
                  >
                    <strong>Unidad {{ u.numero }}</strong>
                    <small>({{ u.modelo || 'S/M' }}) · {{ u.dueno?.nombre || 'S/D' }}</small>
                  </div>
                </div>
              </div>
              <small v-if="formDuenoNombre" class="helper-text-green">
                👤 Propietario: <strong>{{ formDuenoNombre }}</strong>
              </small>
              <small v-if="errores.numero_unidad" class="error-msg">{{ errores.numero_unidad }}</small>
            </div>

            <!-- Conductor -->
            <div class="form-group">
              <label class="form-label">Conductor / Chofer <span class="req">*</span></label>
              <input
                type="text"
                v-model="form.nombre_conductor"
                placeholder="Ej. FREDY, OMAR, IRVIG, JOB..."
                class="form-input"
                :class="{ 'input-error': errores.nombre_conductor }"
                required
              />
              <small v-if="errores.nombre_conductor" class="error-msg">{{ errores.nombre_conductor }}</small>
            </div>
          </div>

          <!-- Vueltas fijas bloqueadas a 1 -->
          <div class="grid-2-cols" style="margin-top:0.6rem;">
            <div class="form-group">
              <label class="form-label">
                Vueltas del Registro
                <span class="locked-label">🔒 Bloqueado a 1 vuelta (Taquilleras no pueden alterar)</span>
              </label>
              <div class="locked-input-wrap">
                <input
                  type="number"
                  :value="1"
                  class="form-input locked-input"
                  disabled
                  readonly
                />
                <span class="locked-badge">1 Vuelta Oficial</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Fecha del Turno</label>
              <input
                type="date"
                v-model="form.fecha"
                class="form-input"
                required
              />
            </div>
          </div>
        </div>

        <!-- 2. INGRESOS POR PASAJES -->
        <div class="form-section-card">
          <div class="form-section-title">💵 2. Ingresos por Pasajes (Boletos y Paradas)</div>

          <div class="grid-3-cols">
            <div class="form-group">
              <label class="form-label">Bitácora 1 — Tlaxiaco ➔ Putla ($) <span class="req">*</span></label>
              <input
                type="number"
                step="0.50"
                min="0"
                v-model.number="form.bitacora_tlaxiaco_putla"
                class="form-input text-right"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Bitácora 2 — Putla ➔ Tlaxiaco ($)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                v-model.number="form.bitacora_putla_tlaxiaco"
                class="form-input text-right"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Intermedio Tlaxiaco ⇄ Putla ($)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                v-model.number="form.intermedios"
                class="form-input text-right"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Total generado automático -->
          <div class="calc-row-box">
            <span class="calc-label">Total Generado en Pasajes (automático):</span>
            <strong class="calc-value green">${{ totalGeneradoCalc.toFixed(2) }}</strong>
          </div>
        </div>

        <!-- 3. COMBUSTIBLE Y GASTOS -->
        <div class="form-section-card">
          <div class="form-section-title">⛽ 3. Combustible ($600 predeterminado) y Gastos</div>

          <div class="grid-2-cols">
            <div class="form-group">
              <label class="form-label">
                Combustible ($) <span class="req">*</span>
                <span class="default-tag">Predeterminado: $600.00</span>
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                v-model.number="form.combustible"
                class="form-input text-right font-bold"
                placeholder="600.00"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Gastos Imprevistos ($)</label>
              <input
                type="number"
                step="0.50"
                min="0"
                v-model.number="form.gastos_imprevistos"
                class="form-input text-right"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="form-group" style="margin-top:0.5rem;" v-if="form.gastos_imprevistos > 0">
            <label class="form-label">Concepto del Gasto Imprevisto</label>
            <input
              type="text"
              v-model="form.concepto_gastos"
              class="form-input"
              placeholder="Ej. Ponchadura de llanta, caseta, aceite..."
            />
          </div>

          <!-- Total Neto / Ganancia -->
          <div class="calc-row-box net-box" :class="totalNetoCalc < 0 ? 'box-negative' : 'box-positive'">
            <span class="calc-label">
              Total Neto / Liquidación al Propietario (Generado − Combustible − Gastos):
            </span>
            <strong class="calc-value" :class="totalNetoCalc < 0 ? 'text-red' : 'text-green'">
              ${{ totalNetoCalc.toFixed(2) }}
            </strong>
          </div>
        </div>

        <!-- Botones para Guardar -->
        <div class="form-submit-row">
          <button
            type="button"
            @click="guardarConEstado('completado')"
            class="btn btn-red btn-lg btn-block-mobile"
            :disabled="isSubmitting"
          >
            💾 Guardar Vuelta del Día
          </button>
        </div>

      </form>
    </div>

    <!-- ══════════════════════════════════════════
         TABLA EXCLUSIVA DE VUELTAS DEL DÍA ACTUAL
    ══════════════════════════════════════════ -->
    <div class="card dia-capturas-card">
      <div class="dia-capturas-header">
        <div>
          <h3 class="dia-capturas-title">
            📋 Vueltas Registradas el día {{ formatFechaEspanol(form.fecha) }}
          </h3>
          <small style="color:var(--text-muted);">
            Esta ventana solo muestra las salidas de esta fecha seleccionada. Para ver toda la semana completa, ve a la pestaña <strong>📊 Resumen</strong>.
          </small>
        </div>
        <span class="dia-count-badge">{{ registrosDelDia.length }} vuelta(s) hoy</span>
      </div>

      <!-- Resumen de totales del día actual -->
      <div class="day-metrics-bar" v-if="registrosDelDia.length > 0">
        <div class="d-metric">
          <span>💰 Generado Hoy:</span>
          <strong>${{ sumGenDia.toFixed(2) }}</strong>
        </div>
        <div class="d-metric">
          <span>⛽ Combustible:</span>
          <strong style="color:#d97706;">${{ sumCombDia.toFixed(2) }}</strong>
        </div>
        <div class="d-metric">
          <span>🏁 Ganancia Neta:</span>
          <strong :class="sumNetoDia < 0 ? 'text-red' : 'text-green'">${{ sumNetoDia.toFixed(2) }}</strong>
        </div>
      </div>

      <!-- Estado Vacío -->
      <div v-if="registrosDelDia.length === 0" class="empty-day-state">
        <div style="font-size:2.5rem; margin-bottom:0.4rem;">🚐</div>
        <p><strong>No hay capturas registradas el día {{ formatFechaEspanol(form.fecha) }}.</strong></p>
        <p style="font-size:0.82rem; color:#64748b;">
          Completa el formulario de arriba para registrar la primera vuelta de este día.
        </p>
      </div>

      <!-- Tabla de vueltas del día -->
      <div v-else class="table-responsive">
        <table class="table table-day">
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>Unidad / Conductor</th>
              <th class="text-right">Bit. 1 (Tlax ➔ Put)</th>
              <th class="text-right">Bit. 2 (Put ➔ Tlax)</th>
              <th class="text-right">Inter.</th>
              <th class="text-right">Total Gen.</th>
              <th class="text-right">Combustible</th>
              <th class="text-right">Total Neto</th>
              <th style="text-align:center;">Estado</th>
              <th v-if="auth.isAdmin" style="text-align:center;">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in registrosDelDia" :key="r.id">
              <td class="row-index">{{ idx + 1 }}</td>
              <td>
                <div class="unit-cond-box">
                  <strong>Unidad {{ r.numero_unidad }}</strong>
                  <span class="driver-tag">{{ r.nombre_conductor }}</span>
                </div>
              </td>
              <td class="text-right font-mono">${{ Number(r.bitacora_tlaxiaco_putla || 0).toFixed(2) }}</td>
              <td class="text-right font-mono">${{ Number(r.bitacora_putla_tlaxiaco || 0).toFixed(2) }}</td>
              <td class="text-right font-mono">${{ Number(r.intermedios || 0).toFixed(2) }}</td>
              <td class="text-right font-mono font-bold">${{ Number(r.total_generado || 0).toFixed(2) }}</td>
              <td class="text-right font-mono" style="color:#d97706;">${{ Number(r.combustible || 0).toFixed(2) }}</td>
              <td class="text-right font-mono font-bold" :class="Number(r.total_neto || 0) < 0 ? 'text-red' : 'text-green'">
                ${{ Number(r.total_neto || 0).toFixed(2) }}
              </td>
              <td style="text-align:center;">
                <span class="badge badge-success">✅ LISTO</span>
              </td>
              <td v-if="auth.isAdmin" style="text-align:center;">
                <button @click="eliminar(r.id)" class="btn btn-sm btn-delete" title="Eliminar registro">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="subtotal-day-row">
              <td colspan="2" class="font-bold">TOTALES DEL DÍA:</td>
              <td class="text-right font-mono font-bold">${{ sumB1Dia.toFixed(2) }}</td>
              <td class="text-right font-mono font-bold">${{ sumB2Dia.toFixed(2) }}</td>
              <td class="text-right font-mono font-bold">${{ sumInterDia.toFixed(2) }}</td>
              <td class="text-right font-mono font-bold">${{ sumGenDia.toFixed(2) }}</td>
              <td class="text-right font-mono font-bold" style="color:#d97706;">${{ sumCombDia.toFixed(2) }}</td>
              <td class="text-right font-mono font-bold" :class="sumNetoDia < 0 ? 'text-red' : 'text-green'">
                ${{ sumNetoDia.toFixed(2) }}
              </td>
              <td :colspan="auth.isAdmin ? 2 : 1"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import {
  getSemanasSelectRecentFirst,
  getSemanaActualId,
  getSemanaIdParaFecha,
  formatFechaLarga
} from '../utils/semanas';

const auth = useAuthStore();

// ── Fecha actual por defecto ──────────────────────────────────────────────────
const todayStr = new Date().toISOString().split('T')[0];

const form = ref({
  fecha:                   todayStr,
  numero_unidad:           '',
  nombre_conductor:        '',
  vueltas_dadas:           1,
  bitacora_tlaxiaco_putla: 0,
  bitacora_putla_tlaxiaco: 0,
  intermedios:             0,
  combustible:             600,
  gastos_imprevistos:      0,
  concepto_gastos:         ''
});

const errores = ref({
  numero_unidad:    '',
  nombre_conductor: ''
});

const isSubmitting = ref(false);
const registros    = ref([]);
const unidades     = ref([]);
let syncInterval   = null;

// Semanas
const semanasDisponibles = ref(getSemanasSelectRecentFirst() || []);
const semanaActivaId     = computed(() => getSemanaIdParaFecha(form.value.fecha) || getSemanaActualId());
const semanaActualObj    = computed(() => (semanasDisponibles.value || []).find(s => s && s.id === semanaActivaId.value) || null);

// ── Cargar datos desde Supabase ───────────────────────────────────────────────
async function cargar() {
  try {
    const sId = semanaActivaId.value;
    const [regs, unis] = await Promise.all([
      api.getRegistrosDeSemana(sId).catch(() => []),
      api.getUnidades().catch(() => [])
    ]);
    registros.value = Array.isArray(regs) ? regs : [];
    unidades.value  = Array.isArray(unis) ? unis : [];
  } catch (e) {
    console.error('[Captura] Error cargando:', e);
  }
}

// ── Filtrar ÚNICAMENTE los registros del día actual seleccionado ──────────────
const registrosDelDia = computed(() => {
  const f = form.value.fecha;
  if (!f) return [];
  return (registros.value || []).filter(r => r && r.fecha === f);
});

// Totales calculados solo para el día seleccionado
const sumB1Dia    = computed(() => registrosDelDia.value.reduce((acc, r) => acc + (Number(r.bitacora_tlaxiaco_putla) || 0), 0));
const sumB2Dia    = computed(() => registrosDelDia.value.reduce((acc, r) => acc + (Number(r.bitacora_putla_tlaxiaco) || 0), 0));
const sumInterDia = computed(() => registrosDelDia.value.reduce((acc, r) => acc + (Number(r.intermedios) || 0), 0));
const sumGenDia   = computed(() => registrosDelDia.value.reduce((acc, r) => acc + (Number(r.total_generado) || 0), 0));
const sumCombDia  = computed(() => registrosDelDia.value.reduce((acc, r) => acc + (Number(r.combustible) || 0), 0));
const sumNetoDia  = computed(() => registrosDelDia.value.reduce((acc, r) => acc + (Number(r.total_neto) || 0), 0));

// Totales reactivos del formulario
const totalGeneradoCalc = computed(() => {
  const b1    = Number(form.value.bitacora_tlaxiaco_putla) || 0;
  const b2    = Number(form.value.bitacora_putla_tlaxiaco) || 0;
  const inter = Number(form.value.intermedios) || 0;
  return b1 + b2 + inter;
});

const totalNetoCalc = computed(() => {
  const gen    = totalGeneradoCalc.value;
  const comb   = Number(form.value.combustible) || 0;
  const imprev = Number(form.value.gastos_imprevistos) || 0;
  return gen - comb - imprev;
});

// Dueño automático
const duenoDeUnidadSeleccionada = computed(() => {
  if (!unidades.value || !form.value.numero_unidad) return null;
  const u = unidades.value.find(u => u && u.numero === form.value.numero_unidad);
  return u?.dueno || null;
});
const formDuenoNombre = computed(() => duenoDeUnidadSeleccionada.value?.nombre || '');

// Autocompletado de unidades
const sugerenciasUnidades = computed(() => {
  const q = (form.value.numero_unidad || '').trim().toLowerCase();
  if (!q) return [];
  return (unidades.value || []).filter(u => u && u.numero && u.numero.toLowerCase().includes(q) && u.numero.toLowerCase() !== q);
});

function onInputUnidad() {
  errores.value.numero_unidad = '';
}

function seleccionarUnidad(u) {
  form.value.numero_unidad = u.numero;
  errores.value.numero_unidad = '';
}

// Navegación rápida de días
function irDiaAnterior() {
  const d = new Date(form.value.fecha + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  form.value.fecha = d.toISOString().split('T')[0];
  cargar();
}

function irDiaSiguiente() {
  const d = new Date(form.value.fecha + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  form.value.fecha = d.toISOString().split('T')[0];
  cargar();
}

function onCambioFechaDirecta() {
  cargar();
}

function formatFechaEspanol(fStr) {
  if (!fStr) return '—';
  try {
    const d = new Date(fStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return fStr;
  }
}

// ── Guardar Vuelta ────────────────────────────────────────────────────────────
async function guardarConEstado(estado) {
  errores.value.numero_unidad    = '';
  errores.value.nombre_conductor = '';

  if (!form.value.numero_unidad.trim()) {
    errores.value.numero_unidad = 'Ingresa el número de unidad.';
    return;
  }
  if (!form.value.nombre_conductor.trim()) {
    errores.value.nombre_conductor = 'Ingresa el nombre del chofer.';
    return;
  }

  isSubmitting.value = true;
  try {
    await api.guardarRegistro({
      ...form.value,
      vueltas_dadas:    1, // Bloqueado estrictamente a 1 vuelta
      numero_unidad:    form.value.numero_unidad.trim(),
      nombre_conductor: form.value.nombre_conductor.trim(),
      dueno_nombre:     formDuenoNombre.value,
      estado
    });

    await cargar();

    // Resetear formulario manteniendo la fecha y combustible en 600
    form.value.numero_unidad           = '';
    form.value.nombre_conductor        = '';
    form.value.bitacora_tlaxiaco_putla = 0;
    form.value.bitacora_putla_tlaxiaco = 0;
    form.value.intermedios             = 0;
    form.value.combustible             = 600;
    form.value.gastos_imprevistos      = 0;
    form.value.concepto_gastos         = '';

  } catch (e) {
    alert('❌ Error al guardar en Supabase: ' + e.message);
  } finally {
    isSubmitting.value = false;
  }
}

async function eliminar(id) {
  if (!confirm('¿Eliminar este registro de vuelta? Esta acción es permanente en la base de datos.')) return;
  await api.eliminarRegistro(id);
  await cargar();
}

onMounted(() => {
  cargar();
  // Sincronización continua de fondo
  syncInterval = setInterval(() => {
    cargar();
  }, 4000);
});

onUnmounted(() => {
  if (syncInterval) clearInterval(syncInterval);
});
</script>

<style scoped>
.captura-container {
  max-width: 1750px;
  margin: 0 auto;
}

/* ── Banner Hero con Logo Oficial ─────────────────── */
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

.hero-logo-img {
  width: 160px;
  height: auto;
  max-height: 60px;
  object-fit: contain;
}

.hero-text-box {
  display: flex;
  flex-direction: column;
}

.hero-company-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: #dc2626;
  letter-spacing: -0.01em;
}

.hero-company-corp {
  font-size: 0.82rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.06em;
}

.hero-route-tag {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.route-pill {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  padding: 0.1rem 0.5rem;
  border-radius: 6px;
}

/* ── Selector de Día ─────────────────────────────── */
.dia-selector-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-left: 6px solid #dc2626;
  border-radius: 12px;
  padding: 0.9rem 1.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.dia-icon { font-size: 2rem; }
.dia-info { display: flex; flex-direction: column; gap: 0.25rem; }
.dia-label-small { font-size: 0.72rem; font-weight: 900; color: #64748b; text-transform: uppercase; }

.dia-nav-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-nav-day {
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-nav-day:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }

.dia-input-picker {
  border: 2px solid #dc2626;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.95rem;
  padding: 0.4rem 0.75rem;
  color: #dc2626;
  background: #fff5f5;
}

.dia-today-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.dia-badge-current {
  font-size: 1rem;
  font-weight: 900;
  color: #0f172a;
  text-transform: capitalize;
}

.dia-week-context {
  font-size: 0.75rem;
  color: #64748b;
}

/* ── Formulario ──────────────────────────────────── */
.form-card-box {
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 1.5rem;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.form-main-title {
  margin: 0;
  font-size: 1.15rem;
  color: #dc2626;
  font-weight: 900;
}

.badge-single-turn {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
}

.form-section-title {
  font-size: 0.85rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #0f172a;
  margin-bottom: 0.9rem;
}

.grid-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.grid-3-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }

.locked-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #64748b;
  margin-left: 0.4rem;
}

.locked-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.locked-input {
  background: #f1f5f9 !important;
  color: #64748b !important;
  cursor: not-allowed;
  font-weight: 900;
  font-size: 1rem;
  padding-right: 7.5rem;
}

.locked-badge {
  position: absolute;
  right: 0.5rem;
  font-size: 0.72rem;
  font-weight: 800;
  background: #e2e8f0;
  color: #475569;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.default-tag {
  font-size: 0.68rem;
  color: #d97706;
  font-weight: 800;
  margin-left: 0.35rem;
}

.calc-row-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  margin-top: 0.85rem;
}

.calc-label { font-size: 0.85rem; font-weight: 800; color: #334155; }
.calc-value { font-size: 1.35rem; font-weight: 900; }

.net-box {
  background: #f0fdf4;
  border-color: #86efac;
}

.box-negative { background: #fef2f2 !important; border-color: #fca5a5 !important; }

.form-submit-row {
  display: flex;
  justify-content: flex-end;
}

/* ── Tabla del Día ───────────────────────────────── */
.dia-capturas-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
}

.dia-capturas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dia-capturas-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 900;
  color: #0f172a;
}

.dia-count-badge {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
}

.day-metrics-bar {
  display: flex;
  gap: 1.5rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.d-metric {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.empty-day-state {
  text-align: center;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  padding: 2.5rem 1rem;
}

.subtotal-day-row {
  background: #f1f5f9;
  font-weight: 900;
}

.unit-cond-box {
  display: flex;
  flex-direction: column;
}

.driver-tag {
  font-size: 0.75rem;
  color: #64748b;
}

.helper-text-green { color: #059669; font-size: 0.75rem; font-weight: 700; margin-top: 0.2rem; }
.font-mono { font-family: monospace; font-size: 0.88rem; }

/* ── Mobile Responsive ───────────────────────────── */
@media (max-width: 768px) {
  .brand-hero-card { flex-direction: column; text-align: center; align-items: center; }
  .grid-2-cols, .grid-3-cols { grid-template-columns: 1fr; }
  .dia-selector-card { flex-direction: column; align-items: stretch; text-align: center; }
  .dia-today-box { align-items: center; }
  .btn-block-mobile { width: 100%; }
}
</style>
