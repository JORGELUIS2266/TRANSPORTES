-- =====================================================================
-- SEED / DATOS DE PRUEBA INITIALES
-- RUTA DE TRANSPORTE: TLAXCALA - PUTLA
-- =====================================================================

-- Insertar Usuarios de Prueba
INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
('11111111-1111-1111-1111-111111111111', 'Administrador General', 'admin@ruta.com', 'admin123', 'admin'),
('22222222-2222-2222-2222-222222222222', 'Don Roberto Gómez', 'roberto@socio.com', 'socio123', 'dueno'),
('33333333-3333-3333-3333-333333333333', 'Doña Martha Sánchez', 'martha@socio.com', 'socio123', 'dueno')
ON CONFLICT (email) DO NOTHING;

-- Insertar Dueños
INSERT INTO duenos (id, usuario_id, nombre, telefono) VALUES
('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Don Roberto Gómez', '246-123-4567'),
('a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Doña Martha Sánchez', '246-987-6543')
ON CONFLICT DO NOTHING;

-- Insertar Unidades (Camionetas)
INSERT INTO unidades (id, numero_unidad, placas, modelo, dueno_id) VALUES
('u1111111-1111-1111-1111-111111111111', 'Unidad 01', 'XXA-101-A', 'Nissan Urvan 2020', 'a1111111-1111-1111-1111-111111111111'),
('u2222222-2222-2222-2222-222222222222', 'Unidad 02', 'XXA-102-B', 'Toyota HiAce 2021', 'a1111111-1111-1111-1111-111111111111'),
('u3333333-3333-3333-3333-333333333333', 'Unidad 03', 'XXA-103-C', 'Nissan Urvan 2022', 'a2222222-2222-2222-2222-222222222222'),
('u4444444-4444-4444-4444-444444444444', 'Unidad 04', 'XXA-104-D', 'Ford Transit 2019', 'a2222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Insertar Conductores
INSERT INTO conductores (id, nombre, telefono, unidad_predeterminada_id) VALUES
('c1111111-1111-1111-1111-111111111111', 'Juan Carlos Pérez', '246-555-0101', 'u1111111-1111-1111-1111-111111111111'),
('c2222222-2222-2222-2222-222222222222', 'Miguel Ángel López', '246-555-0202', 'u2222222-2222-2222-2222-222222222222'),
('c3333333-3333-3333-3333-333333333333', 'José Luis Hernández', '246-555-0303', 'u3333333-3333-3333-3333-333333333333'),
('c4444444-4444-4444-4444-444444444444', 'Pedro Ramírez', '246-555-0404', 'u4444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- Insertar Préstamos/Anticipos
INSERT INTO prestamos (dueno_id, unidad_id, monto, concepto, estado) VALUES
('a1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 450.00, 'Anticipo llanta delantera', 'pendiente'),
('a2222222-2222-2222-2222-222222222222', 'u4444444-4444-4444-4444-444444444444', 300.00, 'Préstamo personal socio', 'pendiente')
ON CONFLICT DO NOTHING;

-- Insertar Registros Diarios de los últimos 7 días
-- Fecha actual base: 2026-07-16 a 2026-07-22

-- Día 1 (2026-07-16)
INSERT INTO registros_diarios (fecha, unidad_id, conductor_id, bitacora_tlaxcala_putla, bitacora_putla_tlaxcala, intermedios, combustible, gastos_imprevistos, concepto_gastos, vueltas_dadas, cerrado) VALUES
('2026-07-16', 'u1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 750, 680, 250, 600, 0, '', 2, TRUE),
('2026-07-16', 'u2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 800, 750, 300, 600, 150, 'Caseta y ponchadura', 2, TRUE),
('2026-07-16', 'u3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 500, 450, 150, 600, 0, '', 1, TRUE),
('2026-07-16', 'u4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 200, 150, 100, 600, 50, 'Filtro aceite', 1, TRUE) -- Saldo negativo! (450 - 650 = -200)

ON CONFLICT (fecha, unidad_id) DO NOTHING;

-- Día 2 (2026-07-17)
INSERT INTO registros_diarios (fecha, unidad_id, conductor_id, bitacora_tlaxcala_putla, bitacora_putla_tlaxcala, intermedios, combustible, gastos_imprevistos, concepto_gastos, vueltas_dadas, cerrado) VALUES
('2026-07-17', 'u1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 820, 790, 220, 600, 0, '', 2, TRUE),
('2026-07-17', 'u2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 710, 690, 180, 600, 0, '', 2, TRUE),
('2026-07-17', 'u3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 900, 850, 310, 600, 80, 'Limpiaparabrisas', 2, TRUE),
('2026-07-17', 'u4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 650, 600, 200, 600, 0, '', 2, TRUE)
ON CONFLICT (fecha, unidad_id) DO NOTHING;

-- Día 3 (2026-07-18)
INSERT INTO registros_diarios (fecha, unidad_id, conductor_id, bitacora_tlaxcala_putla, bitacora_putla_tlaxcala, intermedios, combustible, gastos_imprevistos, concepto_gastos, vueltas_dadas, cerrado) VALUES
('2026-07-18', 'u1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 790, 720, 210, 600, 0, '', 2, TRUE),
('2026-07-18', 'u2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 850, 800, 290, 600, 0, '', 2, TRUE),
('2026-07-18', 'u3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 780, 740, 200, 600, 0, '', 2, TRUE),
('2026-07-18', 'u4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 300, 200, 50, 600, 120, 'Foco fundido', 1, TRUE) -- Saldo negativo!
ON CONFLICT (fecha, unidad_id) DO NOTHING;

-- Día 4 (2026-07-19)
INSERT INTO registros_diarios (fecha, unidad_id, conductor_id, bitacora_tlaxcala_putla, bitacora_putla_tlaxcala, intermedios, combustible, gastos_imprevistos, concepto_gastos, vueltas_dadas, cerrado) VALUES
('2026-07-19', 'u1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 880, 830, 260, 600, 0, '', 2, TRUE),
('2026-07-19', 'u2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 910, 870, 320, 600, 0, '', 2, TRUE),
('2026-07-19', 'u3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 840, 790, 230, 600, 0, '', 2, TRUE),
('2026-07-19', 'u4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 720, 680, 210, 600, 0, '', 2, TRUE)
ON CONFLICT (fecha, unidad_id) DO NOTHING;

-- Día 5 (2026-07-20)
INSERT INTO registros_diarios (fecha, unidad_id, conductor_id, bitacora_tlaxcala_putla, bitacora_putla_tlaxcala, intermedios, combustible, gastos_imprevistos, concepto_gastos, vueltas_dadas, cerrado) VALUES
('2026-07-20', 'u1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 760, 710, 190, 600, 0, '', 2, TRUE),
('2026-07-20', 'u2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 830, 780, 240, 600, 0, '', 2, TRUE),
('2026-07-20', 'u3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 800, 750, 220, 600, 0, '', 2, TRUE),
('2026-07-20', 'u4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 700, 650, 190, 600, 0, '', 2, TRUE)
ON CONFLICT (fecha, unidad_id) DO NOTHING;

-- Día 6 (2026-07-21)
INSERT INTO registros_diarios (fecha, unidad_id, conductor_id, bitacora_tlaxcala_putla, bitacora_putla_tlaxcala, intermedios, combustible, gastos_imprevistos, concepto_gastos, vueltas_dadas, cerrado) VALUES
('2026-07-21', 'u1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 810, 740, 210, 600, 0, '', 2, TRUE),
('2026-07-21', 'u2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 880, 820, 270, 600, 0, '', 2, TRUE),
('2026-07-21', 'u3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 770, 710, 200, 600, 0, '', 2, TRUE),
('2026-07-21', 'u4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 680, 630, 180, 600, 0, '', 2, TRUE)
ON CONFLICT (fecha, unidad_id) DO NOTHING;

-- Día 7 (2026-07-22 - Hoy, editable para demostración)
INSERT INTO registros_diarios (fecha, unidad_id, conductor_id, bitacora_tlaxcala_putla, bitacora_putla_tlaxcala, intermedios, combustible, gastos_imprevistos, concepto_gastos, vueltas_dadas, cerrado) VALUES
('2026-07-22', 'u1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 500, 200, 200, 600, 0, 'En ruta', 2, FALSE),
('2026-07-22', 'u2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 600, 550, 150, 600, 0, '', 2, FALSE)
ON CONFLICT (fecha, unidad_id) DO NOTHING;
