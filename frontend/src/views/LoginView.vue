<template>
  <div class="login-container">
    <div class="card login-card">
      <div class="login-brand">
        <span class="logo">🚌</span>
        <h2>Ruta Tlaxcala - Putla</h2>
        <p>Selecciona tu perfil de acceso para la demostración</p>
      </div>

      <div class="roles-selection">
        <button @click="selectAdmin" class="btn btn-primary btn-full role-btn">
          👨‍✈️ Acceder como Administrador (Control Total)
        </button>

        <div class="divider-text">o selecciona un Socio/Dueño:</div>

        <button 
          v-for="d in transportStore.duenos" 
          :key="d.id" 
          @click="selectDueno(d)"
          class="btn btn-secondary btn-full role-btn"
        >
          👤 Acceder como {{ d.nombre }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useTransportStore } from '../stores/transport';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const transportStore = useTransportStore();
const router = useRouter();

function selectAdmin() {
  authStore.setRole('admin', 'Administrador General');
  router.push('/');
}

function selectDueno(dueno) {
  authStore.setRole('dueno', dueno.nombre, dueno.id);
  router.push('/');
}

onMounted(() => {
  transportStore.cargarDatos();
});
</script>

<style scoped>
.login-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  max-width: 450px;
  width: 100%;
  padding: 2rem;
  text-align: center;
}

.logo {
  font-size: 3rem;
}

.login-brand h2 {
  font-size: 1.5rem;
  margin-top: 0.5rem;
}

.login-brand p {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.roles-selection {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.divider-text {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin: 0.5rem 0;
}

.role-btn {
  padding: 1rem;
}
</style>
