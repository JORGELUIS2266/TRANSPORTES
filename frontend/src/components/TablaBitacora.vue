<template>
  <div class="card">
    <div class="table-header">
      <div>
        <h2 class="card-title">📋 Bitácora Diaria de Operación</h2>
        <p class="subtitle">Registros por fecha y unidad con alertas visuales de saldo negativo</p>
      </div>

      <div class="date-filters">
        <div class="filter-item">
          <label>Desde:</label>
          <input type="date" v-model="transportStore.fechaInicio" @change="transportStore.cargarDatos" class="form-input input-sm" />
        </div>
        <div class="filter-item">
          <label>Hasta:</label>
          <input type="date" v-model="transportStore.fechaFin" @change="transportStore.cargarDatos" class="form-input input-sm" />
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Unidad</th>
            <th>Socio / Dueño</th>
            <th>Conductor</th>
            <th>Tlax ➔ Putla</th>
            <th>Putla ➔ Tlax</th>
            <th>Intermedios</th>
            <th>Total Gen.</th>
            <th>Combust.</th>
            <th>Imprev.</th>
            <th>Total Neto</th>
            <th>Vueltas</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in registrosFiltrados" :key="r.id">
            <td><strong>{{ r.fecha }}</strong></td>
            <td>
              <span class="badge badge-info">{{ r.numero_unidad }}</span>
              <div class="subtext">{{ r.placas }}</div>
            </td>
            <td>{{ r.nombre_dueno || 'Socio' }}</td>
            <td>{{ r.nombre_conductor || 'No asignado' }}</td>
            <td class="text-right">$ {{ Number(r.bitacora_tlaxcala_putla).toFixed(2) }}</td>
            <td class="text-right">$ {{ Number(r.bitacora_putla_tlaxcala).toFixed(2) }}</td>
            <td class="text-right">$ {{ Number(r.intermedios).toFixed(2) }}</td>
            <td class="text-right text-bold">$ {{ Number(r.total_generado).toFixed(2) }}</td>
            <td class="text-right text-muted">$ {{ Number(r.combustible).toFixed(2) }}</td>
            <td class="text-right text-warning">$ {{ Number(r.gastos_imprevistos).toFixed(2) }}</td>

            <!-- REGLA VISUAL EXPLICITA: SI EL TOTAL NETO ES NEGATIVO RESALTAR EN ROJO -->
            <td 
              class="text-right" 
              :class="Number(r.total_neto) < 0 ? 'cell-negative' : 'cell-positive'"
            >
              $ {{ Number(r.total_neto).toFixed(2) }}
            </td>

            <td class="text-center">
              <span class="badge badge-warning">{{ r.vueltas_dadas || 1 }}</span>
            </td>

            <td>
              <span class="badge" :class="r.cerrado ? 'badge-danger' : 'badge-success'">
                {{ r.cerrado ? '🔒 Cerrado' : '🔓 Abierto' }}
              </span>
            </td>
          </tr>

          <tr v-if="registrosFiltrados.length === 0">
            <td colspan="13" class="text-center empty-state">
              No hay registros diarios en el rango de fechas seleccionado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTransportStore } from '../stores/transport';
import { useAuthStore } from '../stores/auth';

const transportStore = useTransportStore();
const authStore = useAuthStore();

const registrosFiltrados = computed(() => {
  let list = transportStore.registrosDiarios;
  // Si el usuario es Socio/Dueño, filtrar solo sus camionetas
  if (authStore.isDueno) {
    list = list.filter(r => r.dueno_id === authStore.activeDuenoId);
  }
  return list;
});
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.date-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.input-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
}

.text-right {
  text-align: right;
  font-family: monospace;
}

.text-center {
  text-align: center;
}

.text-bold {
  font-weight: 700;
}

.subtext {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.empty-state {
  padding: 2rem;
  color: var(--text-muted);
}
</style>
