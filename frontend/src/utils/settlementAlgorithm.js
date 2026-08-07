/**
 * ALGORITMO Y LÓGICA DE REPARTICIÓN DE LIQUIDACIÓN SEMANAL POR DUEÑO Y UNIDAD
 * RUTA TLAXCALA - PUTLA
 * 
 * @param {Array} registrosDiarios - Lista de registros diarios filtrados por la semana (7 días)
 * @param {Array} duenos - Lista de dueños/socios
 * @param {Array} unidades - Lista de camionetas
 * @param {Array} prestamos - Lista de préstamos pendientes por cobrar
 * @param {number} cuotaAdminSemanal - Cuota fija semanal de administración por unidad (ej. $300)
 * @returns {Object} Resultado detallado de la liquidación semanal
 */
export function calcularLiquidacionSemanal({
  registrosDiarios = [],
  duenos = [],
  unidades = [],
  prestamos = [],
  cuotaAdminSemanal = 300
}) {
  // 1. Total Vueltas Global & Total Generado Global
  let totalVueltasGlobal = 0;
  let totalGeneradoGlobal = 0;

  // Mapa de acumulación por unidad
  const statsPorUnidad = {};

  // Inicializar mapa de unidades
  unidades.forEach(u => {
    statsPorUnidad[u.id] = {
      unidad_id: u.id,
      numero_unidad: u.numero_unidad,
      placas: u.placas,
      dueno_id: u.dueno_id,
      vueltas_semana: 0,
      total_generado_unidad: 0,
      combustible_total: 0,
      gastos_imprevistos_total: 0,
      total_neto_diario_acumulado: 0
    };
  });

  // Procesar registros diarios
  registrosDiarios.forEach(reg => {
    const uId = reg.unidad_id;
    if (statsPorUnidad[uId]) {
      const vueltas = Number(reg.vueltas_dadas) || 1;
      const generado = Number(reg.total_generado) || 0;
      const combustible = Number(reg.combustible) || 0;
      const imprevistos = Number(reg.gastos_imprevistos) || 0;
      const netoDiario = Number(reg.total_neto) || (generado - combustible - imprevistos);

      statsPorUnidad[uId].vueltas_semana += vueltas;
      statsPorUnidad[uId].total_generado_unidad += generado;
      statsPorUnidad[uId].combustible_total += combustible;
      statsPorUnidad[uId].gastos_imprevistos_total += imprevistos;
      statsPorUnidad[uId].total_neto_diario_acumulado += netoDiario;

      totalVueltasGlobal += vueltas;
      totalGeneradoGlobal += generado;
    }
  });

  // 3. Valor por Vuelta
  const valorPorVuelta = totalVueltasGlobal > 0 ? (totalGeneradoGlobal / totalVueltasGlobal) : 0;

  // Mapa de acumulación por Dueño
  const liquidacionPorDueno = {};

  duenos.forEach(d => {
    liquidacionPorDueno[d.id] = {
      dueno_id: d.id,
      nombre_dueno: d.nombre,
      telefono: d.telefono,
      unidades: [],
      vueltas_totales_dueno: 0,
      ingreso_bruto_dueno: 0,
      cuota_admin_dueno: 0,
      gastos_imprevistos_dueno: 0,
      descuento_prestamos_dueno: 0,
      pago_neto_final_dueno: 0
    };
  });

  // Sumar préstamos pendientes por dueño
  const prestamosPorDueno = {};
  prestamos.forEach(p => {
    if (p.estado === 'pendiente') {
      const dId = p.dueno_id;
      prestamosPorDueno[dId] = (prestamosPorDueno[dId] || 0) + Number(p.monto);
    }
  });

  // 4 & 5. Ingreso Bruto y Deducciones por Unidad / Dueño
  const detalleUnidades = [];

  Object.values(statsPorUnidad).forEach(uStat => {
    const dueno = liquidacionPorDueno[uStat.dueno_id];
    if (!dueno) return;

    // Ingreso Bruto = Vueltas Unidad * Valor por Vuelta
    const ingresoBrutoUnidad = uStat.vueltas_semana * valorPorVuelta;
    
    // Deducciones por Unidad
    const cuotaAdminUnidad = uStat.vueltas_semana > 0 ? cuotaAdminSemanal : 0;
    const imprevistosUnidad = uStat.gastos_imprevistos_total;

    const unidadDetalle = {
      ...uStat,
      ingreso_bruto_unidad: ingresoBrutoUnidad,
      cuota_admin_unidad: cuotaAdminUnidad,
      ingreso_neto_unidad: ingresoBrutoUnidad - cuotaAdminUnidad - imprevistosUnidad
    };

    detalleUnidades.push(unidadDetalle);
    dueno.unidades.push(unidadDetalle);

    // Acumular en Dueño
    dueno.vueltas_totales_dueno += uStat.vueltas_semana;
    dueno.ingreso_bruto_dueno += ingresoBrutoUnidad;
    dueno.cuota_admin_dueno += cuotaAdminUnidad;
    dueno.gastos_imprevistos_dueno += imprevistosUnidad;
  });

  // 6. Pago Final Neto al Dueño
  Object.values(liquidacionPorDueno).forEach(d => {
    d.descuento_prestamos_dueno = prestamosPorDueno[d.dueno_id] || 0;
    const totalDeducciones = d.cuota_admin_dueno + d.gastos_imprevistos_dueno + d.descuento_prestamos_dueno;
    d.pago_neto_final_dueno = d.ingreso_bruto_dueno - totalDeducciones;
  });

  // Identificar unidades más rentable, de mayor gasto y saldo negativo (Semáforo)
  let unidadMasRentable = null;
  let unidadMayorGasto = null;
  const unidadesSaldoNegativo = [];

  detalleUnidades.forEach(u => {
    if (!unidadMasRentable || u.total_generado_unidad > unidadMasRentable.total_generado_unidad) {
      unidadMasRentable = u;
    }
    const gastoTotal = u.combustible_total + u.gastos_imprevistos_total;
    if (!unidadMayorGasto || gastoTotal > (unidadMayorGasto.combustible_total + unidadMayorGasto.gastos_imprevistos_total)) {
      unidadMayorGasto = u;
    }
    if (u.total_neto_diario_acumulado < 0 || u.ingreso_neto_unidad < 0) {
      unidadesSaldoNegativo.push(u);
    }
  });

  return {
    totalVueltasGlobal,
    totalGeneradoGlobal,
    valorPorVuelta,
    cuotaAdminSemanal,
    detalleUnidades,
    liquidacionesPorDueno: Object.values(liquidacionPorDueno),
    semaforo: {
      unidadMasRentable,
      unidadMayorGasto,
      unidadesSaldoNegativo
    }
  };
}
