<template>
  <div class="gestion-container">
    <div class="card-header-box">
      <div>
        <h2 style="color: var(--accent-red-light); font-size: 1.25rem;">📝 Alta y Control de Socios, Unidades y Choferes</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Registra a los dueños, sus camionetas asociadas y a los conductores titulares o suplentes.</p>
      </div>
    </div>

    <!-- Pestañas / Casillas de Selección -->
    <div class="tabs-header">
      <button 
        @click="activeTab = 'duenos'" 
        class="tab-btn" 
        :class="{ active: activeTab === 'duenos' }"
      >
        👥 1. Socios / Dueños ({{ transportStore.duenos.length }})
      </button>

      <button 
        @click="activeTab = 'unidades'" 
        class="tab-btn" 
        :class="{ active: activeTab === 'unidades' }"
      >
        🚐 2. Unidades / Camionetas ({{ transportStore.unidades.length }})
      </button>

      <button 
        @click="activeTab = 'conductores'" 
        class="tab-btn" 
        :class="{ active: activeTab === 'conductores' }"
      >
        👨‍✈️ 3. Choferes / Conductores ({{ transportStore.conductores.length }})
      </button>
    </div>

    <!-- CASILLA 1: GESTIÓN DE SOCIOS / DUEÑOS -->
    <div v-if="activeTab === 'duenos'" class="box-section">
      <div class="box-title">
        <span>👥 Casilla 1: Registrar Nuevo Socio / Dueño</span>
      </div>

      <form @submit.prevent="guardarDueno" class="grid-form">
        <div class="form-group">
          <label class="form-label">Nombre del Socio / Dueño</label>
          <input 
            type="text" 
            v-model="formDueno.nombre" 
            placeholder="Ej. Don Manuel Ramírez" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Teléfono de Contacto (WhatsApp)</label>
          <input 
            type="tel" 
            v-model="formDueno.telefono" 
            placeholder="Ej. 246-123-4567" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group full-btn">
          <button type="submit" class="btn btn-red btn-full">
            ➕ Guardar Socio
          </button>
        </div>
      </form>

      <hr class="divider" />

      <!-- Tabla de Socios Registrados -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre del Socio</th>
              <th>Teléfono</th>
              <th>Unidades Asociadas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in transportStore.duenos" :key="d.id">
              <td><strong>{{ d.nombre }}</strong></td>
              <td>{{ d.telefono || 'Sin teléfono' }}</td>
              <td>
                <span 
                  v-for="u in getUnidadesDueno(d.id)" 
                  :key="u.id" 
                  class="badge badge-red"
                  style="margin-right: 0.35rem;"
                >
                  {{ u.numero_unidad }}
                </span>
                <span v-if="getUnidadesDueno(d.id).length === 0" class="subtext">Sin unidades asignadas</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CASILLA 2: GESTIÓN DE UNIDADES / CAMIONETAS -->
    <div v-if="activeTab === 'unidades'" class="box-section">
      <div class="box-title">
        <span>🚐 Casilla 2: Registrar Nueva Unidad / Camioneta</span>
      </div>

      <form @submit.prevent="guardarUnidad" class="grid-form">
        <div class="form-group">
          <label class="form-label">Número de Unidad</label>
          <input 
            type="text" 
            v-model="formUnidad.numero_unidad" 
            placeholder="Ej. Unidad 05" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Placas de Transporte</label>
          <input 
            type="text" 
            v-model="formUnidad.placas" 
            placeholder="Ej. XXA-105-E" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Modelo / Año</label>
          <input 
            type="text" 
            v-model="formUnidad.modelo" 
            placeholder="Ej. Nissan Urvan 2023" 
            class="form-input" 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Socio / Dueño Asignado</label>
          <select v-model="formUnidad.dueno_id" class="form-select" required>
            <option value="" disabled>Seleccionar socio...</option>
            <option v-for="d in transportStore.duenos" :key="d.id" :value="d.id">
              {{ d.nombre }}
            </option>
          </select>
        </div>

        <div class="form-group full-btn">
          <button type="submit" class="btn btn-red btn-full">
            ➕ Guardar Unidad
          </button>
        </div>
      </form>

      <hr class="divider" />

      <!-- Tabla de Unidades -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Número Unidad</th>
              <th>Placas</th>
              <th>Modelo</th>
              <th>Socio / Dueño</th>
              <th>Conductor Habitual</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in transportStore.unidades" :key="u.id">
              <td><strong>{{ u.numero_unidad }}</strong></td>
              <td><span class="badge badge-info">{{ u.placas }}</span></td>
              <td>{{ u.modelo }}</td>
              <td>{{ getNombreDueno(u.dueno_id) }}</td>
              <td>
                <span class="badge badge-success">
                  {{ getNombreConductorHabitual(u.id) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CASILLA 3: GESTIÓN DE CHOFERES / CONDUCTORES -->
    <div v-if="activeTab === 'conductores'" class="box-section">
      <div class="box-title">
        <span>👨‍✈️ Casilla 3: Registrar Nuevo Chofer / Conductor</span>
      </div>

      <form @submit.prevent="guardarConductor" class="grid-form">
        <div class="form-group">
          <label class="form-label">Nombre del Chofer</label>
          <input 
            type="text" 
            v-model="formConductor.nombre" 
            placeholder="Ej. Roberto Sánchez" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Teléfono de Contacto</label>
          <input 
            type="tel" 
            v-model="formConductor.telefono" 
            placeholder="Ej. 246-555-9999" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <label class="form-label">Unidad Predeterminada (Opcional)</label>
          <select v-model="formConductor.unidad_predeterminada_id" class="form-select">
            <option value="">Ninguna (Chofer Suplente / Libre)</option>
            <option v-for="u in transportStore.unidades" :key="u.id" :value="u.id">
              {{ u.numero_unidad }} ({{ u.placas }})
            </option>
          </select>
        </div>

        <div class="form-group full-btn">
          <button type="submit" class="btn btn-red btn-full">
            ➕ Guardar Chofer
          </button>
        </div>
      </form>

      <hr class="divider" />

      <!-- Tabla Choferes -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre Chofer</th>
              <th>Teléfono</th>
              <th>Unidad Predeterminada</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in transportStore.conductores" :key="c.id">
              <td><strong>{{ c.nombre }}</strong></td>
              <td>{{ c.telefono }}</td>
              <td>{{ getNumeroUnidad(c.unidad_predeterminada_id) }}</td>
              <td>
                <span class="badge" :class="c.unidad_predeterminada_id ? 'badge-info' : 'badge-warning'">
                  {{ c.unidad_predeterminada_id ? 'Titular' : 'Suplente / Libres' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTransportStore } from '../stores/transport';

const transportStore = useTransportStore();
const activeTab = ref('duenos');

const formDueno = ref({ nombre: '', telefono: '' });
const formUnidad = ref({ numero_unidad: '', placas: '', modelo: '', dueno_id: '' });
const formConductor = ref({ nombre: '', telefono: '', unidad_predeterminada_id: '' });

function getUnidadesDueno(duenoId) {
  return transportStore.unidades.filter(u => u.dueno_id === duenoId);
}

function getNombreDueno(id) {
  const d = transportStore.duenos.find(x => x.id === id);
  return d ? d.nombre : 'Sin Socio';
}

function getNumeroUnidad(id) {
  const u = transportStore.unidades.find(x => x.id === id);
  return u ? u.numero_unidad : 'Sin Asignar';
}

function getNombreConductorHabitual(unidadId) {
  const c = transportStore.conductores.find(x => x.unidad_predeterminada_id === unidadId);
  return c ? c.nombre : 'No asignado';
}

async function guardarDueno() {
  try {
    await transportStore.agregarDueno({ ...formDueno.value });
    alert('✅ Socio registrado correctamente.');
    formDueno.value = { nombre: '', telefono: '' };
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}

async function guardarUnidad() {
  try {
    await transportStore.agregarUnidad({ ...formUnidad.value });
    alert('✅ Unidad registrada correctamente.');
    formUnidad.value = { numero_unidad: '', placas: '', modelo: '', dueno_id: '' };
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}

async function guardarConductor() {
  try {
    await transportStore.agregarConductor({ ...formConductor.value });
    alert('✅ Chofer registrado correctamente.');
    formConductor.value = { nombre: '', telefono: '', unidad_predeterminada_id: '' };
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}
</script>

<style scoped>
.tabs-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  background: var(--bg-card);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--bg-card-header);
  color: var(--text-main);
}

.tab-btn.active {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border-color: #ef4444;
}

.grid-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.full-btn {
  grid-column: 1 / -1;
}

.divider {
  border: 0;
  border-top: 1px dashed var(--border-color);
  margin: 1.5rem 0;
}

.subtext {
  font-size: 0.8rem;
  color: var(--text-dim);
}
</style>
