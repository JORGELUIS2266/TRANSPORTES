<template>
  <div v-if="auth.showUserAdminModal" class="modal-overlay" @click.self="cerrarModal">
    <div class="user-modal-box">

      <!-- ── Encabezado ─────────────────────────────────── -->
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="font-size:1.6rem;">👥</span>
          <div>
            <h3 style="margin:0; color:var(--accent-red); font-size:1.1rem;">Gestión de Usuarios</h3>
            <small style="color:var(--text-muted);">Crear, editar y eliminar accesos al sistema. Solo el Administrador tiene este panel.</small>
          </div>
        </div>
        <button @click="cerrarModal" class="modal-close" title="Cerrar">✕</button>
      </div>

      <div class="modal-body">

        <!-- ── Formulario Crear / Editar ──────────────────── -->
        <div class="form-card">
          <div class="form-card-title">
            {{ modoEdicion ? '✏️ Editar Usuario: @' + form.username : '➕ Registrar Nuevo Usuario' }}
          </div>

          <form @submit.prevent="guardarUsuario" class="grid-form">
            <!-- Nombre completo -->
            <div class="form-group">
              <label class="form-label">Nombre Completo <span class="req">*</span></label>
              <input
                type="text"
                v-model="form.nombre"
                class="form-input"
                placeholder="Ej. Juan Pérez García"
                required
              />
            </div>

            <!-- Username -->
            <div class="form-group">
              <label class="form-label">Usuario (para iniciar sesión) <span class="req">*</span></label>
              <input
                type="text"
                v-model="form.username"
                class="form-input"
                placeholder="Ej. jperez"
                :disabled="modoEdicion"
                :style="modoEdicion ? 'opacity:0.6; cursor:not-allowed;' : ''"
                required
              />
            </div>

            <!-- Contraseña -->
            <div class="form-group">
              <label class="form-label">
                {{ modoEdicion ? 'Nueva Contraseña (dejar vacío = sin cambio)' : 'Contraseña *' }}
              </label>
              <div class="password-wrap">
                <input
                  :type="mostrarPass ? 'text' : 'password'"
                  v-model="form.password"
                  class="form-input"
                  :placeholder="modoEdicion ? '••••••• (opcional)' : 'Mínimo 4 caracteres'"
                  :required="!modoEdicion"
                />
                <button type="button" class="btn-toggle-pass" @click="mostrarPass = !mostrarPass" tabindex="-1">
                  {{ mostrarPass ? '🙈' : '👁️' }}
                </button>
              </div>
              <small v-if="modoEdicion" style="color:#64748b; font-size:0.73rem;">
                La contraseña actual es: <strong>{{ form.passwordActual || '(protegida)' }}</strong>
              </small>
            </div>

            <!-- Rol -->
            <div class="form-group">
              <label class="form-label">Rol de Acceso <span class="req">*</span></label>
              <select v-model="form.rol" class="form-input" required>
                <option value="admin">👑 Administrador — Acceso total, usuarios, edición y eliminación</option>
                <option value="capturista">✍️ Capturista — Solo llenar y capturar vueltas diarias</option>
                <option value="lector">👁️ Lector / Socio — Solo ver informes, sin editar ni descargar</option>
              </select>
            </div>

            <!-- Alertas -->
            <div v-if="msgExito" class="alert-success">✅ {{ msgExito }}</div>
            <div v-if="msgError" class="alert-error">❌ {{ msgError }}</div>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button type="submit" class="btn btn-red" :disabled="guardando">
                <span v-if="guardando">⏳ Guardando...</span>
                <span v-else>{{ modoEdicion ? '💾 Guardar Cambios' : '➕ Crear Usuario' }}</span>
              </button>
              <button v-if="modoEdicion" type="button" @click="cancelarEdicion" class="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <!-- ── Tabla de Usuarios ───────────────────────────── -->
        <div class="users-list-title">
          📋 Usuarios con Acceso al Sistema
          <span class="users-count">{{ auth.users.length }} usuarios</span>
        </div>

        <div class="table-responsive">
          <table class="table table-users">
            <thead>
              <tr>
                <th>Icono</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Contraseña</th>
                <th>Rol</th>
                <th style="text-align:center;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in auth.users" :key="u.id" :class="{ 'fila-activa': u.id === auth.currentUser?.id }">
                <td style="font-size:1.4rem; text-align:center;">{{ u.icono || '👤' }}</td>
                <td><strong>@{{ u.username }}</strong></td>
                <td>{{ u.nombre }}</td>
                <td>
                  <div class="pass-cell">
                    <span v-if="verContrasena[u.id]" class="pass-visible">{{ u.password_raw || '(cifrada)' }}</span>
                    <span v-else class="pass-dots">••••••••</span>
                    <button
                      type="button"
                      class="btn-pass-toggle"
                      @click="toggleVerContrasena(u.id)"
                      :title="verContrasena[u.id] ? 'Ocultar contraseña' : 'Ver contraseña'"
                    >
                      {{ verContrasena[u.id] ? '🙈' : '👁️' }}
                    </button>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="getBadgeClass(u.rol)">
                    {{ u.icono }} {{ getRolLabel(u.rol) }}
                  </span>
                </td>
                <td>
                  <div class="action-cell-users">
                    <span v-if="u.id === auth.currentUser?.id" class="chip-active">Sesión activa</span>
                    <template v-else>
                      <button
                        @click="editarUsuario(u)"
                        class="btn btn-sm btn-edit"
                        title="Editar usuario"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        @click="eliminar(u.id, u.username)"
                        class="btn btn-sm btn-delete"
                        title="Eliminar usuario"
                      >
                        🗑️
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
              <tr v-if="auth.users.length === 0">
                <td colspan="6" style="text-align:center; color:#94a3b8; padding:1.5rem;">
                  No hay usuarios registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <div class="modal-footer">
        <span style="font-size:0.78rem; color:#64748b;">
          🔒 Todos los cambios se guardan en Supabase en tiempo real y aplican en todos los dispositivos.
        </span>
        <button @click="cerrarModal" class="btn btn-secondary">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const modoEdicion  = ref(false);
const guardando    = ref(false);
const mostrarPass  = ref(false);
const msgExito     = ref('');
const msgError     = ref('');
const verContrasena = reactive({});

const form = ref({
  id:              '',
  nombre:          '',
  username:        '',
  password:        '',
  passwordActual:  '',
  rol:             'capturista'
});

function getRolLabel(rol) {
  if (rol === 'admin') return 'Administrador';
  if (rol === 'capturista') return 'Capturista';
  return 'Lector / Socio';
}

function getBadgeClass(rol) {
  if (rol === 'admin') return 'badge-danger';
  if (rol === 'capturista') return 'badge-info';
  return 'badge-success';
}

function toggleVerContrasena(userId) {
  verContrasena[userId] = !verContrasena[userId];
}

function editarUsuario(u) {
  modoEdicion.value = true;
  mostrarPass.value = false;
  msgExito.value    = '';
  msgError.value    = '';
  form.value = {
    id:             u.id,
    nombre:         u.nombre,
    username:       u.username,
    password:       '',
    passwordActual: u.password_raw || '',
    rol:            u.rol
  };
  // Scroll al formulario
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
  modoEdicion.value = false;
  mostrarPass.value = false;
  form.value = { id: '', nombre: '', username: '', password: '', passwordActual: '', rol: 'capturista' };
  msgExito.value = '';
  msgError.value = '';
}

function cerrarModal() {
  cancelarEdicion();
  auth.showUserAdminModal = false;
}

async function guardarUsuario() {
  msgExito.value = '';
  msgError.value = '';
  guardando.value = true;

  try {
    if (modoEdicion.value) {
      // ── ACTUALIZAR usuario existente
      await auth.actualizarUsuario({
        id:       form.value.id,
        nombre:   form.value.nombre.trim(),
        rol:      form.value.rol,
        password: form.value.password.trim() || null
      });
      msgExito.value = `Usuario "@${form.value.username}" actualizado correctamente.`;
      modoEdicion.value = false;
      form.value = { id: '', nombre: '', username: '', password: '', passwordActual: '', rol: 'capturista' };
    } else {
      // ── CREAR nuevo usuario
      await auth.agregarUsuario({
        nombre:   form.value.nombre.trim(),
        username: form.value.username.trim(),
        password: form.value.password.trim(),
        rol:      form.value.rol
      });
      msgExito.value = `Usuario "@${form.value.username}" creado. Ya puede iniciar sesión.`;
      form.value = { id: '', nombre: '', username: '', password: '', passwordActual: '', rol: 'capturista' };
    }
    setTimeout(() => { msgExito.value = ''; }, 4000);
  } catch (e) {
    msgError.value = e.message;
  } finally {
    guardando.value = false;
  }
}

async function eliminar(id, username) {
  if (!confirm(`¿Eliminar al usuario "@${username}"?\nYa no podrá acceder al sistema.`)) return;
  try {
    await auth.eliminarUsuario(id);
  } catch (e) {
    alert('Error: ' + e.message);
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.user-modal-box {
  background: white;
  border-radius: 16px;
  max-width: 760px;
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 60px -12px rgba(0,0,0,0.35);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #fee2e2;
  background: linear-gradient(135deg, #fff5f5, #fef2f2);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.modal-close {
  background: #fee2e2;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #dc2626;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.modal-close:hover { background: #fca5a5; }

/* ── Formulario ───────────────────────────── */
.form-card {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}

.form-card-title {
  font-size: 0.9rem;
  font-weight: 900;
  color: var(--accent-red);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.grid-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.form-group { display: flex; flex-direction: column; gap: 0.3rem; }

.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrap input { width: 100%; padding-right: 2.5rem; }

.btn-toggle-pass {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
}

.form-actions {
  grid-column: span 2;
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.alert-success {
  grid-column: span 2;
  background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46;
  padding: 0.5rem 0.75rem; border-radius: 6px;
  font-size: 0.82rem; font-weight: 700;
}

.alert-error {
  grid-column: span 2;
  background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626;
  padding: 0.5rem 0.75rem; border-radius: 6px;
  font-size: 0.82rem; font-weight: 700;
}

/* ── Tabla de usuarios ─────────────────────── */
.users-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.88rem;
  font-weight: 900;
  color: #0f172a;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.users-count {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  font-size: 0.72rem;
  padding: 0.15rem 0.55rem;
  border-radius: 12px;
  color: #475569;
  font-weight: 800;
}

.table-users th {
  background: #f1f5f9;
  font-size: 0.73rem;
  text-transform: uppercase;
  font-weight: 800;
  color: #0f172a;
}

.fila-activa { background: #f0fdf4 !important; }

.pass-cell {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pass-visible {
  font-family: monospace;
  font-size: 0.82rem;
  font-weight: 700;
  color: #0284c7;
  background: #f0f9ff;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.pass-dots { font-size: 0.9rem; color: #94a3b8; letter-spacing: 0.1em; }

.btn-pass-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  color: #64748b;
}

.action-cell-users {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-edit {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
  border-radius: 5px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-edit:hover { background: #dbeafe; }

.chip-active {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #86efac;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
}

.badge-danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-size:0.72rem; padding:0.18rem 0.5rem; border-radius:10px; font-weight:800; }
.badge-info    { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; font-size:0.72rem; padding:0.18rem 0.5rem; border-radius:10px; font-weight:800; }
.badge-success { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; font-size:0.72rem; padding:0.18rem 0.5rem; border-radius:10px; font-weight:800; }

@media (max-width: 600px) {
  .grid-form { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column; }
}
</style>
