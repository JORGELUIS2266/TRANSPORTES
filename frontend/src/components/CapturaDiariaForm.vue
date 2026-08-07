<template>
  <div class="captura-container">

    <!-- ══════════════════════════════════════════
         SELECTOR DE SEMANA
    ══════════════════════════════════════════ -->
    <!-- ══════════════════════════════════════════
         SELECTOR DE SEMANA CON CALENDARIO
    ══════════════════════════════════════════ -->
    <div class="semana-selector-card">
      <div class="semana-icon">📅</div>
      <div class="semana-info">
        <div class="semana-label-small">SEMANA ACTIVA DE OPERACIÓN</div>
        <div class="semana-nav-row">
          <button @click="irSemanaAnterior" class="btn-nav-week" title="Semana Anterior">◀ Anterior</button>

          <select v-model="semanaActivaId" @change="onCambioSemana" class="semana-select">
            <option v-for="s in (semanasDisponibles || [])" :key="s?.id || Math.random()" :value="s?.id || ''">
              <template v-if="s">
                {{ s.label }}
              </template>
            </option>
          </select>

          <button @click="irSemanaSiguiente" class="btn-nav-week" title="Semana Siguiente">Siguiente ▶</button>
        </div>
      </div>

      <!-- Selector por Calendario Directo -->
      <div class="semana-cal-picker">
        <label class="cal-picker-label">Ir a fecha en calendario:</label>
        <input
          type="date"
          :value="form.fecha"
          @change="onPickFechaCalendario($event.target.value)"
          class="cal-input-picker"
        />
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         ARRASTRES (pendientes de semana anterior)
    ══════════════════════════════════════════ -->
    <div v-if="arrastres && arrastres.length > 0" class="card arrastre-card">
      <div class="arrastre-header">
        <span>⚠️ Vueltas Pendientes de la Semana Anterior</span>
        <span class="arrastre-count">{{ arrastres.length }} pendiente(s)</span>
      </div>
      <p class="arrastre-desc">
        Estas vueltas quedaron sin completarse en la semana pasada.
        No están incluidas en los totales de esa semana.
        Puedes completarlas aquí para que cuenten en la semana actual, o eliminarlas.
      </p>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Unidad / Conductor</th>
              <th>Fecha Original</th>
              <th class="text-right">Total Gen.</th>
              <th class="text-right">Combustible</th>
              <th class="text-right">Total Neto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in arrastres" :key="r?.id || Math.random()" class="fila-arrastre">
              <td><strong>{{ r?.numero_unidad }} – {{ r?.nombre_conductor }}</strong></td>
              <td>{{ formatFechaCorta(r?.fecha) }}</td>
              <td class="text-right">$ {{ Number(r?.total_generado || 0).toFixed(2) }}</td>
              <td class="text-right" style="color:#d97706;">$ {{ Number(r?.combustible || 0).toFixed(2) }}</td>
              <td class="text-right" :class="Number(r?.total_neto || 0) < 0 ? 'cell-negative' : 'cell-positive'">
                $ {{ Number(r?.total_neto || 0).toFixed(2) }}
              </td>
              <td>
                <div class="action-cell" v-if="auth.puedeCapturar">
                  <button @click="completarArrastre(r)" class="btn btn-sm btn-success-sm">
                    ✅ Completar → Semana Actual
                  </button>
                  <button v-if="auth.puedeEliminar" @click="eliminarRegistro(r?.id)" class="btn btn-sm btn-delete">🗑️</button>
                </div>
                <span v-else class="badge" style="background:#fef3c7; color:#92400e; font-size:0.75rem;">⏳ Arrastre pendiente</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         FORMULARIO DE CAPTURA
    ══════════════════════════════════════════ -->
    <div class="card">
      <div class="card-header-box">
        <div>
          <h2 class="form-title">📱 Nueva Captura de Vuelta</h2>
          <p class="form-sub">Ruta: Tlaxiaco ➔ Putla &nbsp;|&nbsp;
            Semana activa: <strong>{{ semanaActualObj?.label || 'Semana Actual' }}</strong>
          </p>
        </div>
      </div>

      <!-- Banner de Lector -->
      <div v-if="auth.isLector" class="alert-warn" style="background:#f0fdf4; border-color:#86efac; color:#166534; margin-bottom:1rem;">
        👁️ <strong>Modo Lector (Solo Consulta):</strong> Tienes permisos de visualización. Este formulario está bloqueado para evitar modificaciones accidentales.
      </div>

      <!-- ── 1. UNIDAD Y CONDUCTOR ────────────────── -->
      <div class="box-section">
        <div class="box-title">🚐 1. Unidad y Conductor</div>
        <div class="grid-3">

          <div class="form-group">
            <label class="form-label">Fecha de la Vuelta <span class="req">*</span></label>
            <input
              type="date"
              v-model="form.fecha"
              class="form-input"
              :class="{ 'input-error': errores.fecha }"
              :min="semanaActualObj?.fechaInicio"
              :max="semanaActualObj?.fechaFin"
              :disabled="auth.isLector"
              @change="errores.fecha = ''"
            />
            <span v-if="errores.fecha" class="error-msg">{{ errores.fecha }}</span>
          </div>

          <!-- Unidad (Selección o Escritura libre) -->
          <div class="form-group">
            <label class="form-label">Unidad (Número) <span class="req">*</span></label>
            <input
              type="text"
              list="lista-unidades-cat"
              v-model="form.numero_unidad"
              class="form-input"
              :class="{ 'input-error': errores.numero_unidad }"
              placeholder="Ej. 01, 02, 13, 16, 17..."
              :disabled="auth.isLector"
              @input="onSeleccionarUnidad"
            />
            <datalist id="lista-unidades-cat">
              <option v-for="u in (unidades || [])" :key="u?.id || Math.random()" :value="u?.numero || ''">
                Unidad {{ u?.numero }}{{ u?.dueno ? ` · Dueño: ${u.dueno.nombre}` : '' }}
              </option>
            </datalist>
            <span v-if="errores.numero_unidad" class="error-msg">{{ errores.numero_unidad }}</span>
          </div>

          <!-- Conductor (texto libre) -->
          <div class="form-group">
            <label class="form-label">Conductor / Chofer <span class="req">*</span></label>
            <input
              type="text"
              v-model="form.nombre_conductor"
              class="form-input"
              :class="{ 'input-error': errores.nombre_conductor }"
              placeholder="Ej. FREDY, OMAR, IRVIG..."
              :disabled="auth.isLector"
              @input="errores.nombre_conductor = ''"
            />
            <span v-if="errores.nombre_conductor" class="error-msg">{{ errores.nombre_conductor }}</span>
          </div>
        </div>

        <!-- Info del dueño (automática al seleccionar unidad) -->
        <div class="dueno-info" v-if="duenoDeUnidadSeleccionada">
          <span class="dueno-icon">👤</span>
          <span>Dueño de la unidad: <strong>{{ duenoDeUnidadSeleccionada.nombre }}</strong>
            <span v-if="duenoDeUnidadSeleccionada.telefono"> · {{ duenoDeUnidadSeleccionada.telefono }}</span>
          </span>
        </div>

        <div class="form-group" style="max-width:200px; margin-top:0.75rem;">
          <label class="form-label">Vueltas del día</label>
          <input type="number" v-model.number="form.vueltas_dadas" min="1" max="10" class="form-input" :disabled="auth.isLector" />
        </div>
      </div>

      <!-- ── 2. BITÁCORAS ─────────────────────────── -->
      <div class="box-section">
        <div class="box-title">💵 2. Ingresos por Pasajes</div>
        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">Bitácora 1 – Tlax → Putla ($) <span class="req">*</span></label>
            <input type="number" v-model.number="form.bitacora_tlaxiaco_putla"
              step="10" min="0" class="form-input text-right"
              :class="{ 'input-error': errores.montos }"
              :disabled="auth.isLector"
              @input="errores.montos = ''"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Bitácora 2 – Putla → Tlax ($)</label>
            <input type="number" v-model.number="form.bitacora_putla_tlaxiaco"
              step="10" min="0" class="form-input text-right"
              :disabled="auth.isLector"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Intermedio Tlax-Put ($)</label>
            <input type="number" v-model.number="form.intermedios"
              step="10" min="0" class="form-input text-right"
              :disabled="auth.isLector"
            />
          </div>
        </div>
        <span v-if="errores.montos" class="error-msg">{{ errores.montos }}</span>

        <div class="summary-box generado">
          <span class="summary-label">Total Generado (automático):</span>
          <span class="summary-value green">${{ Number(totalGeneradoCalc || 0).toFixed(2) }}</span>
        </div>
      </div>

      <!-- ── 3. COMBUSTIBLE ──────────────────────── -->
      <div class="box-section">
        <div class="box-title">⛽ 3. Combustible y Gastos</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Combustible ($) <span class="req">*</span></label>
            <input type="number" v-model.number="form.combustible"
              step="50" min="0" class="form-input text-right"
              :class="{ 'input-error': errores.combustible }"
              :disabled="auth.isLector"
              @input="errores.combustible = ''"
            />
            <span v-if="errores.combustible" class="error-msg">{{ errores.combustible }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Gastos Imprevistos ($)</label>
            <input type="number" v-model.number="form.gastos_imprevistos"
              step="10" min="0" class="form-input text-right"
              :disabled="auth.isLector"
            />
          </div>
        </div>
        <div class="form-group" v-if="form.gastos_imprevistos > 0">
          <label class="form-label">Concepto del gasto imprevisto</label>
          <input type="text" v-model="form.concepto_gastos"
            placeholder="Describa el gasto..." class="form-input" :disabled="auth.isLector" />
        </div>
      </div>

      <!-- ── TOTAL NETO PREVIEW ─────────────────── -->
      <div class="summary-box neto" :class="{ 'neto-negativo': Number(totalNetoCalc || 0) < 0 }">
        <div>
          <span class="summary-label">Total Neto / Ganancia:</span>
          <span class="summary-subtext"> (Generado − Combustible − Imprevistos)</span>
        </div>
        <span class="summary-value" :class="Number(totalNetoCalc || 0) < 0 ? 'red' : 'green'">
          ${{ Number(totalNetoCalc || 0).toFixed(2) }}
        </span>
      </div>
      <div v-if="Number(totalNetoCalc || 0) < 0" class="alert-warn">
        🚨 <strong>Saldo negativo:</strong> Esta vuelta genera una pérdida. ¿Deseas guardarla de todas formas?
      </div>

      <!-- ── Alerta de duplicado ─────────────────── -->
      <div v-if="alertaDuplicado" class="alert-warn" style="border-color:#f59e0b; background:#fef3c7; color:#92400e;">
        ⚠️ <strong>Posible duplicado:</strong> Ya existe un registro de la unidad
        <strong>{{ form.numero_unidad }}</strong> para el
        <strong>{{ formatFechaCorta(form.fecha) }}</strong> en esta semana.
      </div>

      <!-- ── Alerta de Modo Lector ───────────────── -->
      <div v-if="auth.isLector" class="alert-warn" style="background:#f0fdf4; border-color:#86efac; color:#166534;">
        👁️ <strong>Modo Consulta (Lector):</strong> Tienes permisos de solo lectura para supervisar los informes. Para registrar nuevas vueltas, inicia sesión con la cuenta de <strong>Administrador</strong> o <strong>Capturista</strong>.
      </div>

      <!-- ── BOTONES DE GUARDAR (Solo Admin y Capturista) ─────────────────── -->
      <div v-if="auth.puedeCapturar" class="form-actions-grid">
        <button
          type="button"
          class="btn btn-red"
          :disabled="isSubmitting"
          @click="guardar('completado')"
        >
          <span v-if="isSubmitting && estadoGuardando === 'completado'">⏳ Guardando...</span>
          <span v-else>💾 Guardar COMPLETADO</span>
        </button>

        <button
          type="button"
          class="btn btn-warning"
          :disabled="isSubmitting"
          @click="guardar('pendiente')"
        >
          <span v-if="isSubmitting && estadoGuardando === 'pendiente'">⏳ Guardando...</span>
          <span v-else>⏳ Guardar como PENDIENTE</span>
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         PANEL DE TOTALES DE LA SEMANA
    ══════════════════════════════════════════ -->
    <div class="totales-panel" v-if="(registros && registros.length > 0) || (arrastres && arrastres.length > 0)">
      <div class="tp-title">📈 Totales de la {{ semanaActualObj?.label || 'Semana Actual' }}</div>
      <div class="tp-grid">
        <div class="tp-item">
          <span class="tp-label">💰 Total Generado</span>
          <span class="tp-value green">${{ Number(totalSemanaGenerado || 0).toFixed(2) }}</span>
        </div>
        <div class="tp-item">
          <span class="tp-label">⛽ Combustible</span>
          <span class="tp-value orange">${{ Number(totalSemanaCombustible || 0).toFixed(2) }}</span>
        </div>
        <div class="tp-item" :class="Number(totalSemanaNeto || 0) < 0 ? 'tp-neg' : ''">
          <span class="tp-label">🏁 Total Neto</span>
          <span class="tp-value" :class="Number(totalSemanaNeto || 0) < 0 ? 'red' : 'green'">
            ${{ Number(totalSemanaNeto || 0).toFixed(2) }}
          </span>
        </div>
        <div class="tp-item">
          <span class="tp-label">🔄 Vueltas Registradas</span>
          <span class="tp-value blue">{{ registrosCompletados.length }}</span>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         TABLAS SEPARADAS POR DÍA DE LA SEMANA
    ══════════════════════════════════════════ -->
    <div style="margin-top:1.5rem;" v-if="gruposPorDia && gruposPorDia.length > 0">

      <div style="display:flex; justify-content:flex-end; margin-bottom:0.75rem;" v-if="auth.puedeEliminar">
        <button @click="vaciarSemana" class="btn btn-secondary btn-sm" style="color:#dc2626; border-color:#fca5a5;">
          🗑️ Vaciar registros de esta semana
        </button>
      </div>

      <div v-for="grupo in gruposPorDia" :key="grupo?.fecha || Math.random()" class="card dia-card">
        <!-- Encabezado de día tipo planilla física -->
        <div class="sheet-header">
          <div class="sheet-date-box">
            <span class="sheet-date-label">FECHA</span>
            <span class="sheet-date-value">{{ formatFechaLargaLocal(grupo?.fecha) }}</span>
          </div>
          <div class="sheet-day-totals">
            <span>💰 Gen: <strong>${{ Number(grupo?.sumGenerado || 0).toFixed(2) }}</strong></span>
            <span>⛽ Comb: <strong>${{ Number(grupo?.sumCombustible || 0).toFixed(2) }}</strong></span>
            <span :class="Number(grupo?.sumNeto || 0) < 0 ? 'neg-text' : 'pos-text'">
              🏁 Neto: <strong>${{ Number(grupo?.sumNeto || 0).toFixed(2) }}</strong>
            </span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sheet">
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th>UNIDAD / CONDUCTOR</th>
                <th class="text-right">BIT. 1<br><small>Tlax→Put</small></th>
                <th class="text-right">BIT. 2<br><small>Put→Tlax</small></th>
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
                  <span v-if="r?.arrastre" class="chip chip-orange" style="margin-left:0.4rem; font-size:0.7rem;">ARRASTRE</span>
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
                  <button
                    v-if="auth.puedeEditar"
                    @click="toggleEstado(r)" class="badge btn-badge"
                    :class="r?.estado === 'pendiente' ? 'badge-warning' : 'badge-success'">
                    {{ r?.estado === 'pendiente' ? '⏳ PENDIENTE' : '✅ LISTO' }}
                  </button>
                  <span v-else class="badge" :class="r?.estado === 'pendiente' ? 'badge-warning' : 'badge-success'">
                    {{ r?.estado === 'pendiente' ? '⏳ PENDIENTE' : '✅ LISTO' }}
                  </span>
                </td>
                <td v-if="auth.puedeEditar || auth.puedeEliminar">
                  <button v-if="auth.puedeEliminar" @click="eliminarRegistro(r?.id)" class="btn btn-sm btn-delete" title="Eliminar">🗑️</button>
                  <span v-else>–</span>
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
    </div>

    <div v-if="(!gruposPorDia || gruposPorDia.length === 0) && (!registros || registros.length === 0)" class="card text-center empty-state">
      No hay capturas en la <strong>{{ semanaActualObj?.label || 'Semana Seleccionada' }}</strong>.<br>
      Completa el formulario de arriba para agregar la primera vuelta.
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import {
  getSemanasSelectRecentFirst,
  getSemanaActualId,
  getSemanaAnteriorId,
  getSemanaSiguienteId,
  getSemanaIdParaFecha,
  formatFechaCorta,
  formatFechaLarga
} from '../utils/semanas';

const auth = useAuthStore();

// ── Semanas ────────────────────────────────────────────────────────────────────
const semanasDisponibles = ref(getSemanasSelectRecentFirst() || []);
const semanaActivaId     = ref(api.getSemanaActiva() || getSemanaActualId());
const semanaActualObj    = computed(() => (semanasDisponibles.value || []).find(s => s && s.id === semanaActivaId.value) || semanasDisponibles.value[0] || null);
const semanaAnteriorId   = computed(() => semanaActivaId.value ? getSemanaAnteriorId(semanaActivaId.value) : null);

function onCambioSemana() {
  try {
    if (semanaActivaId.value) {
      api.setSemanaActiva(semanaActivaId.value);
    }
    cargar();
  } catch (e) {
    console.error('[Captura] Error cambiando semana:', e);
  }
}

function irSemanaAnterior() {
  const antId = getSemanaAnteriorId(semanaActivaId.value);
  if (antId) {
    semanaActivaId.value = antId;
    // Si no está en el select, agregarlo
    if (!semanasDisponibles.value.some(s => s.id === antId)) {
      semanasDisponibles.value = getSemanasSelectRecentFirst();
    }
    onCambioSemana();
  }
}

function irSemanaSiguiente() {
  const sigId = getSemanaSiguienteId(semanaActivaId.value);
  if (sigId) {
    semanaActivaId.value = sigId;
    if (!semanasDisponibles.value.some(s => s.id === sigId)) {
      semanasDisponibles.value = getSemanasSelectRecentFirst();
    }
    onCambioSemana();
  }
}

function onPickFechaCalendario(nuevaFecha) {
  if (!nuevaFecha) return;
  form.value.fecha = nuevaFecha;
  const semId = getSemanaIdParaFecha(nuevaFecha);
  if (semId) {
    semanaActivaId.value = semId;
    onCambioSemana();
  }
}

// ── Datos ──────────────────────────────────────────────────────────────────────
const registros  = ref([]);
const arrastres  = ref([]);
const unidades   = ref([]);

async function cargar() {
  try {
    const sId = semanaActivaId.value || getSemanaActualId();
    const sAntId = semanaAnteriorId.value || null;

    const [regs, arr, unis] = await Promise.all([
      api.getRegistrosDeSemana(sId).catch(() => []),
      sAntId ? api.getPendientesArrastre(sAntId).catch(() => []) : Promise.resolve([]),
      api.getUnidades().catch(() => [])
    ]);

    registros.value = Array.isArray(regs) ? regs : [];
    arrastres.value = Array.isArray(arr) ? arr : [];
    unidades.value  = Array.isArray(unis) ? unis : [];
  } catch (e) {
    console.error('[Captura] Error en cargar():', e);
  }
}

// ── Formulario ────────────────────────────────────────────────────────────────
const hoy = computed(() => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const s = semanaActualObj.value;
    if (!s || !s.fechaInicio || !s.fechaFin) return today;
    if (today >= s.fechaInicio && today <= s.fechaFin) return today;
    return s.fechaInicio;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
});

const isSubmitting    = ref(false);
const estadoGuardando = ref('');
const alertaDuplicado = ref(false);

const form = ref({
  fecha:                 '',
  numero_unidad:         '',
  nombre_conductor:      '',
  vueltas_dadas:         1,
  bitacora_tlaxiaco_putla: 0,
  bitacora_putla_tlaxiaco: 0,
  intermedios:           0,
  combustible:           0,
  gastos_imprevistos:    0,
  concepto_gastos:       ''
});

const errores = ref({
  fecha:            '',
  numero_unidad:    '',
  nombre_conductor: '',
  montos:           '',
  combustible:      ''
});

// Inicializar fecha del formulario cuando cambia la semana
watch(hoy, (val) => { if (val) form.value.fecha = val; }, { immediate: true });

// ── Dueño automático al seleccionar unidad ────────────────────────────────────
const duenoDeUnidadSeleccionada = computed(() => {
  if (!unidades.value || !form.value.numero_unidad) return null;
  const u = unidades.value.find(u => u && u.numero === form.value.numero_unidad);
  return u?.dueno || null;
});

const formDuenoNombre = computed(() => duenoDeUnidadSeleccionada.value?.nombre || '');

function onSeleccionarUnidad() {
  errores.value.numero_unidad = '';
  alertaDuplicado.value = false;
  verificarDuplicado();
}

function verificarDuplicado() {
  if (!form.value.numero_unidad || !form.value.fecha || !Array.isArray(registros.value)) return;
  alertaDuplicado.value = registros.value.some(
    r => r && r.numero_unidad === form.value.numero_unidad && r.fecha === form.value.fecha
  );
}

watch(() => form.value.fecha, verificarDuplicado);
watch(() => form.value.numero_unidad, verificarDuplicado);

// ── Cálculos automáticos ──────────────────────────────────────────────────────
const totalGeneradoCalc = computed(() =>
  (Number(form.value.bitacora_tlaxiaco_putla) || 0) +
  (Number(form.value.bitacora_putla_tlaxiaco) || 0) +
  (Number(form.value.intermedios) || 0)
);

const totalNetoCalc = computed(() =>
  totalGeneradoCalc.value -
  (Number(form.value.combustible) || 0) -
  (Number(form.value.gastos_imprevistos) || 0)
);

// ── Registros COMPLETADOS (para totales de semana) ────────────────────────────
const registrosCompletados = computed(() =>
  (registros.value || []).filter(r => r && r.estado === 'completado')
);

const totalSemanaGenerado    = computed(() => registrosCompletados.value.reduce((s, r) => s + (Number(r?.total_generado) || 0), 0));
const totalSemanaCombustible = computed(() => registrosCompletados.value.reduce((s, r) => s + (Number(r?.combustible)    || 0), 0));
const totalSemanaNeto        = computed(() => registrosCompletados.value.reduce((s, r) => s + (Number(r?.total_neto)     || 0), 0));

// ── Agrupación por día (orden cronológico ascendente por registro) ─────────────
const gruposPorDia = computed(() => {
  const mapa = {};
  (registros.value || []).forEach(r => {
    if (!r || !r.fecha) return;
    if (!mapa[r.fecha]) {
      mapa[r.fecha] = { fecha: r.fecha, registros: [], sumB1: 0, sumB2: 0, sumInter: 0, sumGenerado: 0, sumCombustible: 0, sumNeto: 0 };
    }
    mapa[r.fecha].registros.push(r);
    if (r.estado === 'completado') {
      mapa[r.fecha].sumB1         += (Number(r.bitacora_tlaxiaco_putla) || 0);
      mapa[r.fecha].sumB2         += (Number(r.bitacora_putla_tlaxiaco) || 0);
      mapa[r.fecha].sumInter      += (Number(r.intermedios)             || 0);
      mapa[r.fecha].sumGenerado   += (Number(r.total_generado)          || 0);
      mapa[r.fecha].sumCombustible += (Number(r.combustible)            || 0);
      mapa[r.fecha].sumNeto       += (Number(r.total_neto)              || 0);
    }
  });
  return Object.values(mapa).sort((a, b) => (a?.fecha || '').localeCompare(b?.fecha || ''));
});

// ── Formateo local de fecha ────────────────────────────────────────────────────
function formatFechaLargaLocal(f) { return formatFechaLarga(f); }

// ── Validación antes de guardar ───────────────────────────────────────────────
function validar(estado) {
  let ok = true;
  errores.value = { fecha: '', numero_unidad: '', nombre_conductor: '', montos: '', combustible: '' };

  const s = semanaActualObj.value;
  if (!form.value.fecha) {
    errores.value.fecha = 'La fecha es obligatoria.'; ok = false;
  } else if (s && s.fechaInicio && s.fechaFin && (form.value.fecha < s.fechaInicio || form.value.fecha > s.fechaFin)) {
    errores.value.fecha = `La fecha debe estar dentro de la ${s.label} (${formatFechaCorta(s.fechaInicio)} – ${formatFechaCorta(s.fechaFin)}).`; ok = false;
  }

  if (!form.value.numero_unidad.trim()) {
    errores.value.numero_unidad = 'Selecciona una unidad.'; ok = false;
  }

  if (!form.value.nombre_conductor.trim()) {
    errores.value.nombre_conductor = 'El nombre del conductor es obligatorio.'; ok = false;
  }

  const totalGen = totalGeneradoCalc.value;
  if (totalGen === 0 && estado === 'completado') {
    if (!confirm('⚠️ Todos los montos de pasaje son $0. ¿Deseas guardar de todas formas?')) {
      ok = false;
    }
  }

  if (totalNetoCalc.value < 0 && estado === 'completado') {
    if (!confirm(`⚠️ El Total Neto es NEGATIVO ($${totalNetoCalc.value.toFixed(2)}), lo que significa una pérdida. ¿Deseas guardar de todas formas?`)) {
      ok = false;
    }
  }

  return ok;
}

// ── Guardar ───────────────────────────────────────────────────────────────────
async function guardar(estado) {
  if (isSubmitting.value) return;
  if (!validar(estado)) return;

  isSubmitting.value    = true;
  estadoGuardando.value = estado;

  try {
    await api.guardarRegistro({
      ...form.value,
      semana_id:        semanaActivaId.value,
      numero_unidad:    form.value.numero_unidad.trim(),
      nombre_conductor: form.value.nombre_conductor.trim(),
      dueno_nombre:     formDuenoNombre.value,
      estado
    });
    await cargar();

    form.value.bitacora_tlaxiaco_putla = 0;
    form.value.bitacora_putla_tlaxiaco = 0;
    form.value.intermedios             = 0;
    form.value.combustible             = 0;
    form.value.gastos_imprevistos      = 0;
    form.value.concepto_gastos         = '';
    alertaDuplicado.value              = false;

  } catch (e) {
    alert('❌ Error al guardar: ' + e.message);
  } finally {
    setTimeout(() => { isSubmitting.value = false; estadoGuardando.value = ''; }, 350);
  }
}

// ── Arrastre ──────────────────────────────────────────────────────────────────
async function completarArrastre(reg) {
  if (!reg) return;
  if (!confirm(`¿Marcar como COMPLETADO y mover a la semana actual?\n\nUnidad: ${reg.numero_unidad} – ${reg.nombre_conductor}`)) return;
  await api.completarArrastre(reg.id, semanaActivaId.value);
  await cargar();
}

// ── Toggle estado (pendiente ↔ completado) ────────────────────────────────────
async function toggleEstado(reg) {
  if (!reg) return;
  const nuevoEstado = reg.estado === 'pendiente' ? 'completado' : 'pendiente';
  await api.guardarRegistro({ ...reg, estado: nuevoEstado });
  await cargar();
}

// ── Eliminar ──────────────────────────────────────────────────────────────────
async function eliminarRegistro(id) {
  if (!id) return;
  if (!confirm('¿Eliminar este registro? No se puede deshacer.')) return;
  await api.eliminarRegistro(id);
  await cargar();
}

// ── Vaciar semana ─────────────────────────────────────────────────────────────
async function vaciarSemana() {
  if (!confirm(`¿Vaciar TODOS los registros de la ${semanaActualObj.value?.label || 'semana seleccionada'}?\nEsta acción no se puede deshacer.`)) return;
  await api.borrarSemana(semanaActivaId.value);
  await cargar();
}

import { onUnmounted } from 'vue';

let liveInterval = null;

onMounted(async () => {
  await api.pullFullStoreFromCloud().catch(() => {});
  await cargar();
  // Sincronización continua de fondo para actualizar celulares y computadoras
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
/* ── SELECTOR DE SEMANA ────────────────────────────── */
.semana-selector-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 2px solid var(--accent-red);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 4px 12px rgba(220,38,38,0.1);
  flex-wrap: wrap;
}
.semana-icon { font-size: 2rem; }
.semana-info { flex: 1; min-width: 280px; }
.semana-label-small { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem; }
.semana-nav-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.btn-nav-week {
  background: #fef2f2;
  color: var(--accent-red);
  border: 1px solid #fca5a5;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-nav-week:hover { background: #fee2e2; border-color: var(--accent-red); }
.semana-select {
  flex: 1;
  min-width: 220px;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--accent-red);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  background: white;
  cursor: pointer;
}
.semana-select:focus { border-color: var(--accent-red); outline: none; }
.semana-cal-picker {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
}
.cal-picker-label { font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
.cal-input-picker {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}
.rango-chip {
  background: #fef2f2;
  color: #dc2626;
  font-weight: 700;
  font-size: 0.83rem;
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  border: 1px solid #fca5a5;
  white-space: nowrap;
}

/* ── ARRASTRE ──────────────────────────────────────── */
.arrastre-card {
  border-left: 5px solid #d97706 !important;
  background: #fffbeb !important;
}
.arrastre-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  color: #92400e;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.arrastre-count {
  background: #d97706;
  color: white;
  font-size: 0.78rem;
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
}
.arrastre-desc { font-size: 0.85rem; color: #92400e; margin-bottom: 1rem; }
.fila-arrastre { background: #fef9c3 !important; }

/* ── PANEL TOTALES ─────────────────────────────────── */
.totales-panel {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 5px solid #dc2626;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}
.tp-title { font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #dc2626; margin-bottom: 0.75rem; letter-spacing: 0.04em; }
.tp-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.tp-item  { display: flex; flex-direction: column; gap: 0.2rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.7rem 1rem; }
.tp-neg   { border-color: #fca5a5; background: #fef2f2; }
.tp-label { font-size: 0.74rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.tp-value { font-size: 1.2rem; font-weight: 900; }
.tp-value.green  { color: #059669; }
.tp-value.orange { color: #d97706; }
.tp-value.red    { color: #dc2626; }
.tp-value.blue   { color: #0284c7; }

/* ── PLANILLA POR DÍA ──────────────────────────────── */
.dia-card     { margin-bottom: 2rem; }
.sheet-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.85rem; border-bottom: 2px solid var(--accent-red); padding-bottom: 0.75rem; }
.sheet-date-box   { display: flex; align-items: center; border: 2px solid #0f172a; border-radius: 4px; overflow: hidden; }
.sheet-date-label { background: #e2e8f0; font-weight: 800; padding: 0.4rem 0.85rem; border-right: 2px solid #0f172a; font-size: 0.85rem; }
.sheet-date-value { padding: 0.4rem 1rem; font-size: 0.9rem; font-weight: 800; }
.sheet-day-totals { display: flex; gap: 1rem; font-size: 0.85rem; color: #475569; flex-wrap: wrap; }
.neg-text { color: #dc2626; font-weight: 800; }
.pos-text { color: #059669; font-weight: 800; }

/* ── TABLA ─────────────────────────────────────────── */
.table-sheet th { background: #f1f5f9; color: #0f172a; font-weight: 800; border: 1px solid #cbd5e1; text-align: center; font-size: 0.74rem; }
.row-num { text-align: center; color: #94a3b8; font-size: 0.78rem; font-weight: 700; }
.subtotal-row { background: #e2e8f0; font-weight: 800; }
.subtotal-label { font-weight: 800; }
.subtotal-val   { font-weight: 800; }
.fila-pendiente { background: #fffbeb !important; }

/* ── BOTONES ───────────────────────────────────────── */
.btn-delete     { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
.btn-delete:hover{ background: #fee2e2; }
.btn-success-sm { background: #d1fae5; color: #059669; border: 1px solid #6ee7b7; font-size: 0.8rem; }
.btn-success-sm:hover{ background: #a7f3d0; }
.btn-badge { border: none; cursor: pointer; transition: transform 0.1s; }
.btn-badge:hover{ transform: scale(1.05); }

/* ── ACTION CELL ───────────────────────────────────── */
.action-cell { display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; }

/* ── SUMMARY BOXES ─────────────────────────────────── */
.summary-box { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-radius: 8px; padding: 0.85rem 1.25rem; margin-top: 0.75rem; }
.summary-box.generado { background: #f0fdf4; border: 1px solid #86efac; }
.summary-box.neto     { background: #eff6ff; border: 1px solid #93c5fd; }
.summary-box.neto-negativo { background: #fef2f2; border: 1px solid #fca5a5; }
.summary-label  { font-weight: 700; font-size: 0.9rem; }
.summary-subtext{ font-size: 0.78rem; color: #64748b; }
.summary-value  { font-size: 1.35rem; font-weight: 900; }
.summary-value.green{ color: #059669; }
.summary-value.red  { color: #dc2626; }

/* ── FORM HELPERS ──────────────────────────────────── */
.form-title { color: var(--accent-red); font-size: 1.15rem; margin: 0 0 0.2rem; }
.form-sub   { font-size: 0.83rem; color: var(--text-muted); margin: 0; }
.req        { color: #dc2626; }
.input-error{ border-color: #dc2626 !important; box-shadow: 0 0 0 2px rgba(220,38,38,0.15) !important; }
.error-msg  { color: #dc2626; font-size: 0.8rem; margin-top: 0.2rem; display: block; }
.hint-link  { color: #d97706; font-size: 0.82rem; margin-top: 0.25rem; display: block; text-decoration: underline; }
.alert-warn { background: #fef2f2; border: 1px solid #fca5a5; border-left: 4px solid #dc2626; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.9rem; color: #991b1b; margin-top: 0.75rem; }

.form-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
.empty-state  { padding: 2.5rem; color: #64748b; }

/* ── CHIPS ─────────────────────────────────────────── */
.chip        { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 20px; font-size: 0.72rem; font-weight: 800; }
.chip-orange { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }

/* ── DUEÑO INFO ────────────────────────────────────── */
.dueno-info { display: flex; align-items: center; gap: 0.5rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 0.5rem 0.85rem; font-size: 0.87rem; color: #0369a1; margin-top: 0.5rem; }
.dueno-icon { font-size: 1.1rem; }

/* ── GRIDS ─────────────────────────────────────────── */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
.text-right { text-align: right; font-family: monospace; }
.text-bold  { font-weight: 700; }
.text-center{ text-align: center; }

@media (max-width: 1024px) { .tp-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px)  {
  .form-actions-grid, .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .tp-grid { grid-template-columns: 1fr 1fr; }
  .sheet-day-totals { flex-direction: column; gap: 0.25rem; }
}
</style>
