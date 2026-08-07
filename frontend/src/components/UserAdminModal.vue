<template>
  <div v-if="auth.showUserAdminModal" class="modal-overlay" @click.self="auth.showUserAdminModal = false">
    <div class="user-modal-box">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="font-size:1.5rem;">👥</span>
          <div>
            <h3 style="margin:0; color:var(--accent-red); font-size:1.15rem;">Administración de Usuarios y Credenciales</h3>
            <small style="color:var(--text-muted);">Solo el Administrador puede crear o eliminar usuarios y roles.</small>
          </div>
        </div>
        <button @click="auth.showUserAdminModal = false" class="modal-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Formulario para Crear Nuevo Usuario -->
        <div class="card" style="background:#f8fafc; border:1px solid #cbd5e1; margin-bottom:1.5rem;">
          <div class="card-title" style="font-size:0.9rem; font-weight:800; color:#0f172a; margin-bottom:0.75rem;">
            ➕ Registrar Nuevo Usuario
          </div>

          <form @submit.prevent="crearUsuario" class="grid-form">
            <div class="form-group">
              <label class="form-label">Nombre Completo</label>
              <input type="text" v-model="form.nombre" class="form-input" placeholder="Ej. Juan Pérez" required />
            </div>

            <div class="form-group">
              <label class="form-label">Nombre de Usuario (Login)</label>
              <input type="text" v-model="form.username" class="form-input" placeholder="Ej. jperez" required />
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" v-model="form.password" class="form-input" placeholder="••••••••" required />
            </div>

            <div class="form-group">
              <label class="form-label">Rol de Acceso <span class="req">*</span></label>
              <select v-model="form.rol" class="form-input" required>
                <option value="admin">👑 Administrador (Acceso total, usuarios, edición y eliminación)</option>
                <option value="capturista">✍️ Capturista (Llenar y capturar vueltas)</option>
                <option value="lector">👁️ Lector / Consulta (Solo ver informes, sin editar ni descargar)</option>
              </select>
            </div>

            <div v-if="msgExito" class="alert-success">{{ msgExito }}</div>
            <div v-if="msgError" class="alert-error">{{ msgError }}</div>

            <button type="submit" class="btn btn-red" style="margin-top:0.5rem;">
              💾 Crear Usuario
            </button>
          </form>
        </div>

        <!-- Lista de Usuarios Registrados -->
        <div class="card-title" style="font-size:0.9rem; font-weight:800; color:#0f172a; margin-bottom:0.5rem;">
          📋 Usuarios con Acceso al Sistema ({{ auth.users.length }})
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Permisos</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in auth.users" :key="u.id">
                <td><strong>{{ u.username }}</strong></td>
                <td>{{ u.nombre }}</td>
                <td>
                  <span class="badge" :class="getBadgeClass(u.rol)">
                    {{ u.icono }} {{ getRolLabel(u.rol) }}
                  </span>
                </td>
                <td style="font-size:0.75rem; color:#64748b;">
                  <span v-if="u.rol === 'admin'">Acceso total + Usuarios</span>
                  <span v-else-if="u.rol === 'capturista'">Captura de vueltas</span>
                  <span v-else>Solo consulta de reportes</span>
                </td>
                <td class="text-right">
                  <button
                    v-if="u.id !== auth.currentUser?.id"
                    @click="eliminar(u.id, u.username)"
                    class="btn btn-sm btn-delete"
                    title="Eliminar usuario"
                  >
                    🗑️
                  </button>
                  <span v-else style="font-size:0.75rem; color:#059669; font-weight:700;">(Sesión activa)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="auth.showUserAdminModal = false" class="btn btn-secondary">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const form = ref({
  nombre: '',
  username: '',
  password: '',
  rol: 'capturista'
});

const msgExito = ref('');
const msgError = ref('');

function getRolLabel(rol) {
  if (rol === 'admin') return 'Administrador';
  if (rol === 'capturista') return 'Capturista';
  return 'Lector / Consulta';
}

function getBadgeClass(rol) {
  if (rol === 'admin') return 'badge-danger';
  if (rol === 'capturista') return 'badge-info';
  return 'badge-success';
}

async function crearUsuario() {
  msgExito.value = '';
  msgError.value = '';
  try {
    await auth.agregarUsuario(form.value);
    msgExito.value = `Usuario "${form.value.username}" creado exitosamente.`;
    form.value = { nombre: '', username: '', password: '', rol: 'capturista' };
  } catch (e) {
    msgError.value = e.message;
  }
}

async function eliminar(id, username) {
  if (!confirm(`¿Eliminar al usuario "${username}"? Ya no podrá acceder al sistema.`)) return;
  try {
    await auth.eliminarUsuario(id);
  } catch (e) {
    alert(e.message);
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.user-modal-box {
  background: white;
  border-radius: 14px;
  max-width: 680px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: #fff5f5;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex; justify-content: flex-end;
  background: #f8fafc;
}

.modal-close {
  background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #64748b;
}

.grid-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.grid-form button {
  grid-column: span 2;
}

.alert-success {
  grid-column: span 2;
  background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46;
  padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 700;
}

.alert-error {
  grid-column: span 2;
  background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626;
  padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 700;
}

.badge-danger  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.badge-info    { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
.badge-success { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
</style>
