/**
 * UTILIDADES DE SEMANAS REALES DE CALENDARIO (Lunes a Domingo)
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 */

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Parsea de forma segura cualquier string o Date a objeto Date a medianoche local.
 */
export function safeDateParse(fechaInput) {
  if (!fechaInput) return new Date();
  if (fechaInput instanceof Date) {
    return isNaN(fechaInput.getTime()) ? new Date() : fechaInput;
  }
  const str = String(fechaInput).trim();
  // Formato YYYY-MM-DD
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    return new Date(y, m, d, 12, 0, 0); // mediodía para evitar desfases de huso horario
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Formato ISO 'YYYY-MM-DD'
 */
export function toISODate(dateObj) {
  const d = safeDateParse(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Retorna el Lunes (inicio de semana) para cualquier fecha.
 */
export function getLunesDeSemana(fechaInput) {
  const d = safeDateParse(fechaInput);
  const dayOfWeek = d.getDay(); // 0 = Domingo, 1 = Lunes, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diff);
  return lunes;
}

/**
 * Retorna el Domingo (fin de semana) para cualquier fecha.
 */
export function getDomingoDeSemana(fechaInput) {
  const lunes = getLunesDeSemana(fechaInput);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return domingo;
}

/**
 * Genera el ID único de semana basado en la fecha del Lunes (ej: 'SEM-2026-08-03')
 */
export function buildSemanaId(lunesDate) {
  return `SEM-${toISODate(lunesDate)}`;
}

/**
 * Obtiene el ID de semana para cualquier fecha ISO dada.
 */
export function getSemanaIdParaFecha(fechaStr) {
  if (!fechaStr) return getSemanaActualId();
  try {
    const lunes = getLunesDeSemana(fechaStr);
    return buildSemanaId(lunes);
  } catch (e) {
    console.warn('[semanas] Error calculando semanaId:', fechaStr, e);
    return getSemanaActualId();
  }
}

/**
 * Retorna el ID de la semana actual en tiempo real según el reloj del sistema.
 */
export function getSemanaActualId() {
  const hoy = new Date();
  const lunes = getLunesDeSemana(hoy);
  return buildSemanaId(lunes);
}

/**
 * Construye el objeto completo de una semana dado su Lunes o ID.
 */
export function buildSemanaObj(lunesDate) {
  let lunes;
  if (typeof lunesDate === 'string' && lunesDate.startsWith('SEM-')) {
    lunes = safeDateParse(lunesDate.replace('SEM-', ''));
  } else {
    lunes = safeDateParse(lunesDate);
  }

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const iniISO = toISODate(lunes);
  const finISO = toISODate(domingo);

  const dIni = lunes.getDate();
  const dFin = domingo.getDate();
  const mIni = lunes.getMonth();
  const mFin = domingo.getMonth();
  const yIni = lunes.getFullYear();
  const yFin = domingo.getFullYear();

  let label = '';
  if (mIni === mFin && yIni === yFin) {
    // Mismo mes: "Del 03 al 09 de Agosto de 2026"
    label = `Del ${String(dIni).padStart(2, '0')} al ${String(dFin).padStart(2, '0')} de ${MESES_ES[mIni]} de ${yIni}`;
  } else if (yIni === yFin) {
    // Meses diferentes: "Del 31 de Agosto al 06 de Septiembre de 2026"
    label = `Del ${String(dIni).padStart(2, '0')} de ${MESES_ES[mIni]} al ${String(dFin).padStart(2, '0')} de ${MESES_ES[mFin]} de ${yIni}`;
  } else {
    // Años diferentes: "Del 28 de Diciembre de 2026 al 03 de Enero de 2027"
    label = `Del ${String(dIni).padStart(2, '0')} de ${MESES_ES[mIni]} de ${yIni} al ${String(dFin).padStart(2, '0')} de ${MESES_ES[mFin]} de ${yFin}`;
  }

  // Número de semana en el año
  const primeroEnero = new Date(yIni, 0, 1);
  const dias = Math.floor((lunes - primeroEnero) / (24 * 60 * 60 * 1000));
  const numSemanaAnio = Math.ceil((dias + primeroEnero.getDay() + 1) / 7);

  return {
    id: buildSemanaId(lunes),
    numero: numSemanaAnio,
    year: yIni,
    fechaInicio: iniISO,
    fechaFin: finISO,
    label: label, // Solo "Del X al Y de Mes de Año" sin "Semana X"
    labelCorto: `${String(dIni).padStart(2, '0')} ${MESES_CORTOS[mIni]} – ${String(dFin).padStart(2, '0')} ${MESES_CORTOS[mFin]}`,
    mesNombre: MESES_ES[mIni]
  };
}

/**
 * Retorna las semanas disponibles para el selector:
 * Incluye semanas pasadas y todas las semanas futuras (Septiembre, Octubre, Noviembre, Diciembre...).
 */
export function getSemanasSelectRecentFirst() {
  const semanas = [];
  const hoy = new Date();
  const lunesActual = getLunesDeSemana(hoy);

  // 24 semanas futuras (más de 5 meses adelante: Octubre, Noviembre, Diciembre...)
  // y 16 semanas pasadas
  for (let i = 24; i >= -16; i--) {
    const lun = new Date(lunesActual);
    lun.setDate(lunesActual.getDate() + (i * 7));
    semanas.push(buildSemanaObj(lun));
  }

  return semanas;
}

/**
 * Retorna el ID de la semana anterior a la indicada.
 */
export function getSemanaAnteriorId(semanaId) {
  if (!semanaId || typeof semanaId !== 'string') return null;
  let lunesStr = semanaId.replace(/^SEM-/, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(lunesStr)) {
    const lunes = safeDateParse(lunesStr);
    lunes.setDate(lunes.getDate() - 7);
    return buildSemanaId(lunes);
  }
  const hoy = new Date();
  const lunes = getLunesDeSemana(hoy);
  lunes.setDate(lunes.getDate() - 7);
  return buildSemanaId(lunes);
}

/**
 * Retorna el ID de la semana siguiente a la indicada.
 */
export function getSemanaSiguienteId(semanaId) {
  if (!semanaId || typeof semanaId !== 'string') return null;
  let lunesStr = semanaId.replace(/^SEM-/, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(lunesStr)) {
    const lunes = safeDateParse(lunesStr);
    lunes.setDate(lunes.getDate() + 7);
    return buildSemanaId(lunes);
  }
  const hoy = new Date();
  const lunes = getLunesDeSemana(hoy);
  lunes.setDate(lunes.getDate() + 7);
  return buildSemanaId(lunes);
}

/**
 * Formato "LUN 04 AGO"
 */
export function formatFechaCorta(fechaStr) {
  if (!fechaStr) return '';
  try {
    const obj = safeDateParse(fechaStr);
    const diaNom = DIAS_ES[obj.getDay()] || '';
    const diaNum = String(obj.getDate()).padStart(2, '0');
    const mesNom = MESES_CORTOS[obj.getMonth()] || '';
    return `${diaNom} ${diaNum} ${mesNom}`.toUpperCase();
  } catch (e) {
    return String(fechaStr);
  }
}

/**
 * Formato "LUNES 04 DE AGOSTO DEL 2026"
 */
export function formatFechaLarga(fechaStr) {
  if (!fechaStr) return '';
  try {
    const obj = safeDateParse(fechaStr);
    const diaNom = DIAS_LARGOS[obj.getDay()] || '';
    const diaNum = String(obj.getDate()).padStart(2, '0');
    const mesNom = MESES_ES[obj.getMonth()] || '';
    const anio = obj.getFullYear();
    return `${diaNom} ${diaNum} de ${mesNom} del ${anio}`.toUpperCase();
  } catch (e) {
    return String(fechaStr);
  }
}
