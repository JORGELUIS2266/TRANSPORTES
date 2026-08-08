<template>
  <header class="header">
    <div class="header-content">
      <!-- ── Logo y Nombre Oficial de la Empresa ────────────────── -->
      <div class="brand">
        <img src="/logo_th_circle.jpg" alt="Logo TH" class="brand-logo-img" />
        <div class="brand-text-box">
          <h1 class="brand-title">TRANSPORTE TIERRA DE HUMO</h1>
          <span class="brand-corp">S.C. DE R.L. DE C.V.</span>
          <div class="brand-subtitle">
            <span class="service-tag">PASAJE · PAQUETERÍA · TURISMO</span>
            <span class="route-badge">Tlaxiaco ⇄ Putla</span>
          </div>
        </div>
      </div>

      <!-- ── Navegación Principal ──────────────────────────────── -->
      <nav class="nav-links">
        <router-link to="/"                  class="nav-item">📱 Captura del Día</router-link>
        <router-link to="/resumen"           class="nav-item">📊 Resumen Semanal</router-link>
        <router-link to="/vueltas"           class="nav-item">🔄 Vueltas</router-link>
        <router-link to="/unidades"          class="nav-item">🚐 Unidades</router-link>
        <router-link to="/exportar"          class="nav-item">📄 Exportar</router-link>
        <router-link v-if="auth.isAdmin" to="/bitacora" class="nav-item">📜 Bitácora</router-link>
      </nav>

      <!-- ── Panel de Usuario y Rol ────────────────────────────── -->
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
            @click.prevent="cerrarSesion"
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
  window.location.replace('/');
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
  border-bottom: 2.5px solid #dc2626;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1750px;
  margin: 0 auto;
  padding: 0.65rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* ── Brand & Logo Oficial ────────────────────────── */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.brand-logo-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #dc2626;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
}

.brand-text-box {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 900;
  color: #dc2626;
  margin: 0;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.brand-corp {
  font-size: 0.68rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.05em;
  margin-top: 0.05rem;
}

.brand-subtitle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 0.15rem;
  flex-wrap: wrap;
}

.service-tag {
  color: #475569;
  letter-spacing: 0.03em;
}

.route-badge {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.65rem;
}

/* ── Nav Links ───────────────────────────────────── */
.nav-links {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav-item {
  color: #475569;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.nav-item.router-link-active {
  background: #dc2626;
  color: #ffffff !important;
  font-weight: 900;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

/* ── User Box ────────────────────────────────────── */
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
}

.user-badge {
  font-size: 0.65rem;
  font-weight: 900;
  padding: 0.08rem 0.4rem;
  border-radius: 10px;
  margin-top: 0.1rem;
}

.badge-role-admin { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
.badge-role-capturista { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
.badge-role-lector { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }

.user-actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.btn-nav-action {
  font-size: 0.74rem;
  font-weight: 800;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  transition: all 0.15s;
}

.btn-admin-users {
  color: #4338ca;
  background: #eef2ff;
  border-color: #c7d2fe;
}
.btn-admin-users:hover { background: #e0e7ff; }

.btn-logout {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}
.btn-logout:hover { background: #fee2e2; }

@media (max-width: 900px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }
  .brand { justify-content: center; text-align: center; }
  .brand-text-box { align-items: center; }
  .nav-links { justify-content: center; }
  .user-session-box { justify-content: space-between; }
}
</style>
