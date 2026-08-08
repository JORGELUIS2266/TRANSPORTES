import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatFechaLarga } from './semanas';

/**
 * Genera PDF de la semana:
 *  - Cabecera con nombre de la semana
 *  - Una página por día
 *  - Última página: Resumen global de la semana
 */
export function exportarPDF(registros, semana) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW  = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const semanaLabel = semana?.label || 'Semana';

  // Agrupar por fecha
  const gruposPorDia = {};
  registros.forEach(r => {
    if (!gruposPorDia[r.fecha]) gruposPorDia[r.fecha] = [];
    gruposPorDia[r.fecha].push(r);
  });

  const fechas = Object.keys(gruposPorDia).sort();
  if (fechas.length === 0) {
    doc.setFontSize(11);
    doc.text('No hay registros para exportar.', 14, 30);
    doc.save(`Planilla_${semanaLabel}.pdf`);
    return;
  }

  // Acumuladores globales
  let granGen = 0, granComb = 0, granNeto = 0;
  const filasSemana = [];

  fechas.forEach((fecha, idx) => {
    if (idx > 0) doc.addPage();

    const fechaTxt = formatFechaLarga(fecha);

    // Sub-cabecera oficial de la empresa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 0, 0);
    doc.text(`TRANSPORTE TIERRA DE HUMO S.C. DE R.L. DE C.V.  |  PASAJE · PAQUETERÍA · TURISMO  |  RUTA: TLAXIACO ⇄ PUTLA`, PW / 2, 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Recuadro de fecha estilo planilla física
    doc.setDrawColor(0); doc.setLineWidth(0.5);
    doc.rect(10, 8, PW - 20, 11);
    doc.setFillColor(220, 220, 220);
    doc.rect(10, 8, 26, 11, 'F');
    doc.rect(10, 8, 26, 11, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('FECHA', 13, 14.5);
    doc.setFontSize(10);
    doc.text(fechaTxt, 40, 14.5);

    const regs = gruposPorDia[fecha];
    let sumGen = 0, sumComb = 0, sumNeto = 0;

    const filas = regs.map(r => {
      const gen  = Number(r.total_generado) || 0;
      const comb = Number(r.combustible)    || 0;
      const neto = Number(r.total_neto)     || 0;
      if (r.estado === 'completado') { sumGen += gen; sumComb += comb; sumNeto += neto; }
      const pendTag = r.estado === 'pendiente' ? ' ⚠PEND' : r.arrastre ? ' [ARR]' : '';
      return [
        `${r.numero_unidad} – ${r.nombre_conductor}${pendTag}`,
        `$${Number(r.bitacora_tlaxiaco_putla).toFixed(0)}`,
        `$${Number(r.bitacora_putla_tlaxiaco || 0).toFixed(0)}`,
        `$${Number(r.intermedios).toFixed(0)}`,
        `$${gen}`,
        `$${comb}`,
        `$${neto}`
      ];
    });

    // Fila totales del día
    filas.push(['SUMA TOTAL DÍA (completados)', '–', '–', '–', `$${sumGen}`, `$${sumComb}`, `$${sumNeto}`]);

    granGen += sumGen; granComb += sumComb; granNeto += sumNeto;
    filasSemana.push([fechaTxt, `$${sumGen}`, `$${sumComb}`, `$${sumNeto}`]);

    doc.autoTable({
      startY: 23,
      head: [['UNIDAD / CONDUCTOR', 'BIT.1\nTlax→Put', 'BIT.2\nPut→Tlax', 'INTER.', 'TOTAL GEN.', 'COMBUSTIBLE', 'TOTAL NETO']],
      body: filas,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 55 },
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
        4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }
      },
      styles: { fontSize: 8, textColor: [0, 0, 0], lineWidth: 0.2, lineColor: [180, 180, 180] },
      didParseCell(data) {
        const last = data.row.index === filas.length - 1;
        if (last) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = [210, 210, 210]; }
        if (data.column.index === 6 && !last) {
          const val = parseFloat((data.cell.raw || '').replace('$', ''));
          if (val < 0) { data.cell.styles.fillColor = [220, 38, 38]; data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fontStyle = 'bold'; }
        }
        // Pendiente → texto naranja
        if (!last && data.column.index === 0 && String(data.cell.raw).includes('PEND')) {
          data.cell.styles.textColor = [180, 100, 0]; data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.setFontSize(7); doc.setTextColor(140, 140, 140);
    doc.text(`${semanaLabel}  ·  Página ${idx + 1} de ${fechas.length + 1}`, PW / 2, PH - 4, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  });

  // ── Página final: Resumen de la semana ────────────────────────────────────────
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RESUMEN DE LA SEMANA', PW / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`${semanaLabel}  |  TRANSPORTE TIERRA DE HUMOS  |  TLAXIACO ➔ PUTLA`, PW / 2, 26, { align: 'center' });
  if (semana) {
    doc.setFontSize(9);
    doc.text(`Del ${semana.fechaInicio}  al  ${semana.fechaFin}`, PW / 2, 33, { align: 'center' });
  }
  doc.setTextColor(0, 0, 0);

  filasSemana.push([], ['TOTALES GENERALES', `$${granGen}`, `$${granComb}`, `$${granNeto}`]);

  doc.autoTable({
    startY: 38,
    head: [['FECHA', 'TOTAL GENERADO', 'COMBUSTIBLE', 'TOTAL NETO']],
    body: filasSemana,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { halign: 'left', cellWidth: 110 },
      1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }
    },
    styles: { fontSize: 9 },
    didParseCell(data) {
      if (data.row.index === filasSemana.length - 1) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = [225, 225, 225]; }
      if (data.column.index === 3 && data.row.index === filasSemana.length - 1) {
        const val = parseFloat((data.cell.raw || '').replace('$', ''));
        if (val < 0) { data.cell.styles.fillColor = [220, 38, 38]; data.cell.styles.textColor = [255, 255, 255]; }
      }
    }
  });

  doc.setFontSize(7); doc.setTextColor(140, 140, 140);
  doc.text(`${semanaLabel}  ·  Página ${fechas.length + 1} de ${fechas.length + 1}`, PW / 2, PH - 4, { align: 'center' });

  const nombre = semanaLabel.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  doc.save(`Planilla_${nombre}.pdf`);
}
