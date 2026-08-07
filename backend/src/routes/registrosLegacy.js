import { Router } from 'express';
import { query } from '../db.js';

export function mapVistaRegistro(row) {
  return {
    id: row.id,
    fecha: row.fecha instanceof Date
      ? row.fecha.toISOString().slice(0, 10)
      : String(row.fecha).slice(0, 10),
    unidad_id: row.unidad_id,
    numero_unidad: row.numero_unidad,
    placas: row.placas,
    dueno_id: row.dueno_id,
    nombre_dueno: row.nombre_dueno,
    conductor_id: row.conductor_id,
    nombre_conductor: row.nombre_conductor,
    bitacora_tlaxcala_putla: Number(row.bitacora_tlaxcala_putla),
    bitacora_putla_tlaxcala: Number(row.bitacora_putla_tlaxcala),
    bitacora_tlaxiaco_putla: Number(row.bitacora_tlaxcala_putla),
    bitacora_putla_tlaxiaco: Number(row.bitacora_putla_tlaxcala),
    intermedios: Number(row.intermedios),
    total_generado: Number(row.total_generado),
    combustible: Number(row.combustible),
    gastos_imprevistos: Number(row.gastos_imprevistos),
    concepto_gastos: row.concepto_gastos || '',
    total_neto: Number(row.total_neto),
    vueltas_dadas: Number(row.vueltas_dadas),
    cerrado: row.cerrado,
    estado: row.cerrado ? 'completado' : 'pendiente',
    created_at: row.created_at,
  };
}

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    let sql = 'SELECT * FROM vista_registros_diarios';
    const params = [];

    if (fecha_inicio && fecha_fin) {
      sql += ' WHERE fecha >= $1 AND fecha <= $2 ORDER BY fecha ASC, created_at ASC';
      params.push(fecha_inicio, fecha_fin);
    } else {
      sql += ' ORDER BY created_at ASC';
    }

    const { rows } = await query(sql, params);
    res.json(rows.map(mapVistaRegistro));
  } catch (err) {
    next(err);
  }
});

router.post('/cerrar-dia', async (req, res, next) => {
  try {
    const { fecha } = req.body;
    await query(
      `UPDATE registros_diarios SET cerrado = TRUE
       WHERE fecha = $1`,
      [fecha]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
