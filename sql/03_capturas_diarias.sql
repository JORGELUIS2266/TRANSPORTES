-- Tabla alineada con el modelo del frontend (captura operativa diaria)
CREATE TABLE IF NOT EXISTS capturas_diarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    numero_unidad VARCHAR(50) NOT NULL,
    nombre_conductor VARCHAR(100) NOT NULL,
    vueltas_dadas INT DEFAULT 1 CHECK (vueltas_dadas >= 0),
    bitacora_tlaxiaco_putla NUMERIC(10, 2) DEFAULT 0.00 CHECK (bitacora_tlaxiaco_putla >= 0),
    bitacora_putla_tlaxiaco NUMERIC(10, 2) DEFAULT 0.00 CHECK (bitacora_putla_tlaxiaco >= 0),
    intermedios NUMERIC(10, 2) DEFAULT 0.00 CHECK (intermedios >= 0),
    total_generado NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    combustible NUMERIC(10, 2) DEFAULT 600.00 CHECK (combustible >= 0),
    gastos_imprevistos NUMERIC(10, 2) DEFAULT 0.00 CHECK (gastos_imprevistos >= 0),
    concepto_gastos TEXT DEFAULT '',
    total_neto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'completado' CHECK (estado IN ('pendiente', 'completado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capturas_fecha ON capturas_diarias (fecha);
CREATE INDEX IF NOT EXISTS idx_capturas_created ON capturas_diarias (created_at);
