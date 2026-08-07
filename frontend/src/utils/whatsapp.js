/**
 * Genera un texto en formato WhatsApp formateado con negritas y emojis
 */
export function generarMensajeWhatsApp({
  fechaInicio,
  fechaFin,
  resultadoLiquidacion
}) {
  let text = `🚌 *RESUMEN DE LIQUIDACIÓN SEMANAL*\n`;
  text += `📍 *Ruta Tlaxcala - Putla*\n`;
  text += `📅 *Periodo:* ${fechaInicio} al ${fechaFin}\n\n`;

  text += `📊 *MÉTRICAS GLOBALES*\n`;
  text += `• Total Vueltas Ruta: *${resultadoLiquidacion.totalVueltasGlobal}*\n`;
  text += `• Fondo Total Generado: *$${resultadoLiquidacion.totalGeneradoGlobal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*\n`;
  text += `• Valor por Vuelta: *$${resultadoLiquidacion.valorPorVuelta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}*\n\n`;

  text += `👥 *LIQUIDACIÓN POR SOCIO / DUEÑO*\n`;
  text += `-----------------------------------\n`;

  resultadoLiquidacion.liquidacionesPorDueno.forEach(d => {
    text += `👤 *${d.nombre_dueno}*\n`;
    d.unidades.forEach(u => {
      text += `  🚐 Unidad ${u.numero_unidad}: ${u.vueltas_semana} vueltas ➔ Bruto: *$${u.ingreso_bruto_unidad.toFixed(2)}*\n`;
    });
    if (d.descuento_prestamos_dueno > 0) {
      text += `  🔻 Descuento Préstamo/Anticipo: *$${d.descuento_prestamos_dueno.toFixed(2)}*\n`;
    }
    text += `  💵 *PAGO NETO FINAL: $${d.pago_neto_final_dueno.toFixed(2)}*\n`;
    text += `-----------------------------------\n`;
  });

  text += `\n📌 *Administración de Ruta Tlaxcala - Putla*`;

  return text;
}

/**
 * Abre la URL de WhatsApp con el mensaje cargado
 */
export function enviarPorWhatsApp({ telefono, mensaje }) {
  const encodedText = encodeURIComponent(mensaje);
  const cleanPhone = telefono ? telefono.replace(/\D/g, '') : '';
  const url = cleanPhone 
    ? `https://wa.me/52${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank');
}
