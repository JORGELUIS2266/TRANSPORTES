<template>
  <header class="header">
    <div class="header-content">
      <div class="brand">
        <span class="brand-icon">🚌</span>
        <div>
          <h1 class="brand-title">TRANSPORTE TIERRA DE HUMOS</h1>
          <span class="brand-subtitle">Ruta Oficial: Tlaxiaco ➔ Putla</span>
        </div>
      </div>

      <nav class="nav-links">
        <router-link to="/"                  class="nav-item">📱 Captura</router-link>
        <router-link to="/resumen"           class="nav-item">📊 Resumen</router-link>
        <router-link to="/vueltas"           class="nav-item">🔄 Vueltas</router-link>
        <router-link to="/unidades"          class="nav-item">🚐 Unidades</router-link>
        <router-link to="/exportar"          class="nav-item">📄 Exportar</router-link>
        <router-link v-if="auth.isAdmin" to="/bitacora" class="nav-item">📜 Bitácora</router-link>
      </nav>

      <!-- Panel de Usuario y Rol -->
      <div class="user-session-box" v-if="auth.currentUser">
        <div class="user-info">
          <span class="user-name">{{ auth.currentUser.nombre }}</span>
          <span class="user-badge" :class="getBadgeClass(auth.currentUser.rol)">
            {{ auth.currentUser.icono }} {{ getRolLabel(auth.currentUser.rol) }}
          </span>
        </div>

        <div class="user-actions">
          <button
            v-if="auth.isAdmin"
            @click="auth.showUserAdminModal = true"
            class="btn-nav-action btn-admin-users"
            title="Administrar Usuarios y Credenciales"
          >
            👥 Usuarios
          </button>

          <button
            @click="cerrarSesion"
            class="btn-nav-action btn-logout"
            title="Cerrar sesión activa"
          >
            🚪 Salir
          </button>
        </div>
      </div>
      <div v-else>
        <button @click="auth.logout()" class="btn btn-sm btn-red">
          🔑 Iniciar Sesión
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

function cerrarSesion() {
  auth.logout();
  window.location.reload();
}

function getRolLabel(rol) {
  if (rol === 'admin') return 'ADMIN';
  if (rol === 'capturista') return 'CAPTURISTA';
  return 'LECTOR';
}

function getBadgeClass(rol) {
  if (rol === 'admin') return 'badge-role-admin';
  if (rol === 'capturista') return 'badge-role-capturista';
  return 'badge-role-lector';
}
</script>

<style scoped>
.header {
  background: #ffffff;
  border-bottom: 3px solid var(--accent-red);
  padding: 0.75rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.header-content {
  max-width: 1800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand { display: flex; align-items: center; gap: 0.75rem; }
.brand-icon  { font-size: 2.2rem; }
.brand-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--accent-red);
  margin: 0;
  letter-spacing: -0.01em;
}
.brand-subtitle { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }

.nav-links { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }

.nav-item {
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.84rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  transition: all 0.18s ease;
  background: #f1f5f9;
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

.nav-item:hover,
.router-link-exact-active {
  color: #ffffff;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  border-color: #dc2626;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

/* ── Panel de Usuario ──────────────────────────────── */
.user-session-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.75rem;
  border-radius: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-size: 0.78rem;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
}

.user-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 12px;
  letter-spacing: 0.03em;
}

.badge-role-admin {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.badge-role-capturista {
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid #bae6fd;
}

.badge-role-lector {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.user-actions {
  display: flex;
  gap: 0.35rem;
}

.btn-nav-action {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-admin-users:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fca5a5;
}

.btn-logout:hover {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #ef4444;
}

@media (max-width: 960px) {
  .header-content { flex-direction: column; align-items: flex-start; }
  .nav-links { width: 100%; overflow-x: auto; padding-bottom: 0.25rem; }
  .user-session-box { width: 100%; justify-content: space-between; }
}
</style>
