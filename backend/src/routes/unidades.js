import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM unidades ORDER BY numero_unidad');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { numero_unidad, placas, modelo, dueno_id } = req.body;
    const { rows } = await query(
      `INSERT INTO unidades (numero_unidad, placas, modelo, dueno_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [numero_unidad, placas || 'S/P', modelo || null, dueno_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
