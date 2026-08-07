<template>
  <div v-if="!auth.isAuthenticated" class="login-fullscreen">
    <div class="login-box-card">
      <!-- Encabezado de la Empresa -->
      <div class="login-header">
        <div class="login-brand-icon">🚌</div>
        <h1 class="login-brand-title">TRANSPORTE TIERRA DE HUMOS</h1>
        <p class="login-route">Ruta Oficial: Tlaxiaco ➔ Putla</p>
        <div class="login-badge">SISTEMA OPERATIVO & CONTROL DE RUTAS</div>
      </div>

      <!-- Formulario de Acceso Seguro -->
      <form @submit.prevent="submitLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Nombre de Usuario <span class="req">*</span></label>
          <input
            type="text"
            v-model="username"
            class="form-input login-input"
            placeholder="Ingresa tu usuario..."
            required
            autocomplete="username"
            autofocus
          />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña <span class="req">*</span></label>
          <div class="password-wrapper">
            <input
              :type="mostrarPassword ? 'text' : 'password'"
              v-model="password"
              class="form-input login-input"
              placeholder="••••••••••••"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="btn-toggle-pass"
              @click="mostrarPassword = !mostrarPassword"
              tabindex="-1"
              title="Mostrar/Ocultar contraseña"
            >
              {{ mostrarPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="alert-error">
          ⚠️ {{ errorMsg }}
        </div>

        <button type="submit" class="btn btn-red btn-full btn-login-submit" :disabled="cargando">
          <span v-if="cargando">⏳ Verificando credenciales...</span>
          <span v-else>🔑 Iniciar Sesión en el Sistema</span>
        </button>
      </form>

      <!-- Pie de Seguridad Criptográfica -->
      <div class="login-footer-security">
        <span class="sec-icon">🔒</span>
        <span>Acceso protegido con cifrado criptográfico SHA-256.</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const username = ref('');
const password = ref('');
const mostrarPassword = ref(false);
const errorMsg = ref('');
const cargando = ref(false);

async function submitLogin() {
  errorMsg.value = '';
  cargando.value = true;
  try {
    await auth.login(username.value, password.value);
    username.value = '';
    password.value = '';
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.login-fullscreen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 1.25rem;
}

.login-box-card {
  background: #ffffff;
  border-radius: 20px;
  max-width: 440px;
  width: 100%;
  padding: 2.5rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  border-top: 6px solid var(--accent-red);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-brand-icon {
  font-size: 3.2rem;
  margin-bottom: 0.25rem;
}

.login-brand-title {
  color: var(--accent-red);
  font-size: 1.25rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: -0.01em;
}

.login-route {
  color: #475569;
  font-size: 0.88rem;
  font-weight: 700;
  margin: 0.25rem 0 0.6rem;
}

.login-badge {
  display: inline-block;
  background: #fee2e2;
  color: #dc2626;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.25rem 0.85rem;
  border-radius: 20px;
  letter-spacing: 0.04em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-input {
  font-size: 1rem;
  padding: 0.75rem 0.95rem;
  border-radius: 8px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 2.75rem;
}

.btn-toggle-pass {
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  font-size: 1.15rem;
  cursor: pointer;
  padding: 0.3rem;
  color: #64748b;
}

.btn-login-submit {
  font-size: 1rem;
  font-weight: 800;
  padding: 0.85rem 1.25rem;
  margin-top: 0.5rem;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
  border-radius: 8px;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
}

.login-footer-security {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  font-size: 0.74rem;
  color: #64748b;
  font-weight: 600;
}

.sec-icon {
  font-size: 0.9rem;
}

.req { color: #dc2626; }
</style>
