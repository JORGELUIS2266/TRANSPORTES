<template>
  <div>
    <div class="card">
      <div class="card-header-box">
        <div>
          <h2 style="color:var(--accent-red); font-size:1.2rem;">🔄 Vueltas por Semana</h2>
          <p style="font-size:0.83rem; color:var(--text-muted);">
            Conteo de vueltas por unidad y total general de la semana seleccionada.
          </p>
        </div>
        <select v-model="semanaId" @change="cargar" class="semana-select-mini">
          <option v-for="s in semanasDisponibles" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </div>

      <!-- Totales generales de la semana -->
      <div class="vueltas-totales" v-if="registros.length > 0">
        <div class="vt-item">
          <span class="vt-num">{{ totalVueltas }}</span>
          <span class="vt-label">Vueltas Totales</span>
        </div>
        <div class="vt-item vt-green">
          <span class="vt-num">{{ vueltasCompletadas }}</span>
          <span class="vt-label">Completadas</span>
        </div>
        <div class="vt-item vt-orange" v-if="vueltasPendientes > 0">
          <span class="vt-num">{{ vueltasPendientes }}</span>
          <span class="vt-label">Pendientes</span>
        </div>
        <div class="vt-item vt-blue">
          <span class="vt-num">{{ unidadesActivas }}</span>
          <span class="vt-label">Unidades Activas</span>
        </div>
      </div>

      <!-- Por unidad -->
      <div class="table-responsive" v-if="resumenPorUnidad.length > 0">
        <table class="table">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Conductor(es)</th>
              <th class="text-right">Vueltas Completadas</th>
              <th class="text-right">Vueltas Pendientes</th>
              <th class="text-right">Total Generado ($)</th>
              <th class="text-right">Combustible ($)</th>
              <th class="text-right">Total Neto ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in resumenPorUnidad" :key="u.numero">
              <td><span class="badge badge-red">{{ u.numero }}</span></td>
              <td>{{ u.conductores.join(', ') }}</td>
              <td class="text-right text-bold">{{ u.completadas }}</td>
              <td class="text-right" :class="u.pendientes > 0 ? 'text-orange' : ''">
                {{ u.pendientes || '—' }}
              </td>
              <td class="text-right">${{ u.totalGenerado.toFixed(2) }}</td>
              <td class="text-right" style="color:#d97706;">${{ u.combustible.toFixed(2) }}</td>
              <td class="text-right" :class="u.neto < 0 ? 'cell-negative' : 'cell-positive'">
                ${{ u.neto.toFixed(2) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="subtotal-row">
              <td colspan="2" class="subtotal-label">TOTAL SEMANA</td>
              <td class="text-right subtotal-val">{{ vueltasCompletadas }}</td>
              <td class="text-right subtotal-val">{{ vueltasPendientes || '—' }}</td>
              <td class="text-right subtotal-val">${{ sumGeneral.toFixed(2) }}</td>
              <td class="text-right subtotal-val" style="color:#d97706;">${{ sumCombustible.toFixed(2) }}</td>
              <td class="text-right subtotal-val" :class="sumNeto < 0 ? 'cell-negative' : 'cell-positive'">
                ${{ sumNeto.toFixed(2) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-if="registros.length === 0" class="text-center" style="padding:2.5rem; color:#64748b;">
        No hay vueltas registradas en la <strong>{{ semanaObj?.label }}</strong>.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api';
import { getSemanasSelectRecentFirst, getSemanaActualId } from '../utils/semanas';

const semanasDisponibles = getSemanasSelectRecentFirst();
const semanaId  = ref(api.getSemanaActiva() || getSemanaActualId());
const semanaObj = computed(() => semanasDisponibles.find(s => s.id === semanaId.value) || null);

const registros = ref([]);

async function cargar() {
  registros.value = await api.getRegistrosDeSemana(semanaId.value);
}

const completados        = computed(() => registros.value.filter(r => r.estado === 'completado'));
const totalVueltas       = computed(() => registros.value.length);
const vueltasCompletadas = computed(() => completados.value.length);
const vueltasPendientes  = computed(() => registros.value.filter(r => r.estado === 'pendiente').length);

const resumenPorUnidad = computed(() => {
  const mapa = {};
  completados.value.forEach(r => {
    if (!mapa[r.numero_unidad]) {
      mapa[r.numero_unidad] = {
        numero:       r.numero_unidad,
        conductores:  new Set(),
        completadas:  0,
        pendientes:   0,
        totalGenerado: 0,
        combustible:  0,
        neto:         0
      };
    }
    const u = mapa[r.numero_unidad];
    u.conductores.add(r.nombre_conductor);
    u.completadas++;
    u.totalGenerado += (Number(r.total_generado) || 0);
    u.combustible   += (Number(r.combustible)    || 0);
    u.neto          += (Number(r.total_neto)     || 0);
  });
  // Agregar pendientes
  registros.value.filter(r => r.estado === 'pendiente').forEach(r => {
    if (!mapa[r.numero_unidad]) {
      mapa[r.numero_unidad] = { numero: r.numero_unidad, conductores: new Set(), completadas: 0, pendientes: 0, totalGenerado: 0, combustible: 0, neto: 0 };
    }
    mapa[r.numero_unidad].pendientes++;
    mapa[r.numero_unidad].conductores.add(r.nombre_conductor);
  });

  return Object.values(mapa)
    .map(u => ({ ...u, conductores: [...u.conductores] }))
    .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
});

const unidadesActivas = computed(() => resumenPorUnidad.value.length);
const sumGeneral    = computed(() => resumenPorUnidad.value.reduce((s, u) => s + u.totalGenerado, 0));
const sumCombustible = computed(() => resumenPorUnidad.value.reduce((s, u) => s + u.combustible, 0));
const sumNeto        = computed(() => resumenPorUnidad.value.reduce((s, u) => s + u.neto, 0));

onMounted(cargar);
</script>

<style scoped>
.semana-select-mini {
  font-size: 0.85rem; font-weight: 700; color: var(--accent-red);
  border: 1px solid var(--border-color); border-radius: 8px;
  padding: 0.45rem 0.75rem; background: white; cursor: pointer;
}
.vueltas-totales { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.vt-item { flex: 1; min-width: 120px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; text-align: center; }
.vt-green  { border-color: #86efac; background: #f0fdf4; }
.vt-orange { border-color: #fde68a; background: #fffbeb; }
.vt-blue   { border-color: #bae6fd; background: #f0f9ff; }
.vt-num    { display: block; font-size: 2rem; font-weight: 900; color: var(--accent-red); }
.vt-green  .vt-num { color: #059669; }
.vt-orange .vt-num { color: #d97706; }
.vt-blue   .vt-num { color: #0284c7; }
.vt-label  { font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

.subtotal-row { background: #e2e8f0; font-weight: 800; }
.subtotal-label { font-weight: 800; }
.subtotal-val   { font-weight: 800; }
.text-right  { text-align: right; font-family: monospace; }
.text-bold   { font-weight: 700; }
.text-orange { color: #d97706; font-weight: 700; }
</style>
