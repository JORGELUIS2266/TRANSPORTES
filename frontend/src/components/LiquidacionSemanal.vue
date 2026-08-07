<template>
  <div class="card liquidacion-card">
    <!-- Encabezado con Botones de Acción -->
    <div class="card-header">
      <div>
        <h2 class="card-title">💰 Repartición y Liquidación Semanal por Socio</h2>
        <p class="subtitle">Cálculo exacto del algoritmo con deducciones y pago neto final</p>
      </div>

      <div class="action-buttons">
        <button @click="generarPDF" class="btn btn-secondary btn-sm">
          📄 PDF
        </button>
        <button @click="generarExcel" class="btn btn-secondary btn-sm">
          📊 Excel (.xlsx)
        </button>
        <button @click="abrirWhatsAppModal" class="btn btn-success btn-sm">
          📱 WhatsApp
        </button>
        <button 
          v-if="authStore.isAdmin" 
          @click="cerrarSemana" 
          class="btn btn-danger btn-sm"
        >
          🔒 Cerrar Semana
        </button>
      </div>
    </div>

    <!-- Parámetros de Algoritmo -->
    <div class="params-bar" v-if="authStore.isAdmin">
      <div class="param-item">
        <label>Cuota Fija Administracion Semanal por Unidad ($):</label>
        <input 
          type="number" 
          v-model.number="transportStore.cuotaAdminSemanal" 
          class="form-input input-inline"
        />
      </div>
      <div class="param-badge">
        Valor por Vuelta Calculado: <strong>$ {{ res.valorPorVuelta.toFixed(2) }}</strong>
      </div>
    </div>

    <!-- Tabla Detallada de Liquidación por Dueño -->
    <div v-for="dueno in res.liquidacionesPorDueno" :key="dueno.dueno_id" class="dueno-block">
      <div class="dueno-header">
        <div>
          <h3 class="dueno-name">👤 Socio: {{ dueno.nombre_dueno }}</h3>
          <span class="subtext">Teléfono: {{ dueno.telefono || 'Sin registro' }}</span>
        </div>
        <div class="neto-badge">
          Pago Neto a Entregar: <strong>$ {{ dueno.pago_neto_final_dueno.toFixed(2) }}</strong>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Placas</th>
              <th>Vueltas Semana</th>
              <th>Ingreso Bruto (Vueltas × Valor)</th>
              <th>Cuota Admin</th>
              <th>Gastos Imprevistos</th>
              <th>Ingreso Neto Unidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in dueno.unidades" :key="u.unidad_id">
              <td><strong>{{ u.numero_unidad }}</strong></td>
              <td>{{ u.placas }}</td>
              <td class="text-center font-bold">{{ u.vueltas_semana }}</td>
              <td class="text-right">$ {{ u.ingreso_bruto_unidad.toFixed(2) }}</td>
              <td class="text-right text-muted">- $ {{ u.cuota_admin_unidad.toFixed(2) }}</td>
              <td class="text-right text-warning">- $ {{ u.gastos_imprevistos_total.toFixed(2) }}</td>
              <td class="text-right font-bold" :class="u.ingreso_neto_unidad < 0 ? 'text-danger' : 'text-success'">
                $ {{ u.ingreso_neto_unidad.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Resumen de Deducciones y Préstamos del Socio -->
      <div class="dueno-summary-grid">
        <div class="summary-item">
          <span>Ingreso Bruto Acumulado:</span>
          <strong>$ {{ dueno.ingreso_bruto_dueno.toFixed(2) }}</strong>
        </div>
        <div class="summary-item">
          <span>(-) Cuota Administración:</span>
          <strong class="text-muted">$ {{ dueno.cuota_admin_dueno.toFixed(2) }}</strong>
        </div>
        <div class="summary-item">
          <span>(-) Imprevistos / Mecánica:</span>
          <strong class="text-warning">$ {{ dueno.gastos_imprevistos_dueno.toFixed(2) }}</strong>
        </div>
        <div class="summary-item" v-if="dueno.descuento_prestamos_dueno > 0">
          <span>(-) Préstamos / Anticipos:</span>
          <strong class="text-danger">$ {{ dueno.descuento_prestamos_dueno.toFixed(2) }}</strong>
        </div>
      </div>
    </div>

    <!-- Modal Previsualizador de Mensaje WhatsApp -->
    <div v-if="mostrarModalWA" class="modal-backdrop" @click.self="mostrarModalWA = false">
      <div class="modal-card">
        <h3>📱 Vista Previa Mensaje WhatsApp</h3>
        <textarea v-model="mensajeWA" class="wa-textarea" rows="12"></textarea>
        <div class="modal-actions">
          <button @click="enviarWA" class="btn btn-success btn-full">
            🚀 Abrir en WhatsApp
          </button>
          <button @click="mostrarModalWA = false" class="btn btn-secondary btn-full">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTransportStore } from '../stores/transport';
import { useAuthStore } from '../stores/auth';
import { exportarPDF } from '../utils/pdfExport';
import { exportarExcel } from '../utils/excelExport';
import { generarMensajeWhatsApp, enviarPorWhatsApp } from '../utils/whatsapp';

const transportStore = useTransportStore();
const authStore = useAuthStore();

const res = computed(() => transportStore.liquidacionSemanal);

const mostrarModalWA = ref(false);
const mensajeWA = ref('');

function generarPDF() {
  exportarPDF({
    fechaInicio: transportStore.fechaInicio,
    fechaFin: transportStore.fechaFin,
    registrosDiarios: transportStore.registrosDiarios,
    resultadoLiquidacion: res.value
  });
}

function generarExcel() {
  exportarExcel({
    fechaInicio: transportStore.fechaInicio,
    fechaFin: transportStore.fechaFin,
    registrosDiarios: transportStore.registrosDiarios,
    resultadoLiquidacion: res.value
  });
}

function abrirWhatsAppModal() {
  mensajeWA.value = generarMensajeWhatsApp({
    fechaInicio: transportStore.fechaInicio,
    fechaFin: transportStore.fechaFin,
    resultadoLiquidacion: res.value
  });
  mostrarModalWA.value = true;
}

function enviarWA() {
  enviarPorWhatsApp({ mensaje: mensajeWA.value });
  mostrarModalWA.value = false;
}

function cerrarSemana() {
  if (confirm('¿Estás seguro de cerrar la semana? Esto congelará las liquidaciones actuales para archivo y contabilidad.')) {
    abrirWhatsAppModal();
    alert('✅ Semana cerrada. Se ha generado el informe listo para enviar a los socios por WhatsApp.');
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.params-bar {
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.input-inline {
  width: 120px;
  padding: 0.35rem 0.6rem;
  text-align: right;
  font-family: monospace;
}

.dueno-block {
  background: #0f172a;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.dueno-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.dueno-name {
  font-size: 1.15rem;
  color: var(--text-main);
}

.neto-badge {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 1rem;
}

.dueno-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  background: #1e293b;
  padding: 0.85rem;
  border-radius: var(--radius-sm);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.text-right { text-align: right; font-family: monospace; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
.text-muted { color: var(--text-muted); }
.text-warning { color: var(--warning); }
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }

/* Modal WA */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  width: 90%;
  max-width: 600px;
}

.wa-textarea {
  width: 100%;
  background: var(--bg-dark);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1rem;
  font-family: monospace;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}
</style>
