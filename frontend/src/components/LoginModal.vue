<template>
  <div v-if="!auth.isAuthenticated" class="login-fullscreen">
    <div class="login-box-card">
      <!-- Encabezado con Logo Oficial de la Empresa -->
      <div class="login-header">
        <img src="/logo_th_circle.jpg" alt="Logo Transporte Tierra de Humo" class="login-logo-circle" />
        <h1 class="login-brand-title">TRANSPORTE TIERRA DE HUMO</h1>
        <span class="login-corp-subtitle">S.C. DE R.L. DE C.V.</span>
        <p class="login-services">PASAJE · PAQUETERÍA · TURISMO</p>
        <div class="login-badge-route">Ruta Oficial: Tlaxiaco ⇄ Putla</div>
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

      <!-- Pie de Seguridad y Soporte -->
      <div class="login-footer">
        <div class="security-info">
          🔒 Acceso cifrado en tiempo real conectado a Supabase Cloud
        </div>
        <small class="company-legal">
          Transporte Tierra de Humo S.C. de R.L. de C.V. · Tlaxiaco - Putla Villa de Guerrero, Oaxaca
        </small>
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
    errorMsg.value = e.message || 'Error de autenticación.';
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.login-fullscreen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
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
  padding: 2.25rem 2rem;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6);
  border: 2px solid #fee2e2;
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-logo-circle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #dc2626;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.25);
  margin-bottom: 0.75rem;
}

.login-brand-title {
  font-size: 1.25rem;
  font-weight: 900;
  color: #dc2626;
  margin: 0;
  letter-spacing: -0.01em;
}

.login-corp-subtitle {
  font-size: 0.76rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.06em;
  margin-top: 0.1rem;
}

.login-services {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  margin: 0.2rem 0 0.5rem;
  letter-spacing: 0.04em;
}

.login-badge-route {
  display: inline-block;
  background: #fff5f5;
  color: #dc2626;
  border: 1px solid #fca5a5;
  padding: 0.2rem 0.75rem;
  border-radius: 20px;
  font-size: 0.74rem;
  font-weight: 800;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-input {
  font-size: 0.95rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 2.75rem;
}

.btn-toggle-pass {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
}

.btn-login-submit {
  font-size: 0.95rem;
  padding: 0.75rem;
  border-radius: 10px;
  font-weight: 900;
  margin-top: 0.5rem;
  letter-spacing: 0.02em;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
}

.login-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.security-info {
  font-size: 0.74rem;
  color: #059669;
  font-weight: 800;
}

.company-legal {
  font-size: 0.68rem;
  color: #94a3b8;
}
</style>
