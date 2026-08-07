import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM prestamos ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { dueno_id, unidad_id, monto, concepto, estado } = req.body;
    const { rows } = await query(
      `INSERT INTO prestamos (dueno_id, unidad_id, monto, concepto, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dueno_id, unidad_id, monto, concepto, estado || 'pendiente']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
