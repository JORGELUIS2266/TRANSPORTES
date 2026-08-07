import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM duenos ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { nombre, telefono } = req.body;
    const { rows } = await query(
      `INSERT INTO duenos (nombre, telefono) VALUES ($1, $2) RETURNING *`,
      [nombre, telefono || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
