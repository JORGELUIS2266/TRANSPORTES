import * as XLSX from 'xlsx';
import { formatFechaLarga } from './semanas';

/**
 * Exporta a Excel la planilla de una semana:
 *  - Una hoja por día
 *  - Última hoja: RESUMEN de la semana
 */
export function exportarExcel(registros, semana) {
  const wb = XLSX.utils.book_new();
  const semanaLabel = semana?.label || 'Semana';

  // Filtrar solo completados para los totales, pero exportar todos
  const gruposPorDia = {};
  registros.forEach(r => {
    if (!gruposPorDia[r.fecha]) gruposPorDia[r.fecha] = [];
    gruposPorDia[r.fecha].push(r);
  });

  const fechas = Object.keys(gruposPorDia).sort();

  if (fechas.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No hay registros para exportar']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sin Datos');
    XLSX.writeFile(wb, `Planilla_${semanaLabel}.xlsx`);
    return;
  }

  // Acumuladores para el resumen
  let granGenerado = 0, granCombustible = 0, granNeto = 0;
  const filasSemana = [];

  fechas.forEach(fecha => {
    const fechaTxt = formatFechaLarga(fecha);
    const datosDia = [
      ['TRANSPORTE TIERRA DE HUMOS'],
      [`RUTA: TLAXIACO ➔ PUTLA  |  ${semanaLabel}`],
      [],
      ['FECHA', fechaTxt],
      [],
      ['UNIDAD / CONDUCTOR', 'BITÁCORA 1 (Tlax→Put)', 'BITÁCORA 2 (Put→Tlax)', 'INTERMEDIO', 'TOTAL GENERADO', 'COMBUSTIBLE', 'TOTAL NETO', 'ESTADO']
    ];

    let sumB1 = 0, sumB2 = 0, sumInter = 0, sumGen = 0, sumComb = 0, sumNeto = 0;

    gruposPorDia[fecha].forEach(r => {
      const b1   = Number(r.bitacora_tlaxiaco_putla) || 0;
      const b2   = Number(r.bitacora_putla_tlaxiaco) || 0;
      const inter = Number(r.intermedios)            || 0;
      const gen  = Number(r.total_generado)          || 0;
      const comb = Number(r.combustible)             || 0;
      const neto = Number(r.total_neto)              || 0;

      if (r.estado === 'completado') {
        sumB1   += b1; sumB2 += b2; sumInter += inter;
        sumGen  += gen; sumComb += comb; sumNeto += neto;
      }

      datosDia.push([
        `${r.numero_unidad} – ${r.nombre_conductor}`,
        b1, b2, inter, gen, comb, neto,
        r.estado === 'pendiente' ? '⏳ PENDIENTE' : '✅ COMPLETADO'
      ]);
    });

    // Fila total del día
    datosDia.push([]);
    datosDia.push(['SUMA TOTAL DÍA (completados)', sumB1, sumB2, sumInter, sumGen, sumComb, sumNeto, '']);

    granGenerado    += sumGen;
    granCombustible += sumComb;
    granNeto        += sumNeto;
    filasSemana.push([fechaTxt, sumGen, sumComb, sumNeto]);

    // Nombre de pestaña (máx 31 chars para Excel)
    const obj  = new Date(fecha + 'T00:00:00');
    const hoja = obj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).substring(0, 31);
    const ws   = XLSX.utils.aoa_to_sheet(datosDia);
    XLSX.utils.book_append_sheet(wb, ws, hoja);
  });

  // Hoja RESUMEN SEMANA
  const datosResumen = [
    ['TRANSPORTE TIERRA DE HUMOS'],
    [`RESUMEN SEMANAL — ${semanaLabel}`],
    [`Ruta: Tlaxiaco ➔ Putla`],
    [],
    ['FECHA', 'TOTAL GENERADO ($)', 'COMBUSTIBLE ($)', 'TOTAL NETO ($)'],
    ...filasSemana,
    [],
    ['TOTALES GENERALES', granGenerado, granCombustible, granNeto]
  ];
  const wsRes = XLSX.utils.aoa_to_sheet(datosResumen);
  XLSX.utils.book_append_sheet(wb, wsRes, 'RESUMEN SEMANA');

  const nombre = semanaLabel.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  XLSX.writeFile(wb, `Planilla_${nombre}.xlsx`);
}
