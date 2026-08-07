# 🚌 TRANSPORTE TIERRA DE HUMOS
### Sistema Integral de Control Operativo, Liquidaciones y Auditoría
**Ruta Oficial:** Tlaxiaco ➔ Putla (Oaxaca)

---

## 🌟 Características Principales

- **🔐 Seguridad y Cifrado Criptográfico:**
  - Hashing SHA-256 para contraseñas de usuarios.
  - Cifrado AES / Base64 simétrico para todos los registros operativos y financieros almacenados.
  - Inicio de sesión obligatorio sin bypass ni credenciales visibles.

- **👥 Control de Acceso Basado en Roles (RBAC):**
  - 👑 **Administrador:** Acceso total, gestión de usuarios, auditoría en tiempo real, catálogos y respaldos.
  - ✍️ **Capturista:** Llenado y edición de bitácoras diarias de vueltas.
  - 👁️ **Lector / Socio:** Modo solo consulta sin descargas ni modificaciones.

- **📜 Bitácora de Auditoría en Tiempo Real:**
  - Monitoreo en vivo con detección automática de dirección IP, dispositivo y sistema operativo.
  - Registro de inicios de sesión, capturas, modificaciones, eliminaciones y respaldos.

- **📅 Sistema de Calendario y Semanas Reales:**
  - Semanas gregorianas de Lunes a Domingo (`Del DD al DD de Mes de YYYY`).
  - Navegación hacia semanas futuras (Septiembre, Octubre, Noviembre...) y semanas pasadas.
  - Arrastre de saldos y vueltas pendientes entre semanas.

- **☁️ Respaldos para Nube (OneDrive / Google Drive):**
  - Exportación total en formato JSON cifrado y restauración instantánea.
  - Descargas de reportes en PDF y Excel, y envío automático a WhatsApp.

---

## 🚀 Instalación y Despliegue Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/JORGELUIS2266/TRANSPORTES.git
cd TRANSPORTES/frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

---

## 🔑 Credenciales Iniciales del Sistema

| Rol | Usuario | Contraseña Inicial | Permisos |
| :--- | :--- | :--- | :--- |
| **👑 Administrador** | `admin` | `admin123` | Control total, usuarios y bitácora |
| **✍️ Capturista** | `operador` | `operador123` | Captura y llenado de vueltas |
| **👁️ Lector** | `socio` | `socio123` | Solo lectura (sin descargas) |

---
Desarrollado para el control de la ruta **Tlaxiaco ➔ Putla**.
