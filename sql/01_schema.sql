-- =====================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL / POSTGREST
-- RUTA DE TRANSPORTE: TLAXCALA - PUTLA
-- =====================================================================

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios y Roles (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'dueno')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Dueños / Socios
CREATE TABLE IF NOT EXISTS duenos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Unidades (Camionetas)
CREATE TABLE IF NOT EXISTS unidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_unidad VARCHAR(20) UNIQUE NOT NULL,
    placas VARCHAR(20) NOT NULL,
    modelo VARCHAR(50),
    dueno_id UUID REFERENCES duenos(id) ON DELETE CASCADE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Conductores
CREATE TABLE IF NOT EXISTS conductores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    unidad_predeterminada_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Descuentos / Préstamos
CREATE TABLE IF NOT EXISTS prestamos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dueno_id UUID REFERENCES duenos(id) ON DELETE CASCADE,
    unidad_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    monto NUMERIC(10, 2) NOT NULL CHECK (monto > 0),
    concepto TEXT NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'descontado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table de Registros Diarios por Unidad (Bitácoras)
CREATE TABLE IF NOT EXISTS registros_diarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    conductor_id UUID REFERENCES conductores(id) ON DELETE SET NULL,
    bitacora_tlaxcala_putla NUMERIC(10, 2) DEFAULT 0.00 CHECK (bitacora_tlaxcala_putla >= 0),
    bitacora_putla_tlaxcala NUMERIC(10, 2) DEFAULT 0.00 CHECK (bitacora_putla_tlaxcala >= 0),
    intermedios NUMERIC(10, 2) DEFAULT 0.00 CHECK (intermedios >= 0),
    total_generado NUMERIC(10, 2) GENERATED ALWAYS AS (bitacora_tlaxcala_putla + bitacora_putla_tlaxcala + intermedios) STORED,
    combustible NUMERIC(10, 2) DEFAULT 600.00 CHECK (combustible >= 0),
    gastos_imprevistos NUMERIC(10, 2) DEFAULT 0.00 CHECK (gastos_imprevistos >= 0),
    concepto_gastos TEXT,
    total_neto NUMERIC(10, 2) GENERATED ALWAYS AS (bitacora_tlaxcala_putla + bitacora_putla_tlaxcala + intermedios - combustible - gastos_imprevistos) STORED,
    vueltas_dadas INT DEFAULT 1 CHECK (vueltas_dadas >= 0),
    cerrado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fecha, unidad_id)
);

-- 7. Tabla de Cierres Semanales y Liquidaciones
CREATE TABLE IF NOT EXISTS cierres_semanales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    total_generado_global NUMERIC(12, 2) NOT NULL,
    total_vueltas_global INT NOT NULL,
    valor_por_vuelta NUMERIC(10, 2) NOT NULL,
    cuota_admin_semanal NUMERIC(10, 2) DEFAULT 300.00,
    cerrado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla Detalle Liquidaciones por Unidad y Dueño
CREATE TABLE IF NOT EXISTS detalle_liquidaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cierre_semanal_id UUID REFERENCES cierres_semanales(id) ON DELETE CASCADE,
    dueno_id UUID REFERENCES duenos(id) ON DELETE CASCADE,
    unidad_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    vueltas_unidad INT NOT NULL,
    ingreso_bruto NUMERIC(10, 2) NOT NULL,
    cuota_admin NUMERIC(10, 2) NOT NULL,
    gastos_imprevistos NUMERIC(10, 2) NOT NULL,
    descuentos_prestamos NUMERIC(10, 2) NOT NULL,
    pago_final_neto NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VISTA DE RESUMEN DIARIO CON METADATOS
CREATE OR REPLACE VIEW vista_registros_diarios AS
SELECT 
    r.id,
    r.fecha,
    r.unidad_id,
    u.numero_unidad,
    u.placas,
    d.id AS dueno_id,
    d.nombre AS nombre_dueno,
    r.conductor_id,
    c.nombre AS nombre_conductor,
    r.bitacora_tlaxcala_putla,
    r.bitacora_putla_tlaxcala,
    r.intermedios,
    r.total_generado,
    r.combustible,
    r.gastos_imprevistos,
    r.concepto_gastos,
    r.total_neto,
    r.vueltas_dadas,
    r.cerrado,
    r.created_at
FROM registros_diarios r
JOIN unidades u ON r.unidad_id = u.id
JOIN duenos d ON u.dueno_id = d.id
LEFT JOIN conductores c ON r.conductor_id = c.id;
