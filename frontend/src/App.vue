<template>
  <div class="app-container">
    <!-- Si está autenticado, muestra el sistema completo -->
    <template v-if="auth.isAuthenticated">
      <Navbar />
      <main class="main-content">
        <router-view />
      </main>
      <!-- Modal para que el Administrador gestione usuarios -->
      <UserAdminModal />
    </template>

    <!-- Pantalla de Login obligatoria si no ha iniciado sesión -->
    <LoginModal v-else />
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth';
import Navbar from './components/Navbar.vue';
import LoginModal from './components/LoginModal.vue';
import UserAdminModal from './components/UserAdminModal.vue';

const auth = useAuthStore();
</script>
