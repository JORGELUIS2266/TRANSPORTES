<template>
  <div class="liquidacion-container">

    <!-- ── Acceso restringido ──────────────────────────── -->
    <div v-if="!auth.isAdmin" class="acceso-denegado">
      <div class="denegado-icon">🔒</div>
      <h2>Acceso Restringido</h2>
      <p>Solo el <strong>Administrador</strong> puede ver y generar la Liquidación de Socios.</p>
    </div>

    <template v-else>

      <!-- ── Banner Oficial ───────────────────────────── -->
      <div class="brand-hero-card">
        <img src="/logo_tierra_de_humo.jpg" alt="Logo TH" class="hero-logo-img" />
        <div class="hero-text-box">
          <h2 class="hero-company-title">TRANSPORTE TIERRA DE HUMO</h2>
          <span class="hero-company-corp">S.C. DE R.L. DE C.V.</span>
          <div class="hero-route-tag">
            <span>PASAJE · PAQUETERÍA · TURISMO</span>
            <strong class="route-pill">Ruta: Tlaxiaco ⇄ Putla</strong>
          </div>
        </div>
        <div class="hero-lock-badge">🔒 Solo Administrador</div>
      </div>

      <!-- ── Selector de Semana ───────────────────────── -->
      <div class="card semana-selector-card">
        <div class="semana-header-row">
          <div>
            <h3 class="liq-title">💰 Liquidación / Reparto Semanal de Socios</h3>
            <p class="liq-subtitle">
              Distribución proporcional por vueltas por unidad menos cuota semanal.
            </p>
          </div>
          <div class="semana-nav-row">
            <button @click="irSemanaAnterior" class="btn-nav-week">◀</button>
            <select v-model="semanaId" @change="cargar" class="semana-select">
              <option v-for="s in semanasDisponibles" :key="s.id" :value="s.id">
                {{ s.label }}
              </option>
            </select>
            <button @click="irSemanaSiguiente" class="btn-nav-week">▶</button>
          </div>
        </div>
      </div>

      <!-- ── Ingresos Extras ──────────────────────────── -->
      <div class="card extras-card">
        <div class="extras-header">
          <div>
            <span class="extras-title">➕ Ingresos Extras de la Semana</span>
            <small class="extras-subtitle">
              Paquetería, viajes especiales, turismo u otros ingresos adicionales que se suman al total.
            </small>
          </div>
          <button @click="agregarExtra" class="btn btn-sm btn-add-extra">+ Agregar Extra</button>
        </div>

        <div v-if="extras.length > 0" class="extras-list">
          <div v-for="(ex, idx) in extras" :key="idx" class="extra-item">
            <input
              type="text"
              v-model="ex.concepto"
              class="form-input extra-input-concepto"
              placeholder="Concepto (ej. Paquetería, Turismo...)"
            />
            <div class="extra-input-monto-wrap">
              <span class="extra-prefix">$</span>
              <input
                type="number"
                v-model.number="ex.monto"
                class="form-input extra-input-monto"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <button @click="eliminarExtra(idx)" class="btn-remove-extra" title="Eliminar extra">✕</button>
          </div>
        </div>

        <div v-else class="extras-empty">
          Sin extras esta semana — solo se usará el total de bitácora.
        </div>

        <!-- Totales de la semana -->
        <div class="totales-resumen-bar">
          <div class="total-item">
            <span class="total-label">📋 Total Neto de la semana (generado − combustible):</span>
            <strong class="total-value">${{ totalBitacora.toFixed(2) }}</strong>
          </div>
          <div class="total-item" v-if="totalExtras > 0">
            <span class="total-label">➕ Total Extras:</span>
            <strong class="total-value text-green">+${{ totalExtras.toFixed(2) }}</strong>
          </div>
          <div class="total-item total-gran">
            <span class="total-label">💰 Gran Total (Bitácora + Extras):</span>
            <strong class="total-value text-red">${{ granTotal.toFixed(2) }}</strong>
          </div>
          <div class="total-item">
            <span class="total-label">🔄 Total de Vueltas de la Semana:</span>
            <strong class="total-value">{{ totalVueltas }}</strong>
          </div>
          <div class="total-item total-cant" v-if="totalVueltas > 0">
            <span class="total-label">🧮 Cantidad por Vuelta (Gran Total ÷ Vueltas):</span>
            <strong class="total-value text-blue">${{ cantidadPorVuelta.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

      <!-- ── Cuota Semanal ────────────────────────────── -->
      <div class="card cuota-card">
        <div class="cuota-row">
          <div class="cuota-info">
            <span class="cuota-label">💳 Cuota Semanal por Unidad (misma para todos los socios):</span>
            <small class="cuota-sub">Esta cuota se descuenta del total de cada unidad para obtener su ganancia neta.</small>
          </div>
          <div class="cuota-input-wrap">
            <span class="cuota-prefix">$</span>
            <input
              type="number"
              v-model.number="cuotaSemanal"
              class="form-input cuota-input"
              min="0"
              step="50"
            />
          </div>
        </div>
      </div>

      <!-- ── Sin datos ────────────────────────────────── -->
      <div v-if="registros.length === 0" class="empty-state-card">
        <div style="font-size:2.5rem;">📋</div>
        <p><strong>No hay vueltas completadas en la {{ semanaObj?.label || 'semana seleccionada' }}.</strong></p>
        <p style="font-size:0.82rem; color:#64748b;">Selecciona otra semana o ve a Captura para registrar vueltas.</p>
      </div>

      <!-- ── Tabla de Liquidación ─────────────────────── -->
      <div v-else class="card tabla-card">
        <div class="tabla-header-row">
          <div>
            <h3 class="tabla-title">
              📊 Planilla de Liquidación — {{ semanaObj?.label || '' }}
            </h3>
            <small style="color:#64748b;">
              Solo aparecen las unidades con al menos 1 vuelta completada en esta semana.
            </small>
          </div>
          <button @click="exportarPDF" class="btn btn-red btn-export-pdf">
            📄 Exportar PDF
          </button>
        </div>

        <!-- Tabla principal -->
        <div class="table-responsive" id="tabla-liquidacion-print">
          <table class="table table-liq">
            <thead>
              <tr>
                <th class="th-num"># UNIDAD</th>
                <th>NOMBRE DEL DUEÑO</th>
                <th class="th-center">VUELTAS</th>
                <th class="th-right">TOTAL</th>
                <th class="th-right">CUOTA SEMANAL</th>
                <th class="th-right th-neto">TOTAL NETO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in filasDeLiquidacion" :key="fila.unidadId">
                <td class="td-num">{{ fila.numero }}</td>
                <td class="td-nombre">{{ fila.dueno }}</td>
                <td class="td-center td-vueltas">{{ fila.vueltas }}</td>
                <td class="td-right td-total">${{ fila.total.toLocaleString('es-MX') }}</td>
                <td class="td-right td-cuota">${{ cuotaSemanal.toLocaleString('es-MX') }}</td>
                <td class="td-right td-neto" :class="fila.neto < 0 ? 'neto-negativo' : 'neto-positivo'">
                  ${{ fila.neto.toLocaleString('es-MX') }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="tfoot-totales">
                <td colspan="2" class="tfoot-label">TOTALES</td>
                <td class="td-center tfoot-val">{{ totalVueltas }}</td>
                <td class="td-right tfoot-val">${{ totalTabla.toLocaleString('es-MX') }}</td>
                <td class="td-right tfoot-val">${{ (cuotaSemanal * filasDeLiquidacion.length).toLocaleString('es-MX') }}</td>
                <td class="td-right tfoot-val neto-positivo">${{ netoTabla.toLocaleString('es-MX') }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Pie de cálculo (igual que en el cuaderno) -->
        <div class="pie-calculo">
          <div class="pie-item">
            <span class="pie-label">Total Neto de vueltas:</span>
            <strong class="pie-val">${{ granTotal.toFixed(2) }}</strong>
          </div>
          <div class="pie-item">
            <span class="pie-label">${{ granTotal.toFixed(2) }} ÷ {{ totalVueltas }} vueltas:</span>
            <strong class="pie-val text-blue">${{ cantidadPorVuelta.toFixed(2) }} por vuelta</strong>
          </div>
          <div class="pie-item">
            <span class="pie-label">Cuota semanal aplicada:</span>
            <strong class="pie-val text-red">${{ cuotaSemanal.toLocaleString('es-MX') }}</strong>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore }  from '../stores/auth';
import { api }           from '../services/api';
import jsPDF             from 'jspdf';
import 'jspdf-autotable';
import {
  getSemanasSelectRecentFirst,
  getSemanaActualId,
  getSemanaAnteriorId,
  getSemanaSiguienteId,
  formatFechaLarga
} from '../utils/semanas';

const auth = useAuthStore();

// ── Semanas ────────────────────────────────────────────────────────────────────
const semanasDisponibles = ref(getSemanasSelectRecentFirst() || []);
const semanaId  = ref(getSemanaActualId());
const semanaObj = computed(() =>
  semanasDisponibles.value.find(s => s && s.id === semanaId.value) || null
);

function irSemanaAnterior() {
  const ant = getSemanaAnteriorId(semanaId.value);
  if (ant) { semanaId.value = ant; cargar(); }
}
function irSemanaSiguiente() {
  const sig = getSemanaSiguienteId(semanaId.value);
  if (sig) { semanaId.value = sig; cargar(); }
}

// ── Datos de la semana ─────────────────────────────────────────────────────────
const registros    = ref([]);
const unidades     = ref([]);
const extras       = ref([]);
const cuotaSemanal = ref(1400);

async function cargar() {
  if (!auth.isAdmin) return;
  try {
    const [regs, unis] = await Promise.all([
      api.getRegistrosDeSemana(semanaId.value).catch(() => []),
      api.getUnidades().catch(() => [])
    ]);
    // Solo las COMPLETADAS cuentan para el reparto
    registros.value = (Array.isArray(regs) ? regs : []).filter(r => r && r.estado === 'completado');
    unidades.value  = Array.isArray(unis) ? unis : [];
  } catch (e) {
    console.error('[Liquidacion] Error cargando:', e);
    registros.value = [];
    unidades.value  = [];
  }
}

// ── Extras ─────────────────────────────────────────────────────────────────────
function agregarExtra() {
  extras.value.push({ concepto: '', monto: 0 });
}
function eliminarExtra(idx) {
  extras.value.splice(idx, 1);
}

// ── Cálculos maestros ──────────────────────────────────────────────────────────

// Total de bitácora = suma de TOTAL NETO (ganancia real: generado − combustible − gastos)
// NO se usa total_generado porque ese es el bruto antes de descontar combustible
const totalBitacora = computed(() =>
  registros.value.reduce((acc, r) => acc + (Number(r.total_neto) || 0), 0)
);

// Total de extras válidos
const totalExtras = computed(() =>
  extras.value.reduce((acc, ex) => acc + (Number(ex.monto) || 0), 0)
);

// Gran Total = Bitácora + Extras
const granTotal = computed(() => totalBitacora.value + totalExtras.value);

// Total de vueltas completadas de la semana
const totalVueltas = computed(() => registros.value.length);

// Cantidad por vuelta con 2 decimales exactos
const cantidadPorVuelta = computed(() => {
  if (totalVueltas.value === 0) return 0;
  return Math.round((granTotal.value / totalVueltas.value) * 100) / 100;
});

// ── Filas de liquidación por unidad ───────────────────────────────────────────
const filasDeLiquidacion = computed(() => {
  if (registros.value.length === 0) return [];

  // Agrupar registros por número de unidad
  const mapa = {};
  registros.value.forEach(r => {
    const num = (r.numero_unidad || '').trim();
    if (!num) return;
    if (!mapa[num]) {
      // Buscar dueño en el catálogo de unidades
      const u = unidades.value.find(u => u && u.numero === num);
      const dueno = u?.dueno?.nombre || r.dueno_nombre || 'Sin dueño registrado';
      mapa[num] = { numero: num, dueno, vueltas: 0 };
    }
    mapa[num].vueltas++;
  });

  // Calcular total y neto para cada unidad
  return Object.values(mapa)
    .sort((a, b) => {
      // Ordenar numéricamente por número de unidad
      return parseInt(a.numero, 10) - parseInt(b.numero, 10);
    })
    .map(fila => {
      // Total = Math.floor(vueltas × cantidadPorVuelta) — truncado, sin redondear
      const total = Math.floor(fila.vueltas * cantidadPorVuelta.value);
      const neto  = total - cuotaSemanal.value;
      return { ...fila, total, neto };
    });
});

// Totales del pie de tabla
const totalTabla = computed(() => filasDeLiquidacion.value.reduce((acc, f) => acc + f.total, 0));
const netoTabla  = computed(() => filasDeLiquidacion.value.reduce((acc, f) => acc + f.neto, 0));

// ── Exportar PDF ──────────────────────────────────────────────────────────────
function exportarPDF() {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW    = doc.internal.pageSize.getWidth();
  const label = semanaObj.value?.label || semanaId.value;

  // Encabezado oficial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 0, 0);
  doc.text('TRANSPORTE TIERRA DE HUMO S.C. DE R.L. DE C.V.', PW / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('PASAJE - PAQUETERÍA - TURISMO  |  RUTA: TLAXIACO ⇄ PUTLA', PW / 2, 17, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`LIQUIDACIÓN / REPARTO SEMANAL DE SOCIOS`, PW / 2, 24, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(label, PW / 2, 29, { align: 'center' });

  // Tabla principal con autotable
  const head = [['# UNIDAD', 'NOMBRE DEL DUEÑO', 'VUELTAS', 'TOTAL', 'CUOTA SEMANAL', 'TOTAL NETO']];
  const body = filasDeLiquidacion.value.map(f => [
    f.numero,
    f.dueno,
    f.vueltas,
    `$${f.total.toLocaleString('es-MX')}`,
    `$${cuotaSemanal.value.toLocaleString('es-MX')}`,
    `$${f.neto.toLocaleString('es-MX')}`
  ]);

  // Fila de totales
  body.push([
    { content: 'TOTALES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: String(totalVueltas.value), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: `$${totalTabla.value.toLocaleString('es-MX')}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: `$${(cuotaSemanal.value * filasDeLiquidacion.value.length).toLocaleString('es-MX')}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
    { content: `$${netoTabla.value.toLocaleString('es-MX')}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }
  ]);

  doc.autoTable({
    head,
    body,
    startY: 34,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18 },
      1: { cellWidth: 55 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Pie de cálculo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Vueltas totales: ${totalVueltas.value}`, 14, finalY);
  doc.text(`Total Neto $${granTotal.value.toFixed(2)} ÷ ${totalVueltas.value} vueltas = $${cantidadPorVuelta.value.toFixed(2)} por vuelta`, 14, finalY + 6);
  doc.text(`Cuota semanal aplicada: $${cuotaSemanal.value.toLocaleString('es-MX')} por unidad`, 14, finalY + 12);

  if (extras.value.some(ex => ex.monto > 0)) {
    doc.text(`Extras: $${totalExtras.value.toFixed(2)}`, 14, finalY + 18);
  }

  // Línea de firma
  const firmaY = finalY + 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Firma del Administrador: ______________________________', 14, firmaY);
  doc.text(`Fecha de impresión: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`, PW - 14, firmaY, { align: 'right' });

  doc.save(`Liquidacion_Socios_${label.replace(/\s/g, '_')}.pdf`);
}

onMounted(() => {
  if (auth.isAdmin) cargar();
});
</script>

<style scoped>
.liquidacion-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* ── Acceso Denegado ──────────────────────────────── */
.acceso-denegado {
  text-align: center;
  background: #fef2f2;
  border: 2px solid #fca5a5;
  border-radius: 14px;
  padding: 3rem 1rem;
  margin-top: 2rem;
}
.denegado-icon { font-size: 3.5rem; margin-bottom: 0.75rem; }
.acceso-denegado h2 { color: #dc2626; margin: 0 0 0.5rem; }
.acceso-denegado p  { color: #64748b; font-size: 0.9rem; }

/* ── Brand Hero ───────────────────────────────────── */
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
.hero-logo-img       { width: 150px; height: auto; max-height: 55px; object-fit: contain; }
.hero-text-box       { display: flex; flex-direction: column; flex: 1; }
.hero-company-title  { margin: 0; font-size: 1.2rem; font-weight: 900; color: #dc2626; }
.hero-company-corp   { font-size: 0.76rem; font-weight: 800; color: #0f172a; letter-spacing: 0.06em; }
.hero-route-tag      { display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem; color: #64748b; margin-top: 0.2rem; }
.route-pill          { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; padding: 0.08rem 0.4rem; border-radius: 5px; font-weight: 800; }
.hero-lock-badge     { background: #1e293b; color: #f1f5f9; font-size: 0.72rem; font-weight: 800; padding: 0.3rem 0.65rem; border-radius: 20px; white-space: nowrap; }

/* ── Semana Selector ──────────────────────────────── */
.semana-selector-card { margin-bottom: 1.25rem; }
.semana-header-row    { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
.liq-title    { margin: 0; font-size: 1.15rem; font-weight: 900; color: #dc2626; }
.liq-subtitle { font-size: 0.8rem; color: #64748b; margin: 0.2rem 0 0; }
.semana-nav-row { display: flex; gap: 0.5rem; align-items: center; }

.btn-nav-week {
  background: #f1f5f9; border: 1px solid #cbd5e1;
  font-weight: 900; font-size: 0.9rem;
  padding: 0.35rem 0.75rem; border-radius: 6px;
  cursor: pointer; transition: all 0.15s;
}
.btn-nav-week:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

.semana-select {
  border: 2px solid #dc2626; border-radius: 8px;
  font-weight: 800; font-size: 0.88rem;
  padding: 0.4rem 0.75rem; color: #dc2626;
  background: #fff5f5; min-width: 220px;
}

/* ── Extras ───────────────────────────────────────── */
.extras-card      { margin-bottom: 1.25rem; }
.extras-header    { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
.extras-title     { font-size: 0.9rem; font-weight: 900; color: #0f172a; display: block; }
.extras-subtitle  { font-size: 0.75rem; color: #64748b; }
.btn-add-extra    { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; font-weight: 800; font-size: 0.78rem; }

.extras-list      { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
.extra-item       { display: flex; gap: 0.5rem; align-items: center; }
.extra-input-concepto { flex: 1; }
.extra-input-monto-wrap { display: flex; align-items: center; gap: 0; }
.extra-prefix     { background: #f1f5f9; border: 1px solid #cbd5e1; border-right: none; padding: 0.45rem 0.5rem; border-radius: 6px 0 0 6px; font-weight: 800; color: #334155; font-size: 0.88rem; }
.extra-input-monto { width: 120px; border-radius: 0 6px 6px 0; text-align: right; font-weight: 800; }
.btn-remove-extra { background: #fee2e2; color: #dc2626; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 0.8rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }

.extras-empty { font-size: 0.82rem; color: #94a3b8; text-align: center; padding: 0.75rem; background: #f8fafc; border-radius: 6px; margin-bottom: 0.75rem; }

/* ── Totales Resumen ──────────────────────────────── */
.totales-resumen-bar {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
.total-item       { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
.total-gran       { background: #fff5f5; border-radius: 6px; padding: 0.4rem 0.75rem; border: 1px solid #fca5a5; }
.total-cant       { background: #eff6ff; border-radius: 6px; padding: 0.4rem 0.75rem; border: 1px solid #bfdbfe; }
.total-label      { color: #334155; font-weight: 700; }
.total-value      { font-weight: 900; font-size: 1rem; }
.text-green       { color: #16a34a; }
.text-red         { color: #dc2626; }
.text-blue        { color: #1d4ed8; }

/* ── Cuota Semanal ────────────────────────────────── */
.cuota-card       { margin-bottom: 1.25rem; }
.cuota-row        { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
.cuota-info       { display: flex; flex-direction: column; }
.cuota-label      { font-size: 0.9rem; font-weight: 900; color: #0f172a; }
.cuota-sub        { font-size: 0.74rem; color: #64748b; margin-top: 0.2rem; }
.cuota-input-wrap { display: flex; align-items: center; gap: 0; }
.cuota-prefix     { background: #fee2e2; border: 2px solid #dc2626; border-right: none; padding: 0.5rem 0.65rem; border-radius: 8px 0 0 8px; font-weight: 900; color: #dc2626; font-size: 1rem; }
.cuota-input      { width: 120px; border-radius: 0 8px 8px 0; border: 2px solid #dc2626; font-weight: 900; font-size: 1rem; text-align: right; color: #dc2626; }

/* ── Empty State ──────────────────────────────────── */
.empty-state-card { text-align: center; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2.5rem 1rem; }

/* ── Tabla de Liquidación ─────────────────────────── */
.tabla-card       { margin-bottom: 1.25rem; }
.tabla-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
.tabla-title      { margin: 0; font-size: 1.05rem; font-weight: 900; color: #0f172a; }
.btn-export-pdf   { font-size: 0.85rem; font-weight: 900; padding: 0.5rem 1.1rem; }

.table-liq { border-collapse: collapse; width: 100%; font-size: 0.88rem; }

.table-liq thead th {
  background: #dc2626;
  color: #ffffff;
  font-weight: 900;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.65rem 0.85rem;
  border: none;
}

.table-liq tbody tr:nth-child(even) { background: #f8fafc; }
.table-liq tbody tr:hover { background: #fff5f5; }
.table-liq tbody td { padding: 0.65rem 0.85rem; border-bottom: 1px solid #e2e8f0; }

.th-center, .td-center { text-align: center !important; }
.th-right, .td-right   { text-align: right !important; }
.th-neto               { background: #b91c1c !important; }

.td-num    { font-weight: 900; color: #0f172a; text-align: center; font-size: 1rem; }
.td-nombre { font-weight: 800; color: #0f172a; text-transform: uppercase; }
.td-vueltas { font-weight: 900; font-size: 1rem; text-align: center; }
.td-total  { font-weight: 800; font-family: monospace; }
.td-cuota  { color: #d97706; font-weight: 700; font-family: monospace; }
.td-neto   { font-weight: 900; font-size: 0.95rem; font-family: monospace; }

.neto-positivo { color: #16a34a; }
.neto-negativo { color: #dc2626; }

.tfoot-totales { background: #f1f5f9; }
.tfoot-label   { font-weight: 900; font-size: 0.82rem; text-transform: uppercase; color: #0f172a; padding: 0.75rem 0.85rem; }
.tfoot-val     { font-weight: 900; font-size: 0.9rem; padding: 0.75rem 0.85rem; font-family: monospace; }

/* ── Pie de cálculo ───────────────────────────────── */
.pie-calculo {
  background: #f8fafc;
  border-top: 2px solid #e2e8f0;
  padding: 0.85rem 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  font-size: 0.82rem;
}
.pie-item  { display: flex; gap: 0.35rem; align-items: center; }
.pie-label { color: #64748b; font-weight: 700; }
.pie-val   { font-weight: 900; color: #0f172a; }

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .brand-hero-card  { flex-direction: column; text-align: center; align-items: center; }
  .semana-header-row { flex-direction: column; align-items: stretch; }
  .cuota-row        { flex-direction: column; align-items: flex-start; }
  .tabla-header-row { flex-direction: column; align-items: stretch; }
  .btn-export-pdf   { width: 100%; }
}
</style>
