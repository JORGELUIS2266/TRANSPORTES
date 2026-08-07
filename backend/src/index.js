import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';
import registrosRouter from './routes/registros.js';
import duenosRouter from './routes/duenos.js';
import unidadesRouter from './routes/unidades.js';
import conductoresRouter from './routes/conductores.js';
import prestamosRouter from './routes/prestamos.js';
import registrosLegacyRouter from './routes/registrosLegacy.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: process.env.PGDATABASE || 'transport_db' });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.use('/api/registros', registrosRouter);
app.use('/api/duenos', duenosRouter);
app.use('/api/unidades', unidadesRouter);
app.use('/api/conductores', conductoresRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/registros-legacy', registrosLegacyRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Backend TH escuchando en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
