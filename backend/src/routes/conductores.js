import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM conductores ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nombre, telefono, unidad_predeterminada_id } = req.body;
    const { rows } = await query(
      `INSERT INTO conductores (nombre, telefono, unidad_predeterminada_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, telefono || null, unidad_predeterminada_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
