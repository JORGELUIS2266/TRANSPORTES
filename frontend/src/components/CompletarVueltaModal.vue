<template>
  <!-- Modal: Completar Vuelta Ajena (campos de B con campos de A bloqueados) -->
  <div class="modal-overlay" @click.self="$emit('cerrar')">
    <div class="modal-box completar-box">
      <div class="modal-header">
        <div>
          <h3>🔓 Completar Vuelta</h3>
          <small style="color:#64748b;">Cierra la vuelta que quedó pendiente del turno anterior</small>
        </div>
        <button @click="$emit('cerrar')" class="modal-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Datos de A (bloqueados) -->
        <div class="seccion-bloqueada">
          <div class="seccion-titulo">
            <span class="lock-icon">🔒</span>
            Datos del turno anterior
            <span class="badge-capturista" :style="{ background: colorA }">
              {{ registro.capturado_por_nombre || 'Sin nombre' }}
            </span>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Unidad</label>
              <input type="text" :value="registro.numero_unidad" class="form-input input-locked" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Conductor</label>
              <input type="text" :value="registro.nombre_conductor" class="form-input input-locked" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">Bitácora 1 ($) — Tlaxiaco→Putla</label>
              <input type="number" :value="registro.bitacora_tlaxiaco_putla" class="form-input input-locked" readonly />
            </div>
          </div>
        </div>

        <!-- Datos de B (editables) -->
        <div class="seccion-editable">
          <div class="seccion-titulo">
            <span>✏️</span>
            Tu turno — completa los datos restantes
            <span class="badge-capturista" :style="{ background: colorB }">
              {{ auth.currentUser?.nombre || 'Tú' }}
            </span>
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Bitácora 2 ($) — Putla→Tlaxiaco</label>
              <input type="number" v-model.number="form.bitacora_putla_tlaxiaco"
                class="form-input" min="0" step="10" />
            </div>
            <div class="form-group">
              <label class="form-label">Intermedios ($)</label>
              <input type="number" v-model.number="form.intermedios"
                class="form-input" min="0" step="10" />
            </div>
            <div class="form-group">
              <label class="form-label">Combustible ($) — Gas que entregas</label>
              <input type="number" v-model.number="form.combustible"
                class="form-input" min="0" step="50" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Gastos imprevistos ($)</label>
            <input type="number" v-model.number="form.gastos_imprevistos"
              class="form-input" min="0" step="10" style="max-width:200px;" />
          </div>
        </div>

        <!-- Preview de cuentas divididas -->
        <div class="preview-split">
          <div class="split-card split-a" :style="{ borderColor: colorA }">
            <div class="split-title" :style="{ color: colorA }">
              {{ registro.capturado_por_nombre || 'Taquillera A' }}
            </div>
            <div class="split-row">
              <span>Bit. 1:</span>
              <strong>${{ Number(registro.bitacora_tlaxiaco_putla || 0).toFixed(2) }}</strong>
            </div>
            <div class="split-row split-neto">
              <span>Su corte:</span>
              <strong>${{ Number(registro.bitacora_tlaxiaco_putla || 0).toFixed(2) }}</strong>
            </div>
          </div>
          <div class="split-equals">➕</div>
          <div class="split-card split-b" :style="{ borderColor: colorB }">
            <div class="split-title" :style="{ color: colorB }">
              {{ auth.currentUser?.nombre || 'Tú (Taquillera B)' }}
            </div>
            <div class="split-row">
              <span>Bit. 2 + Inter:</span>
              <strong>${{ (Number(form.bitacora_putla_tlaxiaco) + Number(form.intermedios)).toFixed(2) }}</strong>
            </div>
            <div class="split-row" style="color:#d97706;">
              <span>Combustible:</span>
              <strong>−${{ Number(form.combustible).toFixed(2) }}</strong>
            </div>
            <div class="split-row split-neto" :style="{ color: corteB < 0 ? '#dc2626' : '#059669' }">
              <span>Tu corte:</span>
              <strong>${{ corteB.toFixed(2) }}</strong>
            </div>
          </div>
          <div class="split-equals">=</div>
          <div class="split-card split-total">
            <div class="split-title">Total neto</div>
            <div class="split-row split-neto" :style="{ color: netoTotal < 0 ? '#dc2626' : '#059669' }">
              <strong>${{ netoTotal.toFixed(2) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('cerrar')" class="btn btn-secondary">Cancelar</button>
        <button @click="guardar" class="btn btn-red" :disabled="guardando">
          <span v-if="guardando">⏳ Guardando...</span>
          <span v-else>✅ Completar Vuelta</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const props = defineProps({
  registro: { type: Object, required: true },
  colorA:   { type: String, default: '#94a3b8' },
  colorB:   { type: String, default: '#1e40af' }
});
const emit = defineEmits(['cerrar', 'guardado']);

const guardando = ref(false);
const form = ref({
  bitacora_putla_tlaxiaco: 0,
  intermedios:             0,
  combustible:             600,
  gastos_imprevistos:      0
});

const corteB = computed(() =>
  Number(form.value.bitacora_putla_tlaxiaco) +
  Number(form.value.intermedios) -
  Number(form.value.combustible) -
  Number(form.value.gastos_imprevistos)
);

const netoTotal = computed(() =>
  Number(props.registro.bitacora_tlaxiaco_putla || 0) + corteB.value
);

async function guardar() {
  guardando.value = true;
  try {
    const bit1  = Number(props.registro.bitacora_tlaxiaco_putla) || 0;
    const bit2  = Number(form.value.bitacora_putla_tlaxiaco) || 0;
    const inter = Number(form.value.intermedios) || 0;
    const comb  = Number(form.value.combustible) || 0;
    const imprev = Number(form.value.gastos_imprevistos) || 0;

    await api.guardarRegistro({
      ...props.registro,
      bitacora_putla_tlaxiaco: bit2,
      intermedios:             inter,
      combustible:             comb,
      gastos_imprevistos:      imprev,
      estado:                  'completado',
      // Quien completó la vuelta (Taquillera B)
      completado_por_id:       auth.currentUser?.id     || '',
      completado_por_nombre:   auth.currentUser?.nombre || ''
    });
    emit('guardado');
  } catch (e) {
    alert('Error al completar la vuelta: ' + e.message);
  } finally {
    guardando.value = false;
  }
}
</script>

<style scoped>
.completar-box {
  max-width: 780px;
  width: 95%;
}

.seccion-bloqueada {
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.seccion-editable {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.seccion-titulo {
  font-weight: 900;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #475569;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.badge-capturista {
  color: #fff;
  padding: 0.1rem 0.6rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.input-locked {
  background: #e2e8f0 !important;
  color: #64748b !important;
  cursor: not-allowed !important;
}

/* Preview de split de cuentas */
.preview-split {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.split-card {
  flex: 1;
  min-width: 160px;
  border: 2.5px solid #94a3b8;
  border-radius: 10px;
  padding: 0.75rem;
}
.split-title {
  font-weight: 900;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}
.split-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  padding: 0.15rem 0;
}
.split-neto {
  border-top: 1px solid #e2e8f0;
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  font-weight: 900;
}
.split-equals {
  font-size: 1.3rem;
  color: #94a3b8;
  font-weight: 900;
}
.split-total {
  border-color: #1e293b;
  background: #0f172a;
  color: #f1f5f9;
}
.split-total .split-title { color: #94a3b8; }

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
@media (max-width: 600px) {
  .grid-3 { grid-template-columns: 1fr; }
  .preview-split { flex-direction: column; }
}
</style>
