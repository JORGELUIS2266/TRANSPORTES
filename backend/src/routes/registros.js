import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function mapCaptura(row) {
  return {
    id: row.id,
    fecha: row.fecha instanceof Date
      ? row.fecha.toISOString().slice(0, 10)
      : String(row.fecha).slice(0, 10),
    numero_unidad: row.numero_unidad,
    nombre_conductor: row.nombre_conductor,
    vueltas_dadas: Number(row.vueltas_dadas),
    bitacora_tlaxiaco_putla: Number(row.bitacora_tlaxiaco_putla),
    bitacora_putla_tlaxiaco: Number(row.bitacora_putla_tlaxiaco),
    intermedios: Number(row.intermedios),
    total_generado: Number(row.total_generado),
    combustible: Number(row.combustible),
    gastos_imprevistos: Number(row.gastos_imprevistos),
    concepto_gastos: row.concepto_gastos || '',
    total_neto: Number(row.total_neto),
    estado: row.estado,
    created_at: row.created_at,
  };
}

function calcTotals(registro) {
  const b1 = Number(registro.bitacora_tlaxiaco_putla) || 0;
  const b2 = Number(registro.bitacora_putla_tlaxiaco) || 0;
  const inter = Number(registro.intermedios) || 0;
  const comb = Number(registro.combustible) || 0;
  const imprev = Number(registro.gastos_imprevistos) || 0;
  const totalGenerado = b1 + b2 + inter;
  const totalNeto = totalGenerado - comb - imprev;
  const estado = registro.estado === 'pendiente' ? 'pendiente' : 'completado';

  return { b1, b2, inter, comb, imprev, totalGenerado, totalNeto, estado };
}

router.get('/', async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    let sql = 'SELECT * FROM capturas_diarias';
    const params = [];

    if (fecha_inicio && fecha_fin) {
      sql += ' WHERE fecha >= $1 AND fecha <= $2';
      params.push(fecha_inicio, fecha_fin);
    }

    sql += ' ORDER BY created_at ASC';

    const { rows } = await query(sql, params);
    res.json(rows.map(mapCaptura));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const registro = req.body;
    const { b1, b2, inter, comb, imprev, totalGenerado, totalNeto, estado } = calcTotals(registro);

    const payload = {
      fecha: registro.fecha,
      numero_unidad: (registro.numero_unidad || '').trim(),
      nombre_conductor: (registro.nombre_conductor || '').trim(),
      vueltas_dadas: Number(registro.vueltas_dadas) || 1,
      b1,
      b2,
      inter,
      totalGenerado,
      comb,
      imprev,
      concepto_gastos: registro.concepto_gastos || '',
      totalNeto,
      estado,
    };

    let rows;

    if (registro.id) {
      const updated = await query(
        `UPDATE capturas_diarias SET
          fecha = $2,
          numero_unidad = $3,
          nombre_conductor = $4,
          vueltas_dadas = $5,
          bitacora_tlaxiaco_putla = $6,
          bitacora_putla_tlaxiaco = $7,
          intermedios = $8,
          total_generado = $9,
          combustible = $10,
          gastos_imprevistos = $11,
          concepto_gastos = $12,
          total_neto = $13,
          estado = $14
        WHERE id = $1
        RETURNING *`,
        [
          registro.id,
          payload.fecha,
          payload.numero_unidad,
          payload.nombre_conductor,
          payload.vueltas_dadas,
          payload.b1,
          payload.b2,
          payload.inter,
          payload.totalGenerado,
          payload.comb,
          payload.imprev,
          payload.concepto_gastos,
          payload.totalNeto,
          payload.estado,
        ]
      );
      rows = updated.rows;
    }

    if (!rows?.length) {
      const inserted = await query(
        `INSERT INTO capturas_diarias (
          fecha, numero_unidad, nombre_conductor, vueltas_dadas,
          bitacora_tlaxiaco_putla, bitacora_putla_tlaxiaco, intermedios,
          total_generado, combustible, gastos_imprevistos, concepto_gastos,
          total_neto, estado, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, COALESCE($14::timestamptz, NOW()))
        RETURNING *`,
        [
          payload.fecha,
          payload.numero_unidad,
          payload.nombre_conductor,
          payload.vueltas_dadas,
          payload.b1,
          payload.b2,
          payload.inter,
          payload.totalGenerado,
          payload.comb,
          payload.imprev,
          payload.concepto_gastos,
          payload.totalNeto,
          payload.estado,
          registro.created_at || null,
        ]
      );
      rows = inserted.rows;
    }

    res.status(registro.id ? 200 : 201).json(mapCaptura(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM capturas_diarias WHERE id = $1',
      [req.params.id]
    );
    res.json({ deleted: rowCount > 0 });
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (_req, res, next) => {
  try {
    await query('DELETE FROM capturas_diarias');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
