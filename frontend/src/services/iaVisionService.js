/**
 * SERVICIO DE VISIÓN IA — ESCÁNER DE BITÁCORA "CONTROL DE CORRIDAS"
 * TRANSPORTE TIERRA DE HUMO — TLAXIACO ⇄ PUTLA
 *
 * Analiza la foto de la hoja física de corridas usando Google Gemini 2.5 Flash
 * (con Modo Demo Inteligente integrado si aún no se configura la API Key).
 *
 * Reglas de negocio clave:
 * - El dueño del renglón se define por el COLOR DE LAPICERO del NOMBRE DEL CONDUCTOR
 *   y de la BITÁCORA 1 (TLAX-PUTLA), ignorando el color del número de unidad.
 * - Si una fila ya fue iniciada por el Turno 1 (ej. azul) y el Turno 2 (ej. negro)
 *   escribió PUTLA-TLAX (Bit. 2) e INTERMEDIOS, se detecta como cierre de vuelta compartida.
 * - Máximo 2 usos exitosos por usuario por día (Administrador ilimitado).
 */

const GEMINI_KEY_STORAGE = 'th_gemini_api_key_v1';
const DAILY_QUOTA_PREFIX = 'th_ia_scan_quota_';
export const MAX_SCANS_PER_DAY = 2;

export function getGeminiApiKey() {
  return (
    localStorage.getItem(GEMINI_KEY_STORAGE) ||
    import.meta.env?.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

export function setGeminiApiKey(key) {
  localStorage.setItem(GEMINI_KEY_STORAGE, (key || '').trim());
}

/**
 * Control de intentos diarios por usuario (2 fotos por día)
 */
export function getIntentosRestantesHoy(userId, isAdmin = false) {
  if (isAdmin) return 99;
  const uid = userId || 'anon';
  const hoy = new Date().toISOString().split('T')[0];
  const key = `${DAILY_QUOTA_PREFIX}${uid}_${hoy}`;
  const usados = parseInt(localStorage.getItem(key) || '0', 10) || 0;
  return Math.max(0, MAX_SCANS_PER_DAY - usados);
}

export function getIntentosUsadosHoy(userId) {
  const uid = userId || 'anon';
  const hoy = new Date().toISOString().split('T')[0];
  const key = `${DAILY_QUOTA_PREFIX}${uid}_${hoy}`;
  return parseInt(localStorage.getItem(key) || '0', 10) || 0;
}

export function registrarIntentoExitosoHoy(userId) {
  const uid = userId || 'anon';
  const hoy = new Date().toISOString().split('T')[0];
  const key = `${DAILY_QUOTA_PREFIX}${uid}_${hoy}`;
  const usados = getIntentosUsadosHoy(uid);
  localStorage.setItem(key, String(usados + 1));
}

/**
 * Comprime la foto en el navegador a ~1200px (máx ~220 KB) para envío rápido
 */
export function comprimirImagenBase64(file, maxWidth = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64  = dataUrl.split(',')[1];
        resolve({ dataUrl, base64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Normaliza el número de unidad a 2 dígitos ("2" -> "02")
 */
export function normalizarNumeroUnidad(num) {
  const limpio = String(num || '').replace(/[^0-9]/g, '');
  if (!limpio) return '';
  return limpio.length === 1 ? '0' + limpio : limpio;
}

/**
 * Analiza la imagen de la hoja CONTROL DE CORRIDAS con Google Gemini 2.5 Flash
 */
export async function analizarHojaConGemini({ base64, mimeType, unidadesCatalogo = [] }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const catalogoTexto = unidadesCatalogo
    .map(u => `Unidad ${u.numero}: Dueño ${u.dueno?.nombre || 'S/D'}`)
    .join(', ');

  const prompt = `
Eres un sistema experto en lectura de hojas manuscritas de "CONTROL DE CORRIDAS" de Transporte Tierra de Humo (Ruta Tlaxiaco - Putla).
Analiza todas las filas escritas a mano en la tabla de la imagen, en estricto orden de arriba hacia abajo.

COLUMNAS DE LA HOJA:
1. "No UD." -> Número de unidad (ej. 01, 02, 03, 05, 06, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17).
2. "CONDUCTOR O DUEÑO" -> Nombre escrito a mano (ej. Beyruth, Juan, Emilio, Eduardo, Omar, Virgilio, Gustavo, Jesé, Irving, José, Antonio, Job, Faustino, Daniel, Faylo, Luis).
3. "TLAX-PUTLA" -> Monto de Bitácora 1 (número entero o decimal, si hay un 0 o guión es 0).
4. "PUTLA-TLAX" -> Monto de Bitácora 2 (si está vacío, pon null; si dice 0, pon 0).
5. "INTERMEDIOS" -> Monto de Intermedios (si está vacío, pon null; si dice 0, pon 0).
6. "GASOLINA" -> Monto de combustible (casi siempre es 600 escrito en rojo; si está vacío pon 0, si dice 600 pon 600).

REGLA CRÍTICA DE COLORES DE LAPICERO:
- El color de la columna "No UD." (número de unidad) NO importa porque a veces pre-llenan toda la columna de un solo color.
- Debes identificar con qué color de tinta de lapicero ("azul", "negro", "rojo", "verde", "lapiz") está escrito:
  a) "color_conductor_bit1": El color de tinta con el que se escribió el NOMBRE DEL CONDUCTOR y la columna TLAX-PUTLA (Bitácora 1).
  b) "color_bit2_inter": El color de tinta con el que se escribieron las columnas PUTLA-TLAX (Bitácora 2) e INTERMEDIOS.
- Ignora las filas de sumas finales al pie de la tabla (donde no hay número de unidad ni nombre de conductor, solo totales grandes como 9490, 8220, 18445, etc.).

Catálogo de referencia de unidades: ${catalogoTexto || '01 a 17'}.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta, sin bloques markdown adicionales:
{
  "fecha_detectada": "DD/MM/AA o texto de encabezado",
  "filas": [
    {
      "fila_num": 1,
      "numero_unidad": "02",
      "nombre_conductor": "Beyruth",
      "bitacora_1": 900,
      "bitacora_2": 230,
      "intermedios": 500,
      "combustible": 600,
      "color_conductor_bit1": "azul",
      "color_bit2_inter": "azul",
      "vuelta_incompleta": false
    }
  ]
}
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType || 'image/jpeg',
                data: base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Error de Gemini API (${response.status}): ${errText.slice(0, 180)}`);
  }

  const json = await response.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson);
}

/**
 * Datos de demostración reales basados en la hoja "Viernes 02-10-26" subida por el usuario
 * (12 primeras filas con lapicero AZUL, filas siguientes con lapicero NEGRO y vuelta compartida)
 */
export function obtenerLecturaDemoRealista() {
  return {
    fecha_detectada: 'Viernes 02-10-26 (Hoja Control de Corridas)',
    filas: [
      { fila_num: 1,  numero_unidad: '17', nombre_conductor: 'Irving',   bitacora_1: 0,    bitacora_2: 0,    intermedios: 300,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 2,  numero_unidad: '15', nombre_conductor: 'Jese',     bitacora_1: 650,  bitacora_2: 170,  intermedios: 390,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 3,  numero_unidad: '13', nombre_conductor: 'Jose',     bitacora_1: 0,    bitacora_2: 250,  intermedios: 70,   combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 4,  numero_unidad: '09', nombre_conductor: 'Antonio',  bitacora_1: 290,  bitacora_2: 440,  intermedios: 280,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 5,  numero_unidad: '12', nombre_conductor: 'Faustino', bitacora_1: 0,    bitacora_2: 450,  intermedios: 850,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 6,  numero_unidad: '03', nombre_conductor: 'Emilio',   bitacora_1: 220,  bitacora_2: 310,  intermedios: 660,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 7,  numero_unidad: '05', nombre_conductor: 'Faylo',    bitacora_1: 580,  bitacora_2: 360,  intermedios: 500,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 8,  numero_unidad: '16', nombre_conductor: 'Omar',     bitacora_1: 480,  bitacora_2: 590,  intermedios: 750,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 9,  numero_unidad: '11', nombre_conductor: 'Job',      bitacora_1: 130,  bitacora_2: 330,  intermedios: 610,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 10, numero_unidad: '10', nombre_conductor: 'Daniel',   bitacora_1: 100,  bitacora_2: 190,  intermedios: 940,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 11, numero_unidad: '02', nombre_conductor: 'Beyruth',  bitacora_1: 390,  bitacora_2: 180,  intermedios: 1050, combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 12, numero_unidad: '08', nombre_conductor: 'Juan',     bitacora_1: 490,  bitacora_2: 530,  intermedios: 660,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 13, numero_unidad: '01', nombre_conductor: 'Eduardo',  bitacora_1: 460,  bitacora_2: 400,  intermedios: 935,  combustible: 600, color_conductor_bit1: 'azul',  color_bit2_inter: 'azul',  vuelta_incompleta: false },
      { fila_num: 14, numero_unidad: '06', nombre_conductor: 'Virgilio', bitacora_1: 850,  bitacora_2: 70,   intermedios: 370,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 15, numero_unidad: '14', nombre_conductor: 'Gustavo',  bitacora_1: 260,  bitacora_2: 220,  intermedios: 780,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 16, numero_unidad: '17', nombre_conductor: 'Irving',   bitacora_1: 1390, bitacora_2: 800,  intermedios: 470,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 17, numero_unidad: '15', nombre_conductor: 'Jese',     bitacora_1: 690,  bitacora_2: 430,  intermedios: 200,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 18, numero_unidad: '13', nombre_conductor: 'Jose',     bitacora_1: 1150, bitacora_2: 0,    intermedios: 220,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 19, numero_unidad: '09', nombre_conductor: 'Antonio',  bitacora_1: 900,  bitacora_2: 260,  intermedios: 500,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 20, numero_unidad: '03', nombre_conductor: 'Emilio',   bitacora_1: 820,  bitacora_2: 0,    intermedios: 870,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 21, numero_unidad: '16', nombre_conductor: 'Omar',     bitacora_1: 460,  bitacora_2: 130,  intermedios: 580,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 22, numero_unidad: '05', nombre_conductor: 'Faylo',    bitacora_1: 905,  bitacora_2: 50,   intermedios: 610,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 23, numero_unidad: '11', nombre_conductor: 'Job',      bitacora_1: 905,  bitacora_2: 130,  intermedios: 170,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 24, numero_unidad: '10', nombre_conductor: 'Daniel',   bitacora_1: 970,  bitacora_2: 0,    intermedios: 640,  combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false },
      { fila_num: 25, numero_unidad: '02', nombre_conductor: 'Beyruth',  bitacora_1: 460,  bitacora_2: 180,  intermedios: 20,   combustible: 600, color_conductor_bit1: 'negro', color_bit2_inter: 'negro', vuelta_incompleta: false }
    ]
  };
}

/**
 * Cruza las filas leídas por la IA contra:
 * 1) El color de lapicero elegido por la taquillera actual ("azul", "negro", "todos", etc.)
 * 2) Los registros que YA están guardados en Supabase en esa fecha (para no duplicar lo de la mañana
 *    y detectar cierres de vueltas pendientes)
 */
export function clasificarFilasEscaneadas({
  filasIA = [],
  colorLapiceroUsuario = 'todos',
  registrosExistentesDelDia = [],
  unidadesCatalogo = []
}) {
  // Clonar existentes para ir emparejando en orden de aparición
  const pendientesSinEmparejar = registrosExistentesDelDia
    .filter(r => r.estado === 'pendiente')
    .map(r => ({ ...r, _usado: false }));

  const completadosSinEmparejar = registrosExistentesDelDia
    .filter(r => r.estado === 'completado')
    .map(r => ({ ...r, _usado: false }));

  return filasIA.map((f, index) => {
    const numUnidad = normalizarNumeroUnidad(f.numero_unidad);
    const unidadCat = unidadesCatalogo.find(u => normalizarNumeroUnidad(u.numero) === numUnidad);
    const duenoNombre = unidadCat?.dueno?.nombre || '';

    const b1    = Number(f.bitacora_1) || 0;
    const b2    = f.bitacora_2 === null || f.bitacora_2 === undefined ? 0 : (Number(f.bitacora_2) || 0);
    const inter = f.intermedios === null || f.intermedios === undefined ? 0 : (Number(f.intermedios) || 0);
    const comb  = f.combustible === null || f.combustible === undefined ? 600 : (Number(f.combustible) || 0);

    const colorA = (f.color_conductor_bit1 || 'azul').toLowerCase();
    const colorB = (f.color_bit2_inter || colorA).toLowerCase();

    // 1. Verificar si esta fila ya existe idéntica como COMPLETADA en el día (subida por el turno 1)
    const yaCompletada = completadosSinEmparejar.find(
      r => !r._usado &&
           normalizarNumeroUnidad(r.numero_unidad) === numUnidad &&
           Number(r.bitacora_tlaxiaco_putla) === b1
    );
    if (yaCompletada) {
      yaCompletada._usado = true;
      return {
        id_temp: `scan_${index}`,
        fila_num: f.fila_num || index + 1,
        numero_unidad: numUnidad,
        nombre_conductor: (f.nombre_conductor || '').trim(),
        dueno_nombre: duenoNombre,
        bitacora_tlaxiaco_putla: b1,
        bitacora_putla_tlaxiaco: b2,
        intermedios: inter,
        combustible: comb,
        color_conductor_bit1: colorA,
        color_bit2_inter: colorB,
        accion: 'ya_registrada', // Ya la subió el turno de la mañana
        estado_destino: 'completado',
        registro_existente_id: yaCompletada.id,
        capturado_por_nombre_original: yaCompletada.capturado_por_nombre || 'Turno 1',
        seleccionada: false,
        motivo: `Ya registrada por ${yaCompletada.capturado_por_nombre || 'el turno anterior'}`
      };
    }

    // 2. Verificar si existe como PENDIENTE en Supabase (la dejó abierta el Turno 1 con Bit.1)
    const pendienteMatch = pendientesSinEmparejar.find(
      r => !r._usado &&
           normalizarNumeroUnidad(r.numero_unidad) === numUnidad
    );

    const tieneDatosDeCierre = (f.bitacora_2 !== null && f.bitacora_2 !== undefined) ||
                               (f.intermedios !== null && f.intermedios !== undefined);

    if (pendienteMatch && tieneDatosDeCierre && !f.vuelta_incompleta) {
      pendienteMatch._usado = true;
      const coincideColorCierre = colorLapiceroUsuario === 'todos' || colorB === colorLapiceroUsuario;
      return {
        id_temp: `scan_${index}`,
        fila_num: f.fila_num || index + 1,
        numero_unidad: numUnidad,
        nombre_conductor: pendienteMatch.nombre_conductor || (f.nombre_conductor || '').trim(),
        dueno_nombre: pendienteMatch.dueno_nombre || duenoNombre,
        bitacora_tlaxiaco_putla: Number(pendienteMatch.bitacora_tlaxiaco_putla) || b1,
        bitacora_putla_tlaxiaco: b2,
        intermedios: inter,
        combustible: comb || 600,
        color_conductor_bit1: colorA,
        color_bit2_inter: colorB,
        accion: 'completar_pendiente', // Cierra la vuelta de la Taquillera A y divide cuentas
        estado_destino: 'completado',
        registro_existente: pendienteMatch,
        registro_existente_id: pendienteMatch.id,
        capturado_por_nombre_original: pendienteMatch.capturado_por_nombre || 'Turno 1',
        seleccionada: coincideColorCierre,
        motivo: `Completa vuelta pendiente de ${pendienteMatch.capturado_por_nombre || 'Turno 1'} (Cuentas separadas)`
      };
    }

    // 3. Evaluar si el renglón en el papel tiene 2 colores diferentes (ej. Conductor+Bit1 en azul, Bit2+Inter en negro)
    const esBicolorEnPapel = colorA !== colorB && !f.vuelta_incompleta;

    // Si la taquillera filtró por su color de lapicero (ej. "azul" o "negro"):
    let seleccionadaPorColor = true;
    let estadoDestino = f.vuelta_incompleta ? 'pendiente' : 'completado';
    let bit2Final = b2;
    let interFinal = inter;
    let combFinal = f.vuelta_incompleta ? 0 : comb;
    let motivo = 'Nueva corrida completa';

    if (colorLapiceroUsuario !== 'todos') {
      if (colorA === colorLapiceroUsuario && colorB === colorLapiceroUsuario) {
        // Todo el renglón es del color de esta taquillera
        seleccionadaPorColor = true;
        motivo = `Tu color de lapicero (${colorA.toUpperCase()})`;
      } else if (colorA === colorLapiceroUsuario && colorB !== colorLapiceroUsuario) {
        // Ella inició la vuelta (Nombre + Bit1 con su color), pero el cierre está en otro color (o vacío)
        seleccionadaPorColor = true;
        estadoDestino = 'pendiente';
        bit2Final = 0;
        interFinal = 0;
        combFinal = 0;
        motivo = `Iniciada con tu color (${colorA.toUpperCase()}) → Se guardará PENDIENTE con Bit. 1`;
      } else {
        // El nombre del conductor empieza con el color de la OTRA taquillera
        seleccionadaPorColor = false;
        motivo = `Otro color de lapicero (${colorA.toUpperCase()})`;
      }
    } else if (esBicolorEnPapel) {
      motivo = `Tinta mixta detectada (Bit.1: ${colorA.toUpperCase()} / Cierre: ${colorB.toUpperCase()})`;
    }

    if (f.vuelta_incompleta) {
      estadoDestino = 'pendiente';
      combFinal = 0;
      motivo = 'Solo tiene Bitácora 1 → Se guardará PENDIENTE';
    }

    return {
      id_temp: `scan_${index}`,
      fila_num: f.fila_num || index + 1,
      numero_unidad: numUnidad,
      nombre_conductor: (f.nombre_conductor || '').trim(),
      dueno_nombre: duenoNombre,
      bitacora_tlaxiaco_putla: b1,
      bitacora_putla_tlaxiaco: bit2Final,
      intermedios: interFinal,
      combustible: combFinal,
      color_conductor_bit1: colorA,
      color_bit2_inter: colorB,
      accion: 'nueva',
      estado_destino: estadoDestino,
      registro_existente_id: null,
      seleccionada: seleccionadaPorColor,
      motivo
    };
  });
}
