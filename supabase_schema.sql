-- ════════════════════════════════════════════════════════════════
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
-- Pega este script en: Supabase → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════

-- 1. USUARIOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_raw  TEXT,
  nombre        TEXT NOT NULL,
  rol           TEXT NOT NULL DEFAULT 'capturista',
  icono         TEXT DEFAULT '✍️',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DUEÑOS DE UNIDADES
CREATE TABLE IF NOT EXISTS duenos (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL,
  telefono   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. UNIDADES / CAMIONETAS
CREATE TABLE IF NOT EXISTS unidades (
  id         TEXT PRIMARY KEY,
  numero     TEXT NOT NULL,
  placas     TEXT,
  modelo     TEXT,
  dueno_id   TEXT REFERENCES duenos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONDUCTORES / CHOFERES
CREATE TABLE IF NOT EXISTS conductores (
  id                    TEXT PRIMARY KEY,
  nombre                TEXT NOT NULL,
  unidad_predeterminada TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REGISTROS DE VUELTAS DIARIAS
CREATE TABLE IF NOT EXISTS registros (
  id                       TEXT PRIMARY KEY,
  semana_id                TEXT NOT NULL,
  fecha                    DATE NOT NULL,
  numero_unidad            TEXT,
  nombre_conductor         TEXT,
  dueno_nombre             TEXT,
  vueltas_dadas            INTEGER DEFAULT 1,
  bitacora_tlaxiaco_putla  NUMERIC DEFAULT 0,
  bitacora_putla_tlaxiaco  NUMERIC DEFAULT 0,
  intermedios              NUMERIC DEFAULT 0,
  total_generado           NUMERIC DEFAULT 0,
  combustible              NUMERIC DEFAULT 600,
  gastos_imprevistos       NUMERIC DEFAULT 0,
  concepto_gastos          TEXT,
  total_neto               NUMERIC DEFAULT 0,
  estado                   TEXT DEFAULT 'completado',
  arrastre                 BOOLEAN DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BITÁCORA DE AUDITORÍA
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
  id         TEXT PRIMARY KEY,
  timestamp  TIMESTAMPTZ DEFAULT NOW(),
  usuario    TEXT,
  nombre     TEXT,
  rol        TEXT,
  accion     TEXT,
  detalle    TEXT,
  categoria  TEXT DEFAULT 'captura',
  icono      TEXT DEFAULT '📝',
  ip         TEXT,
  ubicacion  TEXT,
  ciudad     TEXT,
  region     TEXT,
  dispositivo TEXT,
  seccion    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERMISOS DE ACCESO PÚBLICO (Row Level Security desactivado para uso simple) ──
ALTER TABLE usuarios           DISABLE ROW LEVEL SECURITY;
ALTER TABLE duenos             DISABLE ROW LEVEL SECURITY;
ALTER TABLE unidades           DISABLE ROW LEVEL SECURITY;
ALTER TABLE conductores        DISABLE ROW LEVEL SECURITY;
ALTER TABLE registros          DISABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora_auditoria DISABLE ROW LEVEL SECURITY;

-- ── DATOS INICIALES: 3 USUARIOS POR DEFECTO ──────────────────────────
INSERT INTO usuarios (id, username, password_hash, password_raw, nombre, rol, icono)
VALUES
  ('u_admin',      'admin',    'SEED_ADMIN',    'admin123',    'Administrador General', 'admin',      '👑'),
  ('u_capturista', 'operador', 'SEED_OPERADOR', 'operador123', 'Capturista de Ruta',    'capturista', '✍️'),
  ('u_lector',     'socio',    'SEED_SOCIO',    'socio123',    'Socio Consulta',        'lector',     '👁️')
ON CONFLICT (id) DO NOTHING;

-- ── DATOS INICIALES: DUEÑO POR DEFECTO ──────────────────────────────
INSERT INTO duenos (id, nombre, telefono)
VALUES ('d_1', 'Socio Principal', '953 100 2000')
ON CONFLICT (id) DO NOTHING;

-- ── DATOS INICIALES: UNIDADES DE LA RUTA ────────────────────────────
INSERT INTO unidades (id, numero, placas, modelo, dueno_id)
VALUES
  ('u_01', '01', 'TH-01-A', 'Toyota Hiace',  'd_1'),
  ('u_02', '02', 'TH-02-A', 'Nissan Urvan',  'd_1'),
  ('u_13', '13', 'TH-13-A', 'Toyota Hiace',  'd_1'),
  ('u_16', '16', 'TH-16-A', 'Nissan Urvan',  'd_1'),
  ('u_17', '17', 'TH-17-A', 'Toyota Hiace',  'd_1')
ON CONFLICT (id) DO NOTHING;

-- ── DATOS INICIALES: CONDUCTORES ────────────────────────────────────
INSERT INTO conductores (id, nombre, unidad_predeterminada)
VALUES
  ('c_1', 'FREDY', '13'),
  ('c_2', 'OMAR',  '16'),
  ('c_3', 'IRVIG', '17')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- ✅ LISTO — Haz clic en "Run" (▶ el botón verde)
-- ════════════════════════════════════════════════════════════════
