<template>
  <div class="unidades-container">

    <!-- ════════════════════════════════════════════
         SECCIÓN DUEÑOS
    ════════════════════════════════════════════ -->
    <div class="card">
      <div class="card-header-box">
        <div>
          <h2 class="section-title">👤 Dueños de Unidades</h2>
          <p class="section-sub">Registra aquí a los propietarios de cada camioneta. Estos datos son permanentes.</p>
        </div>
        <button v-if="auth.puedeGestionarCatalogos" @click="abrirModalDueno()" class="btn btn-red btn-sm">+ Nuevo Dueño</button>
        <span v-else class="badge" style="background:#f1f5f9; color:#64748b; font-size:0.75rem;">🔒 Catálogo protegido</span>
      </div>

      <div v-if="duenos.length === 0" class="empty-msg">
        No hay dueños registrados aún. Agrega el primero con el botón de arriba.
      </div>
      <div v-else class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre del Dueño</th>
              <th>Teléfono</th>
              <th>Unidades Asignadas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(d, i) in duenos" :key="d.id">
              <td class="row-num">{{ i + 1 }}</td>
              <td><strong>{{ d.nombre }}</strong></td>
              <td>{{ d.telefono || '—' }}</td>
              <td>
                <div class="unit-chips">
                  <span v-for="u in unidadesDeDueno(d.id)" :key="u.id" class="chip chip-blue">
                    {{ u.numero }}
                  </span>
                  <span v-if="unidadesDeDueno(d.id).length === 0" class="text-muted-sm">Sin unidades</span>
                </div>
              </td>
              <td>
                <div class="action-cell" v-if="auth.puedeGestionarCatalogos">
                  <button @click="abrirModalDueno(d)" class="btn btn-sm btn-edit">✏️ Editar</button>
                  <button @click="eliminarDueno(d)"  class="btn btn-sm btn-delete">🗑️</button>
                </div>
                <span v-else style="font-size:0.75rem; color:#94a3b8;">–</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ════════════════════════════════════════════
         SECCIÓN UNIDADES
    ════════════════════════════════════════════ -->
    <div class="card">
      <div class="card-header-box">
        <div>
          <h2 class="section-title">🚐 Unidades (Camionetas)</h2>
          <p class="section-sub">Registra cada camioneta con sus datos. Al capturar un viaje podrás seleccionarla del menú.</p>
        </div>
        <button v-if="auth.puedeGestionarCatalogos" @click="abrirModalUnidad()" class="btn btn-red btn-sm">+ Nueva Unidad</button>
        <span v-else class="badge" style="background:#f1f5f9; color:#64748b; font-size:0.75rem;">🔒 Catálogo protegido</span>
      </div>

      <div v-if="unidades.length === 0" class="empty-msg">
        No hay unidades registradas. Agrega la primera con el botón de arriba.
      </div>
      <div v-else class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Número</th>
              <th>Placas</th>
              <th>Modelo</th>
              <th>Dueño</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in unidades" :key="u.id">
              <td class="row-num">{{ i + 1 }}</td>
              <td><span class="chip chip-blue" style="font-size:0.9rem;">Unidad {{ u.numero }}</span></td>
              <td>{{ u.placas || '—' }}</td>
              <td>{{ u.modelo || '—' }}</td>
              <td><strong>{{ u.dueno ? u.dueno.nombre : '—' }}</strong></td>
              <td>
                <div class="action-cell" v-if="auth.puedeGestionarCatalogos">
                  <button @click="abrirModalUnidad(u)" class="btn btn-sm btn-edit">✏️ Editar</button>
                  <button @click="eliminarUnidad(u)"  class="btn btn-sm btn-delete">🗑️</button>
                </div>
                <span v-else style="font-size:0.75rem; color:#94a3b8;">–</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ════════════════════════════════════════════
         MODAL DUEÑO
    ════════════════════════════════════════════ -->
    <div v-if="modalDueno" class="modal-overlay" @click.self="cerrarModalDueno">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ formDueno.id ? '✏️ Editar Dueño' : '➕ Nuevo Dueño' }}</h3>
          <button @click="cerrarModalDueno" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre completo <span class="req">*</span></label>
            <input
              type="text"
              v-model="formDueno.nombre"
              class="form-input"
              :class="{ 'input-error': erroresDueno.nombre }"
              placeholder="Ej. Juan Pérez López"
              @input="erroresDueno.nombre = ''"
            />
            <span v-if="erroresDueno.nombre" class="error-msg">{{ erroresDueno.nombre }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input
              type="tel"
              v-model="formDueno.telefono"
              class="form-input"
              placeholder="Ej. 953 123 4567"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalDueno" class="btn btn-secondary">Cancelar</button>
          <button @click="guardarDueno"     class="btn btn-red" :disabled="guardandoDueno">
            {{ guardandoDueno ? '⏳ Guardando...' : '💾 Guardar Dueño' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════
         MODAL UNIDAD
    ════════════════════════════════════════════ -->
    <div v-if="modalUnidad" class="modal-overlay" @click.self="cerrarModalUnidad">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ formUnidad.id ? '✏️ Editar Unidad' : '➕ Nueva Unidad' }}</h3>
          <button @click="cerrarModalUnidad" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Número de Unidad <span class="req">*</span></label>
              <input
                type="text"
                v-model="formUnidad.numero"
                class="form-input"
                :class="{ 'input-error': erroresUnidad.numero }"
                placeholder="Ej. 01, 13, 16..."
                @input="erroresUnidad.numero = ''"
              />
              <span v-if="erroresUnidad.numero" class="error-msg">{{ erroresUnidad.numero }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">Placas</label>
              <input
                type="text"
                v-model="formUnidad.placas"
                class="form-input"
                placeholder="Ej. OAX-1234"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Modelo / Descripción</label>
            <input
              type="text"
              v-model="formUnidad.modelo"
              class="form-input"
              placeholder="Ej. Toyota Hiace 2020"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Dueño de la Unidad</label>
            <select v-model="formUnidad.dueno_id" class="form-input">
              <option value="">— Sin asignar —</option>
              <option v-for="d in duenos" :key="d.id" :value="d.id">
                {{ d.nombre }}{{ d.telefono ? ` · ${d.telefono}` : '' }}
              </option>
            </select>
            <span v-if="duenos.length === 0" class="hint-msg">
              ⚠️ Primero registra un dueño en la sección de arriba.
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalUnidad" class="btn btn-secondary">Cancelar</button>
          <button @click="guardarUnidad"     class="btn btn-red" :disabled="guardandoUnidad">
            {{ guardandoUnidad ? '⏳ Guardando...' : '💾 Guardar Unidad' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

// ── Estado ────────────────────────────────────────────────────────────────────
const duenos   = ref([]);
const unidades = ref([]);

const modalDueno  = ref(false);
const modalUnidad = ref(false);
const guardandoDueno  = ref(false);
const guardandoUnidad = ref(false);

const formDueno = ref({ id: null, nombre: '', telefono: '' });
const formUnidad = ref({ id: null, numero: '', placas: '', modelo: '', dueno_id: '' });

const erroresDueno  = ref({ nombre: '' });
const erroresUnidad = ref({ numero: '' });

// ── Carga ─────────────────────────────────────────────────────────────────────
async function cargar() {
  [duenos.value, unidades.value] = await Promise.all([
    api.getDuenos(),
    api.getUnidades()
  ]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function unidadesDeDueno(duenoId) {
  return unidades.value.filter(u => u.dueno_id === duenoId);
}

// ── DUEÑOS ────────────────────────────────────────────────────────────────────
function abrirModalDueno(dueno = null) {
  if (dueno) {
    formDueno.value = { id: dueno.id, nombre: dueno.nombre, telefono: dueno.telefono || '' };
  } else {
    formDueno.value = { id: null, nombre: '', telefono: '' };
  }
  erroresDueno.value = { nombre: '' };
  modalDueno.value = true;
}

function cerrarModalDueno() {
  modalDueno.value = false;
}

async function guardarDueno() {
  erroresDueno.value = { nombre: '' };
  const nombre = formDueno.value.nombre.trim();

  if (!nombre) {
    erroresDueno.value.nombre = 'El nombre es obligatorio.';
    return;
  }

  guardandoDueno.value = true;
  try {
    await api.guardarDueno({ ...formDueno.value });
    await cargar();
    cerrarModalDueno();
  } catch (e) {
    alert('❌ ' + e.message);
  } finally {
    guardandoDueno.value = false;
  }
}

async function eliminarDueno(dueno) {
  if (!confirm(`¿Eliminar al dueño "${dueno.nombre}"?\n\nEsta acción no se puede deshacer.`)) return;
  try {
    await api.eliminarDueno(dueno.id);
    await cargar();
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

// ── UNIDADES ──────────────────────────────────────────────────────────────────
function abrirModalUnidad(unidad = null) {
  if (unidad) {
    formUnidad.value = {
      id:       unidad.id,
      numero:   unidad.numero,
      placas:   unidad.placas  || '',
      modelo:   unidad.modelo  || '',
      dueno_id: unidad.dueno_id || ''
    };
  } else {
    formUnidad.value = { id: null, numero: '', placas: '', modelo: '', dueno_id: '' };
  }
  erroresUnidad.value = { numero: '' };
  modalUnidad.value = true;
}

function cerrarModalUnidad() {
  modalUnidad.value = false;
}

async function guardarUnidad() {
  erroresUnidad.value = { numero: '' };
  const numero = formUnidad.value.numero.trim();

  if (!numero) {
    erroresUnidad.value.numero = 'El número de unidad es obligatorio.';
    return;
  }

  guardandoUnidad.value = true;
  try {
    await api.guardarUnidad({
      ...formUnidad.value,
      dueno_id: formUnidad.value.dueno_id || null
    });
    await cargar();
    cerrarModalUnidad();
  } catch (e) {
    alert('❌ ' + e.message);
  } finally {
    guardandoUnidad.value = false;
  }
}

async function eliminarUnidad(unidad) {
  if (!confirm(`¿Eliminar la unidad #${unidad.numero}?\n\nEsta acción no se puede deshacer.`)) return;
  try {
    await api.eliminarUnidad(unidad.id);
    await cargar();
  } catch (e) {
    alert('❌ ' + e.message);
  }
}

onMounted(cargar);
</script>

<style scoped>
/* ── HEADER DE SECCIÓN ─────────────────────────────── */
.section-title { color: var(--accent-red); font-size: 1.15rem; margin: 0 0 0.2rem; }
.section-sub   { color: var(--text-muted); font-size: 0.83rem; margin: 0; }

/* ── TABLA ─────────────────────────────────────────── */
.row-num { text-align: center; color: #94a3b8; font-size: 0.8rem; font-weight: 700; width: 32px; }

/* ── CHIPS ─────────────────────────────────────────── */
.unit-chips { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.chip { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.78rem; font-weight: 800; }
.chip-blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

/* ── BOTONES DE ACCIÓN ─────────────────────────────── */
.action-cell { display: flex; gap: 0.35rem; }
.btn-edit   { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.btn-edit:hover  { background: #dbeafe; }
.btn-delete { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
.btn-delete:hover{ background: #fee2e2; }

/* ── MODAL ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal-box {
  background: white; border-radius: 12px;
  width: 100%; max-width: 520px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.28);
  animation: modalIn 0.18s ease;
}
@keyframes modalIn {
  from { transform: scale(0.93); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem;
  background: #fef2f2;
  border-radius: 12px 12px 0 0;
  border-bottom: 2px solid #fee2e2;
}
.modal-header h3 { color: #dc2626; font-weight: 800; font-size: 1.05rem; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; }
.modal-close:hover { color: #dc2626; }
.modal-body   { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 0.75rem; justify-content: flex-end; }

/* ── VALIDACIÓN ────────────────────────────────────── */
.req       { color: #dc2626; }
.input-error { border-color: #dc2626 !important; box-shadow: 0 0 0 2px rgba(220,38,38,0.15) !important; }
.error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.25rem; display: block; }
.hint-msg  { color: #d97706; font-size: 0.8rem; margin-top: 0.25rem; display: block; }

/* ── MISC ──────────────────────────────────────────── */
.empty-msg     { text-align: center; padding: 2rem; color: #64748b; font-size: 0.95rem; }
.text-muted-sm { color: #94a3b8; font-size: 0.85rem; }
.grid-2        { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

@media (max-width: 600px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
