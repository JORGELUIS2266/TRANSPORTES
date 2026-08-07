import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(__dirname, '../../sql');

const {
  PGHOST = 'localhost',
  PGPORT = '5432',
  PGUSER = 'postgres',
  PGPASSWORD,
  PGDATABASE = 'transport_db',
} = process.env;

if (!PGPASSWORD) {
  console.error('❌ Falta PGPASSWORD en backend/.env');
  console.error('   Copia .env.example a .env y pon tu contraseña de PostgreSQL.');
  process.exit(1);
}

const adminConfig = {
  host: PGHOST,
  port: Number(PGPORT),
  user: PGUSER,
  password: PGPASSWORD,
  database: 'postgres',
};

const files = [
  '01_schema.sql',
  '02_seed.sql',
  '03_capturas_diarias.sql',
];

async function run() {
  const admin = new pg.Client(adminConfig);
  await admin.connect();

  const exists = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [PGDATABASE]
  );

  if (!exists.rowCount) {
    console.log(`📦 Creando base de datos "${PGDATABASE}"...`);
    await admin.query(`CREATE DATABASE ${PGDATABASE}`);
  } else {
    console.log(`✅ Base de datos "${PGDATABASE}" ya existe`);
  }

  await admin.end();

  const db = new pg.Client({
    ...adminConfig,
    database: PGDATABASE,
  });
  await db.connect();

  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Saltando ${file} (no encontrado)`);
      continue;
    }

    console.log(`▶ Ejecutando ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await db.query(sql);
  }

  await db.end();
  console.log('🎉 Base de datos inicializada correctamente.');
}

run().catch((err) => {
  console.error('❌ Error inicializando la base de datos:', err.message);
  process.exit(1);
});
