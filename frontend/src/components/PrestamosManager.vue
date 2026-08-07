<template>
  <div class="card">
    <h2 class="card-title">💳 Gestión de Descuentos & Préstamos por Socio/Unidad</h2>
    <p class="subtitle">Registra anticipos o préstamos pendientes que se descontarán automáticamente en la liquidación semanal</p>

    <!-- Formulario para agregar Préstamo -->
    <form @submit.prevent="guardarPrestamo" class="form-grid" v-if="authStore.isAdmin">
      <div class="form-group">
        <label class="form-label">Socio / Dueño</label>
        <select v-model="form.dueno_id" class="form-select" required @change="onDuenoSelect">
          <option value="" disabled>Seleccione socio...</option>
          <option v-for="d in transportStore.duenos" :key="d.id" :value="d.id">
            {{ d.nombre }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Unidad Relacionada</label>
        <select v-model="form.unidad_id" class="form-select" required>
          <option value="" disabled>Seleccione unidad...</option>
          <option v-for="u in unidadesSocio" :key="u.id" :value="u.id">
            {{ u.numero_unidad }} ({{ u.placas }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Monto del Préstamo / Anticipo ($)</label>
        <input 
          type="number" 
          v-model.number="form.monto" 
          step="50" 
          min="10" 
          placeholder="Ej. 450" 
          class="form-input" 
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label">Concepto / Motivo</label>
        <input 
          type="text" 
          v-model="form.concepto" 
          placeholder="Ej. Anticipo llanta, refacción emergencia..." 
          class="form-input" 
          required
        />
      </div>

      <div class="form-group full-width">
        <button type="submit" class="btn btn-primary btn-full">
          ➕ Registrar Préstamo para Descuento
        </button>
      </div>
    </form>

    <hr class="divider" />

    <!-- Tabla de Préstamos Registrados -->
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Socio / Dueño</th>
            <th>Unidad</th>
            <th>Concepto / Motivo</th>
            <th>Monto ($)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in prestamosFiltrados" :key="p.id">
            <td>{{ p.fecha }}</td>
            <td><strong>{{ getNombreDueno(p.dueno_id) }}</strong></td>
            <td>{{ getNumeroUnidad(p.unidad_id) }}</td>
            <td>{{ p.concepto }}</td>
            <td class="text-right text-danger font-bold">$ {{ Number(p.monto).toFixed(2) }}</td>
            <td>
              <span class="badge" :class="p.estado === 'pendiente' ? 'badge-warning' : 'badge-success'">
                {{ p.estado === 'pendiente' ? '⏳ Pendiente Descuento' : '✅ Descontado' }}
              </span>
            </td>
          </tr>
          <tr v-if="prestamosFiltrados.length === 0">
            <td colspan="6" class="text-center empty-state">
              No hay préstamos ni anticipos pendientes registrados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTransportStore } from '../stores/transport';
import { useAuthStore } from '../stores/auth';

const transportStore = useTransportStore();
const authStore = useAuthStore();

const form = ref({
  dueno_id: '',
  unidad_id: '',
  monto: '',
  concepto: ''
});

function onDuenoSelect() {
  const u = unidadesSocio.value[0];
  if (u) form.value.unidad_id = u.id;
}

const unidadesSocio = computed(() => {
  if (!form.value.dueno_id) return transportStore.unidades;
  return transportStore.unidades.filter(u => u.dueno_id === form.value.dueno_id);
});

const prestamosFiltrados = computed(() => {
  let list = transportStore.prestamos;
  if (authStore.isDueno) {
    list = list.filter(p => p.dueno_id === authStore.activeDuenoId);
  }
  return list;
});

function getNombreDueno(id) {
  const d = transportStore.duenos.find(x => x.id === id);
  return d ? d.nombre : 'Socio';
}

function getNumeroUnidad(id) {
  const u = transportStore.unidades.find(x => x.id === id);
  return u ? `${u.numero_unidad} (${u.placas})` : 'Unidad';
}

async function guardarPrestamo() {
  try {
    await transportStore.agregarPrestamo({ ...form.value });
    alert('✅ Préstamo registrado correctamente.');
    form.value.monto = '';
    form.value.concepto = '';
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}
</script>

<style scoped>
.subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  background: #0f172a;
  padding: 1.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.divider {
  border: 0;
  border-top: 1px solid var(--border-color);
  margin: 1.5rem 0;
}

.text-right { text-align: right; font-family: monospace; }
.font-bold { font-weight: 700; }
.text-danger { color: var(--danger); }
.empty-state { padding: 2rem; color: var(--text-muted); text-align: center; }
</style>
