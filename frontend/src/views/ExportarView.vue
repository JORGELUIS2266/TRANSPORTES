<template>
  <div class="exportar-container">
    <div class="card">
      <div class="card-header-box">
        <div>
          <h2 style="color: var(--accent-red); font-size: 1.25rem;">📄 Exportación de Documentos, Reportes y Respaldos</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            Genera informes en PDF, tablas de Excel (.xlsx), texto para WhatsApp y copias de seguridad de la base de datos para OneDrive.
          </p>
        </div>
        <div class="semana-selector-mini">
          <label class="form-label" style="margin: 0 0 0.2rem; font-size: 0.75rem;">Semana:</label>
          <select v-model="semanaId" @change="cargar" class="semana-select-mini">
            <option v-for="s in (semanasDisponibles || [])" :key="s?.id || Math.random()" :value="s?.id || ''">
              {{ s?.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Alerta para Lector -->
      <div v-if="auth.isLector" class="alert-warn" style="background:#f0fdf4; border-color:#86efac; color:#166534; margin-bottom:1.5rem;">
        🔒 <strong>Modo Consulta (Lector):</strong> Tienes permisos de solo visualización. Las descargas de archivos PDF, Excel y Respaldos de base de datos están restringidas para proteger la información. Inicia sesión como <strong>Administrador</strong> para habilitar todas las exportaciones.
      </div>

      <div class="export-grid">
        <!-- Opcion PDF -->
        <div class="export-card">
          <div class="icon">📄</div>
          <h3>Reporte PDF Oficial</h3>
          <p>Documento tabular limpio por día con el desglose de ingresos y gastos de la semana seleccionada.</p>
          <button @click="generarPDFClick" class="btn btn-red btn-full" :disabled="registros.length === 0 || !auth.puedeDescargarReportes">
            {{ auth.puedeDescargarReportes ? 'Descargar PDF (Semana)' : '🔒 Bloqueado para Lector' }}
          </button>
        </div>

        <!-- Opcion Excel -->
        <div class="export-card">
          <div class="icon">📊</div>
          <h3>Hoja de Cálculo Excel (.xlsx)</h3>
          <p>Archivo estructurado con 1 hoja por día + Hoja de Resumen Semanal para contabilidad.</p>
          <button @click="generarExcelClick" class="btn btn-success btn-full" :disabled="registros.length === 0 || !auth.puedeDescargarReportes">
            {{ auth.puedeDescargarReportes ? 'Descargar Excel (.xlsx)' : '🔒 Bloqueado para Lector' }}
          </button>
        </div>

        <!-- Opcion WhatsApp -->
        <div class="export-card">
          <div class="icon">📱</div>
          <h3>Notificación WhatsApp</h3>
          <p>Genera un resumen formateado con negritas y emojis listo para enviar por WhatsApp.</p>
          <button @click="abrirWA" class="btn btn-warning btn-full" :disabled="!mensajeWA || !auth.puedeDescargarReportes">
            {{ auth.puedeDescargarReportes ? 'Enviar por WhatsApp' : '🔒 Bloqueado para Lector' }}
          </button>
        </div>

        <!-- Opcion Respaldo OneDrive / Nube -->
        <div class="export-card backup-card" v-if="auth.isAdmin">
          <div class="icon">☁️</div>
          <h3>Copia de Seguridad (OneDrive / JSON)</h3>
          <p>Descarga toda tu base de datos completa (todas las semanas, unidades y dueños) en un archivo JSON para guardarlo en tu carpeta de OneDrive o Google Drive.</p>
          <button @click="descargarCopiaSeguridad" class="btn btn-primary btn-full" style="background:#0284c7; color:white; border-color:#0284c7;">
            💾 Descargar Respaldo Total (.json)
          </button>
          
          <label class="btn btn-secondary btn-full btn-upload" style="margin-top:0.5rem; cursor:pointer;">
            📂 Restaurar Respaldo desde Archivo
            <input type="file" accept=".json" @change="restaurarCopiaSeguridad" style="display:none;" />
          </label>
        </div>
      </div>

      <!-- Previsualizador de Mensaje -->
      <div v-if="mensajeWA" class="box-section" style="margin-top: 2rem;">
        <div class="box-title">📱 Vista Previa del Mensaje para WhatsApp</div>
        <textarea v-model="mensajeWA" class="form-textarea" rows="10" readonly></textarea>
      </div>

      <div v-else class="text-center empty-msg" style="margin-top: 2rem;">
        No hay registros en la {{ semanaObj?.label || 'Semana Seleccionada' }} para exportar.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { exportarPDF } from '../utils/pdfExport';
import { exportarExcel } from '../utils/excelExport';
import { getSemanasSelectRecentFirst, getSemanaActualId, formatFechaLarga } from '../utils/semanas';

const auth = useAuthStore();
const semanasDisponibles = ref(getSemanasSelectRecentFirst() || []);
const semanaId = ref(api.getSemanaActiva() || getSemanaActualId());
const semanaObj = computed(() => (semanasDisponibles.value || []).find(s => s && s.id === semanaId.value) || semanasDisponibles.value[0] || null);

const registros = ref([]);
const mensajeWA = ref('');

async function cargar() {
  try {
    registros.value = await api.getRegistrosDeSemana(semanaId.value);
    prepararWhatsApp();
  } catch (e) {
    console.error('[Exportar] Error cargando:', e);
    registros.value = [];
  }
}

function prepararWhatsApp() {
  if (registros.value.length === 0) {
    mensajeWA.value = '';
    return;
  }
  let text = `🚌 *TRANSPORTE TIERRA DE HUMOS*\n`;
  text += `📍 *Ruta: Tlaxiaco - Putla*\n`;
  text += `📅 *${semanaObj.value?.label || 'Semana'}*\n`;
  text += `-----------------------------------\n`;

  registros.value.forEach(r => {
    const estado = r.estado === 'pendiente' ? '⏳ PENDIENTE' : '✅ COMPLETADO';
    text += `📅 *${formatFechaLarga(r.fecha)}*\n`;
    text += `🚐 *Unidad ${r.numero_unidad}* (${r.nombre_conductor}) [${estado}]\n`;
    text += `  • Bitácora 1 (Tlax→Put): *$${r.bitacora_tlaxiaco_putla}*\n`;
    text += `  • Bitácora 2 (Put→Tlax): *$${r.bitacora_putla_tlaxiaco || 0}*\n`;
    text += `  • Intermedios: *$${r.intermedios || 0}*\n`;
    text += `  • Total Generado: *$${r.total_generado}*\n`;
    text += `  • Combustible: -$${r.combustible} | Imprevistos: -$${r.gastos_imprevistos || 0}\n`;
    text += `  💵 *GANANCIA NETA: $${r.total_neto}*\n`;
    text += `-----------------------------------\n`;
  });

  const completados = registros.value.filter(r => r.estado === 'completado');
  const genTotal = completados.reduce((s, r) => s + (Number(r.total_generado) || 0), 0);
  const combTotal = completados.reduce((s, r) => s + (Number(r.combustible) || 0), 0);
  const netoTotal = completados.reduce((s, r) => s + (Number(r.total_neto) || 0), 0);

  text += `📊 *TOTALES SEMANALES*\n`;
  text += `  • Total Generado: *$${genTotal.toFixed(2)}*\n`;
  text += `  • Total Combustible: *$${combTotal.toFixed(2)}*\n`;
  text += `  🏆 *NETO TOTAL: $${netoTotal.toFixed(2)}*\n`;

  mensajeWA.value = text;
}

function generarPDFClick() {
  exportarPDF(registros.value, semanaObj.value);
}

function generarExcelClick() {
  exportarExcel(registros.value, semanaObj.value);
}

function abrirWA() {
  const url = `https://wa.me/?text=${encodeURIComponent(mensajeWA.value)}`;
  window.open(url, '_blank');
}

async function descargarCopiaSeguridad() {
  try {
    const backup = await api.getBackupData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const fechaHoy = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Respaldo_Transporte_Tierra_De_Humos_${fechaHoy}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert('✅ Copia de seguridad descargada exitosamente. Puedes guardarla en tu carpeta de OneDrive o Google Drive.');
  } catch (e) {
    alert('❌ Error al exportar respaldo: ' + e.message);
  }
}

async function restaurarCopiaSeguridad(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!confirm('⚠️ ¿Estás seguro de restaurar este respaldo? Reemplazará la base de datos actual con la información del archivo.')) return;
      await api.restoreBackupData(parsed);
      alert('✅ Base de datos restaurada correctamente.');
      window.location.reload();
    } catch (err) {
      alert('❌ Error al leer el archivo de respaldo: ' + err.message);
    }
  };
  reader.readAsText(file);
}

onMounted(cargar);
</script>

<style scoped>
.semana-select-mini {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-red);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  background: white;
  cursor: pointer;
}

.export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.export-card {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.backup-card {
  border-color: #bae6fd;
  background: #f0f9ff;
}

.backup-card h3 {
  color: #0284c7 !important;
}

.export-card .icon {
  font-size: 3rem;
}

.export-card h3 {
  font-size: 1.1rem;
  color: var(--accent-red);
}

.export-card p {
  font-size: 0.85rem;
  color: var(--text-muted);
  flex: 1;
}

.empty-msg {
  color: #64748b;
  font-size: 0.95rem;
}
</style>
