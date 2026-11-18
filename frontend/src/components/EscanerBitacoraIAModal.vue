<template>
  <div class="modal-overlay" @click.self="$emit('cerrar')">
    <div class="modal-box ia-scanner-modal">

      <!-- ── ENCABEZADO ─────────────────────────────────────────────── -->
      <div class="modal-header ia-header">
        <div class="ia-header-left">
          <span class="ia-icon-big">📸</span>
          <div>
            <h3>Escáner Inteligente IA — Control de Corridas</h3>
            <small>
              Analiza la foto de la bitácora por <strong>color de lapicero del nombre del conductor</strong>
              y calcula totales automáticamente · Fecha destino: <strong>{{ fechaDestino }}</strong>
            </small>
          </div>
        </div>
        <div class="ia-header-right">
          <span class="quota-pill" :class="intentosRestantes === 0 && !auth.isAdmin ? 'quota-empty' : 'quota-ok'">
            <template v-if="auth.isAdmin">👑 Admin: Escaneos ilimitados</template>
            <template v-else>🎟️ Te quedan {{ intentosRestantes }}/{{ maxIntentos }} fotos hoy</template>
          </span>
          <button @click="mostrarConfigKey = !mostrarConfigKey" class="btn-config-key" title="Configurar llave gratuita de Google Gemini">
            🔑 API Key
          </button>
          <button @click="$emit('cerrar')" class="modal-close">✕</button>
        </div>
      </div>

      <!-- ── PANEL CONFIGURACIÓN DE API KEY (COLAPSABLE) ────────────── -->
      <div v-if="mostrarConfigKey" class="api-key-banner">
        <div class="api-key-info">
          <strong>🔑 Llave de Google Gemini Flash (100% Gratis — 1,500 fotos/día):</strong>
          <span>
            Obtén tu llave gratuita en
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>
            y pégala aquí. Si la dejas vacía, puedes probar el flujo con el <strong>Modo Demo de tu Hoja Viernes</strong>.
          </span>
        </div>
        <div class="api-key-input-row">
          <input
            type="password"
            v-model="apiKeyInput"
            class="form-input"
            placeholder="AIzaSy... (Pega aquí tu Gemini API Key)"
          />
          <button @click="guardarKey" class="btn btn-sm btn-save-key">💾 Guardar Llave</button>
        </div>
      </div>

      <div class="modal-body ia-body">

        <!-- ── PASO 1: SELECCIONAR COLOR DE LAPICERO Y SUBIR FOTO ──── -->
        <div class="ia-controls-bar">
          <!-- Selector de color de lapicero -->
          <div class="pen-selector-box">
            <label class="pen-label">
              🖊️ 1. ¿Con qué color de lapicero empieza el nombre del conductor en TU turno?
            </label>
            <div class="pen-pills-row">
              <button
                v-for="op in opcionesLapicero"
                :key="op.id"
                type="button"
                @click="cambiarColorLapicero(op.id)"
                class="pen-pill"
                :class="{ 'pen-pill-active': colorLapicero === op.id }"
                :style="colorLapicero === op.id ? { borderColor: op.hex, background: op.bg, color: op.hex } : {}"
              >
                <span class="pen-dot" :style="{ background: op.hex }"></span>
                {{ op.label }}
              </button>
            </div>
            <small class="pen-hint">
              💡 El sistema ignora el color del número de unidad y toma las filas donde el <strong>Conductor / Bitácora 1</strong>
              esté en tu color (o donde hayas cerrado con tu color una vuelta pendiente del turno anterior).
            </small>
          </div>

          <!-- Botones para Tomar / Subir Foto -->
          <div class="photo-actions-box">
            <label class="pen-label">📷 2. Capturar con cámara o elegir foto de tus archivos</label>
            <div class="photo-btns-row">
              <!-- Input oculto para subir archivo -->
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="onFileSelected"
                style="display:none;"
              />
              <!-- Input oculto con capture nativo para celular -->
              <input
                ref="cameraNativeInputRef"
                type="file"
                accept="image/*"
                capture="environment"
                @change="onFileSelected"
                style="display:none;"
              />

              <div class="photo-dual-btns">
                <button
                  type="button"
                  @click="dispararSelectorArchivo"
                  class="btn-upload-photo"
                  :class="{ 'btn-disabled': !puedeEscanear || analizando }"
                  :disabled="!puedeEscanear || analizando"
                >
                  📁 Subir Foto
                </button>

                <button
                  type="button"
                  @click="solicitarCamaraConAlertaFuturista"
                  class="btn-camera-photo"
                  :class="{ 'btn-disabled': !puedeEscanear || analizando }"
                  :disabled="!puedeEscanear || analizando"
                >
                  📸 Tomar Foto (Cámara)
                </button>
              </div>

              <button
                type="button"
                @click="cargarDemoHojaReal"
                class="btn-demo-photo"
                :disabled="analizando"
                title="Simula la lectura con los 25 renglones reales de tu foto del Viernes (Azul + Negro)"
              >
                🧪 Probar con Hoja Ejemplo (Viernes Azul/Negro)
              </button>
            </div>
          </div>
        </div>

        <!-- ── VISOR DE CÁMARA EN VIVO (PC Y CELULAR) ──────────────── -->
        <div v-if="camaraActiva" class="camera-live-box">
          <div class="camera-live-header">
            <strong>📹 Cámara activa — Enfoca la hoja de Control de Corridas</strong>
            <button type="button" @click="cerrarCamaraWeb" class="btn-close-cam">✕ Cerrar cámara</button>
          </div>
          <video ref="videoRef" autoplay playsinline class="camera-video-preview"></video>
          <div class="camera-live-Controls">
            <button type="button" @click="capturarFotoDeCamara" class="btn btn-red btn-lg">
              📸 Capturar Foto Ahora
            </button>
          </div>
        </div>

        <!-- ── ESTADO: ANALIZANDO CON IA ───────────────────────────── -->
        <div v-if="analizando" class="ia-loading-box">
          <div class="ia-spinner">🤖</div>
          <h4>Analizando caligrafía, columnas y colores de lapicero...</h4>
          <p>Leyendo Unidad, Conductor, Bitácora 1, Bitácora 2, Intermedios y Gasolina ($600)...</p>
        </div>

        <!-- ── ERROR SI OCURRE ─────────────────────────────────────── -->
        <div v-if="errorMsg" class="ia-error-box">
          <span>⚠️ {{ errorMsg }}</span>
          <button v-if="faltaApiKey" @click="cargarDemoHojaReal" class="btn-demo-inline">
            Usar lectura de demostración ahora
          </button>
        </div>

        <!-- ── PASO 2: VISTA PREVIA INTERACTIVA DE DATOS DETECTADOS ── -->
        <div v-if="filasClasificadas.length > 0 && !analizando" class="ia-preview-section">

          <!-- Mini barra de resumen de lo que se encontró -->
          <div class="ia-summary-strip">
            <div class="ia-sum-left">
              <img v-if="imagenPreviewUrl" :src="imagenPreviewUrl" alt="Hoja" class="thumb-hoja" @click="verImagenGrande = !verImagenGrande" title="Clic para ampliar foto" />
              <div>
                <div class="ia-detected-title">
                  📋 {{ filasClasificadas.length }} renglones leídos en la hoja
                  <span v-if="fechaDetectadaTexto" class="detected-date-tag">({{ fechaDetectadaTexto }})</span>
                </div>
                <div class="ia-badges-resumen">
                  <span class="b-res b-res-sel">✅ {{ filasSeleccionadas.length }} seleccionadas para guardar</span>
                  <span class="b-res b-res-cierre" v-if="conteoCierres > 0">🔄 {{ conteoCierres }} cierres de vueltas pendientes</span>
                  <span class="b-res b-res-skip" v-if="conteoOmitidas > 0">⏭️ {{ conteoOmitidas }} de otro turno / ya registradas</span>
                </div>
              </div>
            </div>

            <div class="ia-sum-right">
              <div class="ia-tot-pill">
                <span>Total Gen. Seleccionado:</span>
                <strong>${{ totalGenSeleccionado.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</strong>
              </div>
              <div class="ia-tot-pill">
                <span>Combustible:</span>
                <strong style="color:#d97706;">${{ totalCombSeleccionado.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</strong>
              </div>
              <div class="ia-tot-pill ia-tot-neto">
                <span>Neto Calculado:</span>
                <strong :class="totalNetoSeleccionado < 0 ? 'text-red' : 'text-green'">
                  ${{ totalNetoSeleccionado.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}
                </strong>
              </div>
            </div>
          </div>

          <!-- Foto ampliada opcional -->
          <div v-if="verImagenGrande && imagenPreviewUrl" class="foto-zoom-box">
            <img :src="imagenPreviewUrl" alt="Foto completa de bitácora" />
          </div>

          <!-- Tabla editable con todos los renglones detectados -->
          <div class="table-responsive ia-table-wrap">
            <table class="table ia-preview-table">
              <thead>
                <tr>
                  <th style="width:42px; text-align:center;">
                    <input type="checkbox" :checked="todasSeleccionadas" @change="toggleTodas" title="Seleccionar / Desmarcar todas" />
                  </th>
                  <th style="width:45px;">Fila</th>
                  <th style="width:125px;">Tinta Detectada</th>
                  <th style="width:85px;">No. UD</th>
                  <th>Conductor / Dueño</th>
                  <th class="text-right" style="width:110px;">Bit. 1 (Tlax-Put)</th>
                  <th class="text-right" style="width:110px;">Bit. 2 (Put-Tlax)</th>
                  <th class="text-right" style="width:110px;">Intermedios</th>
                  <th class="text-right" style="width:100px;">Total Gen.</th>
                  <th class="text-right" style="width:100px;">Gasolina</th>
                  <th class="text-right" style="width:105px;">Total Neto</th>
                  <th style="width:165px;">Estado / Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="fila in filasClasificadas"
                  :key="fila.id_temp"
                  :class="{
                    'ia-row-selected': fila.seleccionada,
                    'ia-row-skipped': !fila.seleccionada,
                    'ia-row-cierre': fila.accion === 'completar_pendiente'
                  }"
                >
                  <td style="text-align:center;">
                    <input
                      type="checkbox"
                      v-model="fila.seleccionada"
                      :disabled="fila.accion === 'ya_registrada'"
                    />
                  </td>
                  <td class="font-mono font-bold" style="color:#64748b;">#{{ fila.fila_num }}</td>

                  <!-- Color de lapicero detectado -->
                  <td>
                    <div class="tinta-badges-col">
                      <span class="tinta-tag" :class="'tinta-' + fila.color_conductor_bit1">
                        🖊️ {{ fila.color_conductor_bit1.toUpperCase() }}
                      </span>
                      <span
                        v-if="fila.color_bit2_inter && fila.color_bit2_inter !== fila.color_conductor_bit1"
                        class="tinta-tag"
                        :class="'tinta-' + fila.color_bit2_inter"
                        title="Cierre escrito con otro color de lapicero"
                      >
                        ➔ {{ fila.color_bit2_inter.toUpperCase() }}
                      </span>
                    </div>
                  </td>

                  <!-- Unidad editable -->
                  <td>
                    <input
                      type="text"
                      v-model="fila.numero_unidad"
                      @input="onCambioUnidadFila(fila)"
                      class="ia-cell-input ia-input-unit"
                      :disabled="!fila.seleccionada || fila.accion === 'completar_pendiente'"
                    />
                  </td>

                  <!-- Conductor editable -->
                  <td>
                    <input
                      type="text"
                      v-model="fila.nombre_conductor"
                      class="ia-cell-input ia-input-name"
                      :disabled="!fila.seleccionada || fila.accion === 'completar_pendiente'"
                    />
                    <small v-if="fila.dueno_nombre" class="dueno-mini-tag">Dueño: {{ fila.dueno_nombre }}</small>
                  </td>

                  <!-- Bitácora 1 -->
                  <td>
                    <input
                      type="number"
                      v-model.number="fila.bitacora_tlaxiaco_putla"
                      class="ia-cell-input text-right font-mono"
                      min="0"
                      :disabled="!fila.seleccionada || fila.accion === 'completar_pendiente'"
                    />
                  </td>

                  <!-- Bitácora 2 -->
                  <td>
                    <input
                      type="number"
                      v-model.number="fila.bitacora_putla_tlaxiaco"
                      class="ia-cell-input text-right font-mono"
                      min="0"
                      :disabled="!fila.seleccionada || fila.estado_destino === 'pendiente'"
                    />
                  </td>

                  <!-- Intermedios -->
                  <td>
                    <input
                      type="number"
                      v-model.number="fila.intermedios"
                      class="ia-cell-input text-right font-mono"
                      min="0"
                      :disabled="!fila.seleccionada || fila.estado_destino === 'pendiente'"
                    />
                  </td>

                  <!-- Total Generado (Automático) -->
                  <td class="text-right font-mono font-bold">
                    ${{ calcGeneradoFila(fila).toLocaleString('es-MX') }}
                  </td>

                  <!-- Gasolina -->
                  <td>
                    <input
                      type="number"
                      v-model.number="fila.combustible"
                      class="ia-cell-input text-right font-mono"
                      style="color:#d97706; font-weight:800;"
                      min="0"
                      step="50"
                      :disabled="!fila.seleccionada || fila.estado_destino === 'pendiente'"
                    />
                  </td>

                  <!-- Total Neto (Automático) -->
                  <td
                    class="text-right font-mono font-bold"
                    :class="calcNetoFila(fila) < 0 ? 'text-red' : 'text-green'"
                  >
                    ${{ calcNetoFila(fila).toLocaleString('es-MX') }}
                  </td>

                  <!-- Acción / Estado -->
                  <td>
                    <div v-if="fila.accion === 'ya_registrada'" class="accion-chip chip-skip">
                      ✓ Ya guardada ({{ fila.capturado_por_nombre_original }})
                    </div>
                    <div v-else-if="fila.accion === 'completar_pendiente'" class="accion-chip chip-cierre">
                      🔄 Cierra pendiente de {{ fila.capturado_por_nombre_original }}
                    </div>
                    <div v-else class="estado-toggle-wrap">
                      <select v-model="fila.estado_destino" @change="onCambioEstadoFila(fila)" class="ia-estado-select" :class="fila.estado_destino === 'pendiente' ? 'sel-pend' : 'sel-comp'">
                        <option value="completado">✅ Completado</option>
                        <option value="pendiente">⏳ Pendiente (Solo Bit.1)</option>
                      </select>
                      <small class="motivo-mini">{{ fila.motivo }}</small>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ── PIE DEL MODAL ─────────────────────────────────────────── -->
      <div class="modal-footer ia-footer">
        <div class="ia-footer-hint">
          💡 Puedes corregir cualquier número o desmarcar filas antes de guardar. Los totales se calculan solos.
        </div>
        <div class="ia-footer-btns">
          <button @click="$emit('cerrar')" class="btn btn-secondary">Cancelar</button>
          <button
            v-if="filasClasificadas.length > 0"
            @click="confirmarYGuardarTodo"
            class="btn btn-red btn-lg"
            :disabled="guardandoLote || filasSeleccionadas.length === 0"
          >
            <span v-if="guardandoLote">⏳ Guardando {{ progresoGuardado }}/{{ filasSeleccionadas.length }}...</span>
            <span v-else>✅ Confirmar y Guardar {{ filasSeleccionadas.length }} Vuelta(s)</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useAuthStore } from '../stores/auth';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  getIntentosRestantesHoy,
  registrarIntentoExitosoHoy,
  MAX_SCANS_PER_DAY,
  comprimirImagenBase64,
  analizarHojaConGemini,
  obtenerLecturaDemoRealista,
  clasificarFilasEscaneadas,
  normalizarNumeroUnidad
} from '../services/iaVisionService';

const props = defineProps({
  fechaDestino: { type: String, required: true },
  registrosExistentesDelDia: { type: Array, default: () => [] },
  unidadesCatalogo: { type: Array, default: () => [] }
});

const emit = defineEmits(['cerrar', 'guardado']);

const auth = useAuthStore();

// Control de API Key
const mostrarConfigKey = ref(false);
const apiKeyInput      = ref(getGeminiApiKey());
const faltaApiKey      = ref(false);

function guardarKey() {
  setGeminiApiKey(apiKeyInput.value);
  mostrarConfigKey.value = false;
  faltaApiKey.value = false;
  errorMsg.value = '';
  toast.success('API Key Guardada', 'El motor de visión Google Gemini Flash está activo y listo.');
}

// Control de límite de 2 fotos por día por usuario
const maxIntentos = MAX_SCANS_PER_DAY;
const intentosRestantes = ref(
  getIntentosRestantesHoy(auth.currentUser?.id, auth.isAdmin)
);
const puedeEscanear = computed(() => auth.isAdmin || intentosRestantes.value > 0);

// Opciones de color de lapicero
const opcionesLapicero = [
  { id: 'todos', label: '🌈 Todos los colores', hex: '#475569', bg: '#f1f5f9' },
  { id: 'azul',  label: '🔵 Lapicero Azul',     hex: '#1d4ed8', bg: '#eff6ff' },
  { id: 'negro', label: '⚫ Lapicero Negro',    hex: '#0f172a', bg: '#f1f5f9' },
  { id: 'rojo',  label: '🔴 Lapicero Rojo',     hex: '#dc2626', bg: '#fef2f2' },
  { id: 'verde', label: '🟢 Lapicero Verde',    hex: '#15803d', bg: '#f0fdf4' }
];

const colorLapicero = ref('todos');

// Estado del análisis
const analizando          = ref(false);
const errorMsg            = ref('');
const imagenPreviewUrl    = ref('');
const verImagenGrande     = ref(false);
const fechaDetectadaTexto = ref('');
const filasCrudasIA       = ref([]);
const filasClasificadas   = ref([]);

// Estado de guardado por lote
const guardandoLote    = ref(false);
const progresoGuardado = ref(0);

// Referencias para subir archivo o usar cámara en vivo
const fileInputRef         = ref(null);
const cameraNativeInputRef = ref(null);
const videoRef             = ref(null);
const camaraActiva         = ref(false);
let mediaStream            = null;

function dispararSelectorArchivo() {
  if (!puedeEscanear.value || analizando.value) return;
  toast.info('Selector de Imagen', 'Elige la fotografía de la hoja de Control de Corridas.');
  fileInputRef.value?.click();
}

function solicitarCamaraConAlertaFuturista() {
  if (!puedeEscanear.value || analizando.value) return;
  // En lugar de disparar de golpe el cuadro gris del navegador ("localhost quiere usar cámaras"),
  // mostramos la notificación futurista en la esquina superior izquierda con confirmación elegante:
  toast.camera(
    'Módulo Óptico IA — Cámara Disponible',
    '¿Deseas activar el visor de cámara para escanear la hoja de Control de Corridas?',
    '⚡ Activar Cámara Ahora',
    () => {
      abrirCamaraWeb();
    },
    8000
  );
}

async function abrirCamaraWeb() {
  if (!puedeEscanear.value || analizando.value) return;
  errorMsg.value = '';
  toast.camera(
    'Iniciando Lente de Visión IA',
    'Activando cámara para escanear la hoja de Control de Corridas...'
  );
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.info('Selector de Imagen Activado', 'Selecciona la fotografía de la bitácora desde tu dispositivo.');
      dispararSelectorArchivo();
      return;
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 } },
      audio: false
    });
    camaraActiva.value = true;
    toast.success('Cámara Lista', 'Enfoca la tabla de corridas y presiona Capturar Foto.');
    setTimeout(() => {
      if (videoRef.value && mediaStream) {
        videoRef.value.srcObject = mediaStream;
      }
    }, 80);
  } catch (e) {
    console.warn('[Camara] No se pudo abrir cámara directa, abriendo selector:', e);
    toast.warning(
      'Cámara en Modo Archivo',
      'Se abrió el selector de archivos para que elijas la foto de la hoja.'
    );
    dispararSelectorArchivo();
  }
}

function cerrarCamaraWeb() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  camaraActiva.value = false;
}

async function capturarFotoDeCamara() {
  if (!videoRef.value) return;
  const video = videoRef.value;
  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 960;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  cerrarCamaraWeb();

  canvas.toBlob(async blob => {
    if (!blob) return;
    const file = new File([blob], 'captura_camara.jpg', { type: 'image/jpeg' });
    await procesarArchivoImagen(file);
  }, 'image/jpeg', 0.85);
}

onBeforeUnmount(() => {
  cerrarCamaraWeb();
});

function cambiarColorLapicero(nuevoColor) {
  colorLapicero.value = nuevoColor;
  if (filasCrudasIA.value.length > 0) {
    reclasificar();
  }
}

function reclasificar() {
  filasClasificadas.value = clasificarFilasEscaneadas({
    filasIA: filasCrudasIA.value,
    colorLapiceroUsuario: colorLapicero.value,
    registrosExistentesDelDia: props.registrosExistentesDelDia,
    unidadesCatalogo: props.unidadesCatalogo
  });
}

async function onFileSelected(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  await procesarArchivoImagen(file);
  ev.target.value = '';
}

async function procesarArchivoImagen(file) {
  if (!puedeEscanear.value) {
    errorMsg.value = 'Ya utilizaste tus 2 oportunidades de escaneo con IA del día de hoy.';
    toast.warning('Cuota Diaria Agotada', 'Has alcanzado el límite de 2 fotografías analizadas con IA por día.');
    return;
  }

  errorMsg.value = '';
  faltaApiKey.value = false;
  analizando.value = true;
  toast.info('Escaneando Bitácora con IA', 'Analizando caligrafía, números y colores de tinta...');

  try {
    const { dataUrl, base64, mimeType } = await comprimirImagenBase64(file);
    imagenPreviewUrl.value = dataUrl;

    const resultado = await analizarHojaConGemini({
      base64,
      mimeType,
      unidadesCatalogo: props.unidadesCatalogo
    });

    fechaDetectadaTexto.value = resultado.fecha_detectada || '';
    filasCrudasIA.value = Array.isArray(resultado.filas) ? resultado.filas : [];
    reclasificar();

    toast.success(
      'Lectura IA Completada',
      `Se detectaron ${filasCrudasIA.value.length} renglones en la hoja. Revisa la vista previa antes de guardar.`
    );

    // Descontar 1 intento exitoso al usuario
    if (!auth.isAdmin && filasCrudasIA.value.length > 0) {
      registrarIntentoExitosoHoy(auth.currentUser?.id);
      intentosRestantes.value = getIntentosRestantesHoy(auth.currentUser?.id, auth.isAdmin);
    }
  } catch (err) {
    if (err.message === 'NO_API_KEY') {
      faltaApiKey.value = true;
      mostrarConfigKey.value = true;
      errorMsg.value = 'Recibí tu foto correctamente. Como aún no has pegado tu API Key gratuita de Google Gemini, te cargué la vista previa de demostración con los datos de tu hoja para que veas cómo funciona.';
      const demo = obtenerLecturaDemoRealista();
      fechaDetectadaTexto.value = demo.fecha_detectada;
      filasCrudasIA.value = demo.filas;
      reclasificar();
      toast.info(
        'Modo Demostración Activado',
        'Imagen procesada con lectura de muestra (25 corridas Azul/Negro). Configura tu API Key para lectura en vivo.'
      );
    } else {
      errorMsg.value = err.message || 'No se pudo analizar la imagen.';
      toast.error('Error en Análisis IA', errorMsg.value);
    }
  } finally {
    analizando.value = false;
  }
}

function cargarDemoHojaReal() {
  errorMsg.value = '';
  faltaApiKey.value = false;
  const demo = obtenerLecturaDemoRealista();
  fechaDetectadaTexto.value = demo.fecha_detectada;
  filasCrudasIA.value = demo.filas;
  reclasificar();
  toast.info(
    'Hoja Viernes Cargada (Azul / Negro)',
    'Se cargaron 25 corridas detectando colores de lapicero. Cambia entre Azul y Negro para filtrar cada turno.'
  );
}

function onCambioUnidadFila(fila) {
  const num = normalizarNumeroUnidad(fila.numero_unidad);
  const u = props.unidadesCatalogo.find(x => normalizarNumeroUnidad(x.numero) === num);
  fila.dueno_nombre = u?.dueno?.nombre || '';
}

function onCambioEstadoFila(fila) {
  if (fila.estado_destino === 'pendiente') {
    fila.bitacora_putla_tlaxiaco = 0;
    fila.intermedios = 0;
    fila.combustible = 0;
  } else if (fila.combustible === 0) {
    fila.combustible = 600;
  }
}

function calcGeneradoFila(fila) {
  return (Number(fila.bitacora_tlaxiaco_putla) || 0) +
         (Number(fila.bitacora_putla_tlaxiaco) || 0) +
         (Number(fila.intermedios) || 0);
}

function calcNetoFila(fila) {
  return calcGeneradoFila(fila) - (Number(fila.combustible) || 0);
}

const filasSeleccionadas = computed(() =>
  filasClasificadas.value.filter(f => f.seleccionada && f.accion !== 'ya_registrada')
);

const conteoCierres = computed(() =>
  filasSeleccionadas.value.filter(f => f.accion === 'completar_pendiente').length
);

const conteoOmitidas = computed(() =>
  filasClasificadas.value.filter(f => !f.seleccionada).length
);

const todasSeleccionadas = computed(() => {
  const elegibles = filasClasificadas.value.filter(f => f.accion !== 'ya_registrada');
  return elegibles.length > 0 && elegibles.every(f => f.seleccionada);
});

function toggleTodas(ev) {
  const checked = ev.target.checked;
  filasClasificadas.value.forEach(f => {
    if (f.accion !== 'ya_registrada') {
      f.seleccionada = checked;
    }
  });
}

const totalGenSeleccionado = computed(() =>
  filasSeleccionadas.value.reduce((acc, f) => acc + calcGeneradoFila(f), 0)
);
const totalCombSeleccionado = computed(() =>
  filasSeleccionadas.value.reduce((acc, f) => acc + (Number(f.combustible) || 0), 0)
);
const totalNetoSeleccionado = computed(() =>
  filasSeleccionadas.value.reduce((acc, f) => acc + calcNetoFila(f), 0)
);

async function confirmarYGuardarTodo() {
  if (filasSeleccionadas.value.length === 0) return;
  guardandoLote.value = true;
  progresoGuardado.value = 0;

  try {
    const baseOrden = Date.now();
    for (let i = 0; i < filasSeleccionadas.value.length; i++) {
      const f = filasSeleccionadas.value[i];
      progresoGuardado.value = i + 1;

      if (f.accion === 'completar_pendiente' && f.registro_existente) {
        // Cierra la vuelta que inició la Taquillera A y asigna Bit2 + Inter - Comb a la Taquillera B actual
        await api.guardarRegistro({
          ...f.registro_existente,
          bitacora_putla_tlaxiaco: Number(f.bitacora_putla_tlaxiaco) || 0,
          intermedios:             Number(f.intermedios) || 0,
          combustible:             Number(f.combustible) || 0,
          estado:                  'completado',
          completado_por_id:       auth.currentUser?.id     || '',
          completado_por_nombre:   auth.currentUser?.nombre || ''
        });
      } else {
        // Nueva vuelta capturada por la taquillera actual
        await api.guardarRegistro({
          fecha:                   props.fechaDestino,
          numero_unidad:           normalizarNumeroUnidad(f.numero_unidad),
          nombre_conductor:        (f.nombre_conductor || '').trim(),
          dueno_nombre:            f.dueno_nombre || '',
          vueltas_dadas:           1,
          bitacora_tlaxiaco_putla: Number(f.bitacora_tlaxiaco_putla) || 0,
          bitacora_putla_tlaxiaco: f.estado_destino === 'pendiente' ? 0 : (Number(f.bitacora_putla_tlaxiaco) || 0),
          intermedios:             f.estado_destino === 'pendiente' ? 0 : (Number(f.intermedios) || 0),
          combustible:             f.estado_destino === 'pendiente' ? 0 : (Number(f.combustible) || 0),
          gastos_imprevistos:      0,
          concepto_gastos:         '',
          estado:                  f.estado_destino,
          orden:                   baseOrden + i,
          capturado_por_id:        auth.currentUser?.id     || '',
          capturado_por_nombre:    auth.currentUser?.nombre || ''
        });
      }
    }

    toast.success(
      'Corridas Guardadas con Éxito',
      `Se registraron ${filasSeleccionadas.value.length} vuelta(s) en la base de datos para el día ${props.fechaDestino}.`
    );
    emit('guardado', filasSeleccionadas.value.length);
  } catch (e) {
    toast.error('Error Guardando Lote Escaneado', e.message);
  } finally {
    guardandoLote.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(2px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-box {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  animation: modalFadeIn 0.18s ease;
}

@keyframes modalFadeIn {
  from { transform: scale(0.95); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.modal-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #ffffff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover {
  background: #dc2626;
}

.ia-scanner-modal {
  max-width: 1280px;
  width: 96%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.ia-header {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #ffffff;
  border-bottom: 3px solid #dc2626;
  padding: 1rem 1.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.ia-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 900;
}
.ia-header small {
  color: #cbd5e1;
  font-size: 0.78rem;
}
.ia-header-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.ia-icon-big {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.45rem 0.65rem;
  border-radius: 12px;
}
.ia-header-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.quota-pill {
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 900;
}
.quota-ok {
  background: #065f46;
  color: #ecfdf5;
  border: 1px solid #34d399;
}
.quota-empty {
  background: #7f1d1d;
  color: #fef2f2;
  border: 1px solid #f87171;
}
.btn-config-key {
  background: rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.btn-config-key:hover {
  background: rgba(255, 255, 255, 0.22);
}

/* ── API Key Banner ── */
.api-key-banner {
  background: #fffbeb;
  border-bottom: 2px solid #f59e0b;
  padding: 0.85rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.api-key-info {
  font-size: 0.8rem;
  color: #78350f;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.api-key-info a {
  color: #1d4ed8;
  font-weight: 800;
  text-decoration: underline;
}
.api-key-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.btn-save-key {
  background: #d97706;
  color: #ffffff;
  border: none;
  font-weight: 800;
  white-space: nowrap;
  padding: 0.48rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
}

/* ── Cuerpo del Modal ── */
.ia-body {
  padding: 1.1rem 1.4rem;
  overflow-y: auto;
  flex: 1;
}

.ia-controls-bar {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.pen-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 0.5rem;
}
.pen-pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.pen-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.75rem;
  border-radius: 20px;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}
.pen-pill-active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.pen-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.pen-hint {
  display: block;
  margin-top: 0.45rem;
  font-size: 0.73rem;
  color: #64748b;
}

.photo-btns-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.photo-dual-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.btn-upload-photo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #ffffff;
  font-weight: 900;
  font-size: 0.85rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
  border: none;
}
.btn-camera-photo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #ffffff;
  font-weight: 900;
  font-size: 0.85rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
  border: none;
}
.btn-upload-photo.btn-disabled,
.btn-camera-photo.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.camera-live-box {
  background: #0f172a;
  color: #ffffff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}
.camera-live-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
  font-size: 0.85rem;
}
.btn-close-cam {
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.camera-video-preview {
  width: 100%;
  max-height: 360px;
  border-radius: 8px;
  background: #000;
  object-fit: contain;
}
.camera-live-Controls {
  margin-top: 0.75rem;
}
.btn-demo-photo {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1.5px solid #93c5fd;
  font-weight: 800;
  font-size: 0.78rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
}
.btn-demo-photo:hover {
  background: #dbeafe;
}

/* ── Loading & Error ── */
.ia-loading-box {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #f8fafc;
  border: 2px dashed #94a3b8;
  border-radius: 12px;
}
.ia-spinner {
  font-size: 3rem;
  animation: pulse 1.2s infinite ease-in-out;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.ia-error-box {
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.83rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.btn-demo-inline {
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
}

/* ── Resumen Strip ── */
.ia-summary-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  background: #0f172a;
  color: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 10px 10px 0 0;
}
.ia-sum-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.thumb-hoja {
  width: 46px;
  height: 58px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #f8fafc;
  cursor: zoom-in;
}
.ia-detected-title {
  font-weight: 900;
  font-size: 0.92rem;
}
.detected-date-tag {
  color: #93c5fd;
  font-size: 0.8rem;
  margin-left: 0.35rem;
}
.ia-badges-resumen {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.25rem;
}
.b-res {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.12rem 0.5rem;
  border-radius: 12px;
}
.b-res-sel    { background: #065f46; color: #a7f3d0; }
.b-res-cierre { background: #1e40af; color: #bfdbfe; }
.b-res-skip   { background: #334155; color: #cbd5e1; }

.ia-sum-right {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.ia-tot-pill {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  font-size: 0.78rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.ia-tot-pill span {
  font-size: 0.66rem;
  color: #94a3b8;
}
.ia-tot-pill strong {
  font-size: 0.92rem;
  font-family: monospace;
}

.foto-zoom-box {
  background: #0f172a;
  padding: 0.75rem;
  text-align: center;
}
.foto-zoom-box img {
  max-height: 360px;
  border-radius: 8px;
}

/* ── Tabla de Vista Previa ── */
.ia-table-wrap {
  border: 1.5px solid #cbd5e1;
  border-top: none;
  border-radius: 0 0 10px 10px;
  max-height: 440px;
  overflow-y: auto;
}
.ia-preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.ia-preview-table thead th {
  position: sticky;
  top: 0;
  background: #f1f5f9;
  color: #334155;
  font-weight: 900;
  font-size: 0.72rem;
  text-transform: uppercase;
  padding: 0.55rem 0.5rem;
  border-bottom: 2px solid #cbd5e1;
  z-index: 2;
}
.ia-preview-table tbody td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}
.ia-row-selected {
  background: #ffffff;
}
.ia-row-skipped {
  background: #f8fafc;
  opacity: 0.58;
}
.ia-row-cierre {
  background: #eff6ff !important;
}

/* Tinta tags */
.tinta-badges-col {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.tinta-tag {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 900;
}
.tinta-azul  { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
.tinta-negro { background: #e2e8f0; color: #0f172a; border: 1px solid #94a3b8; }
.tinta-rojo  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.tinta-verde { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.tinta-lapiz { background: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }

/* Inputs dentro de la tabla */
.ia-cell-input {
  width: 100%;
  padding: 0.28rem 0.4rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  background: #ffffff;
}
.ia-cell-input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
}
.ia-input-unit {
  text-align: center;
  font-weight: 900;
}
.dueno-mini-tag {
  display: block;
  font-size: 0.65rem;
  color: #059669;
  font-weight: 800;
}

/* Chips de acción */
.accion-chip {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
}
.chip-skip {
  background: #e2e8f0;
  color: #475569;
}
.chip-cierre {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}
.ia-estado-select {
  width: 100%;
  padding: 0.22rem 0.35rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 800;
}
.sel-comp {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #86efac;
}
.sel-pend {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fcd34d;
}
.motivo-mini {
  display: block;
  font-size: 0.63rem;
  color: #64748b;
  margin-top: 0.1rem;
}

/* Footer */
.ia-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.9rem 1.4rem;
  background: #f8fafc;
  border-top: 1.5px solid #e2e8f0;
}
.ia-footer-hint {
  font-size: 0.76rem;
  color: #475569;
  font-weight: 700;
}
.ia-footer-btns {
  display: flex;
  gap: 0.6rem;
}

@media (max-width: 860px) {
  .ia-controls-bar {
    grid-template-columns: 1fr;
  }
}
</style>
