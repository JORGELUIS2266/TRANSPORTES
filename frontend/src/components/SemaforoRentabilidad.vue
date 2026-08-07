<template>
  <div class="semaforo-container">
    <!-- Stat Cards / Métricas Clave -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon primary">🔄</div>
        <div>
          <div class="stat-value">{{ semaforoData.totalVueltasGlobal }}</div>
          <div class="stat-label">Vueltas Totales Ruta</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon success">💵</div>
        <div>
          <div class="stat-value">$ {{ semaforoData.totalGeneradoGlobal.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</div>
          <div class="stat-label">Fondo Total Generado</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">⛽</div>
        <div>
          <div class="stat-value">$ {{ totalCombustibleGlobal.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</div>
          <div class="stat-label">Gasto en Combustible</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon info">📈</div>
        <div>
          <div class="stat-value">$ {{ semaforoData.valorPorVuelta.toFixed(2) }}</div>
          <div class="stat-label">Valor por Vuelta</div>
        </div>
      </div>
    </div>

    <!-- Semáforo de Rentabilidad (3 Bloques Visuales) -->
    <h2 class="card-title" style="margin-top: 1.5rem;">🚦 Semáforo de Rentabilidad Semanal</h2>
    
    <div class="semaforo-cards-grid">
      <!-- 🟢 Unidad Más Rentable -->
      <div class="card semaforo-card verde">
        <div class="card-header">
          <span class="light-badge verde">🟢 Más Rentable</span>
          <span class="subtext">Mayor Ingreso Generado</span>
        </div>
        <div v-if="semaforoData.semaforo.unidadMasRentable" class="unit-details">
          <h3 class="unit-title">{{ semaforoData.semaforo.unidadMasRentable.numero_unidad }}</h3>
          <p class="unit-subtitle">Placas: {{ semaforoData.semaforo.unidadMasRentable.placas }}</p>
          <div class="unit-metric">
            <span>Vueltas Dadas:</span>
            <strong>{{ semaforoData.semaforo.unidadMasRentable.vueltas_semana }} vueltas</strong>
          </div>
          <div class="unit-metric">
            <span>Total Generado:</span>
            <strong class="text-success">$ {{ semaforoData.semaforo.unidadMasRentable.total_generado_unidad.toFixed(2) }}</strong>
          </div>
        </div>
        <div v-else class="empty-state">No hay datos de unidades</div>
      </div>

      <!-- 🟠 Unidad con Mayor Gasto -->
      <div class="card semaforo-card naranja">
        <div class="card-header">
          <span class="light-badge naranja">🟠 Mayor Gasto</span>
          <span class="subtext">Combustible e Imprevistos</span>
        </div>
        <div v-if="semaforoData.semaforo.unidadMayorGasto" class="unit-details">
          <h3 class="unit-title">{{ semaforoData.semaforo.unidadMayorGasto.numero_unidad }}</h3>
          <p class="unit-subtitle">Placas: {{ semaforoData.semaforo.unidadMayorGasto.placas }}</p>
          <div class="unit-metric">
            <span>Combustible:</span>
            <strong>$ {{ semaforoData.semaforo.unidadMayorGasto.combustible_total.toFixed(2) }}</strong>
          </div>
          <div class="unit-metric">
            <span>Imprevistos/Mecánica:</span>
            <strong class="text-warning">$ {{ semaforoData.semaforo.unidadMayorGasto.gastos_imprevistos_total.toFixed(2) }}</strong>
          </div>
        </div>
        <div v-else class="empty-state">No hay datos de unidades</div>
      </div>

      <!-- 🔴 Unidades con Saldo Negativo -->
      <div class="card semaforo-card rojo">
        <div class="card-header">
          <span class="light-badge rojo">🔴 Saldo Negativo</span>
          <span class="subtext">Unidades con Pérdida</span>
        </div>
        <div v-if="semaforoData.semaforo.unidadesSaldoNegativo.length > 0" class="negative-units-list">
          <div v-for="u in semaforoData.semaforo.unidadesSaldoNegativo" :key="u.unidad_id" class="negative-item">
            <div>
              <strong>{{ u.numero_unidad }}</strong> ({{ u.placas }})
            </div>
            <div class="text-danger font-mono font-bold">
              $ {{ u.total_neto_diario_acumulado.toFixed(2) }}
            </div>
          </div>
        </div>
        <div v-else class="empty-state-good">
          ✅ Ninguna unidad tiene saldo negativo esta semana
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTransportStore } from '../stores/transport';

const transportStore = useTransportStore();

const semaforoData = computed(() => transportStore.liquidacionSemanal);

const totalCombustibleGlobal = computed(() => {
  return transportStore.registrosDiarios.reduce((acc, curr) => acc + Number(curr.combustible || 0), 0);
});
</script>

<style scoped>
.semaforo-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
}

.semaforo-card {
  border-left-width: 6px !important;
}

.semaforo-card.verde { border-left-color: var(--success) !important; }
.semaforo-card.naranja { border-left-color: var(--warning) !important; }
.semaforo-card.rojo { border-left-color: var(--danger) !important; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.light-badge {
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.light-badge.verde { background: var(--success-bg); color: var(--success); }
.light-badge.naranja { background: var(--warning-bg); color: var(--warning); }
.light-badge.rojo { background: var(--danger-bg); color: var(--danger); }

.unit-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-main);
}

.unit-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.unit-metric {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
}

.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }

.negative-units-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.negative-item {
  background: var(--danger-bg);
  border: 1px solid var(--danger);
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state-good {
  padding: 1.5rem;
  text-align: center;
  color: var(--success);
  font-weight: 600;
  background: var(--success-bg);
  border-radius: var(--radius-sm);
}

.empty-state {
  padding: 1rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
