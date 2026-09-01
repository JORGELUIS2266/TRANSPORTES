-- ════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Orden de registros + Capturado por + Color de usuario
-- TRANSPORTE TIERRA DE HUMOS
-- ════════════════════════════════════════════════════════════════
-- Ejecutar en Supabase → SQL Editor

-- 1. Nuevo campo 'orden' en registros (para reordenamiento con drag & drop)
ALTER TABLE registros ADD COLUMN IF NOT EXISTS orden BIGINT DEFAULT 0;

-- 2. Inicializar 'orden' con el timestamp del registro para mantener el orden actual
UPDATE registros
SET orden = EXTRACT(EPOCH FROM COALESCE(created_at, NOW())) * 1000
WHERE orden = 0 OR orden IS NULL;

-- 3. Campo de quien capturó el registro (taquillera de turno)
ALTER TABLE registros ADD COLUMN IF NOT EXISTS capturado_por_id   TEXT DEFAULT '';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS capturado_por_nombre TEXT DEFAULT '';

-- 4. Color asignado a cada usuario (lo asigna el administrador)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#1e293b';

-- Verificar que quedaron los campos
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('registros', 'usuarios')
  AND column_name IN ('orden', 'capturado_por_id', 'capturado_por_nombre', 'color')
ORDER BY table_name, column_name;
