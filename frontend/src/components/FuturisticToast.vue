<template>
  <div class="futuristic-toast-hub" :class="'pos-' + toastState.position">
    <TransitionGroup name="cyber-toast">
      <div
        v-for="item in toastState.items"
        :key="item.id"
        class="cyber-toast-card"
        :class="'cyber-' + item.type"
      >
        <!-- Borde luminoso animado -->
        <div class="cyber-glow-bar"></div>

        <!-- Ícono con halo futurista -->
        <div class="cyber-icon-orb">
          <span v-if="item.type === 'success'">✨</span>
          <span v-else-if="item.type === 'error'">🚨</span>
          <span v-else-if="item.type === 'warning'">⚡</span>
          <span v-else-if="item.type === 'camera'">📸</span>
          <span v-else>🤖</span>
        </div>

        <!-- Contenido de la notificación -->
        <div class="cyber-content">
          <div class="cyber-header-row">
            <span class="cyber-tag">
              {{ tagLabel(item.type) }}
            </span>
            <span class="cyber-time">AHORA</span>
          </div>
          <h4 class="cyber-title">{{ item.title }}</h4>
          <p v-if="item.message" class="cyber-message">{{ item.message }}</p>

          <!-- Botón de acción opcional dentro de la notificación -->
          <div v-if="item.actionText && item.onAction" class="cyber-actions">
            <button
              type="button"
              @click="handleAction(item)"
              class="cyber-action-btn"
            >
              {{ item.actionText }}
            </button>
          </div>
        </div>

        <!-- Botón cerrar -->
        <button
          type="button"
          class="cyber-close-btn"
          @click="dismissToast(item.id)"
          title="Cerrar notificación"
        >
          ✕
        </button>

        <!-- Barra de progreso inferior -->
        <div
          v-if="item.duration > 0"
          class="cyber-progress-line"
          :style="{ animationDuration: item.duration + 'ms' }"
        ></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { toastState, dismissToast } from '../utils/toast';

function tagLabel(type) {
  if (type === 'success') return 'OPERACIÓN EXITOSA';
  if (type === 'error')   return 'ALERTA DEL SISTEMA';
  if (type === 'warning') return 'AVISO IMPORTANTE';
  if (type === 'camera')  return 'VISIÓN ARTIFICIAL · CÁMARA';
  return 'NOTIFICACIÓN IA';
}

function handleAction(item) {
  if (typeof item.onAction === 'function') {
    item.onAction();
  }
  dismissToast(item.id);
}
</script>

<style scoped>
.futuristic-toast-hub {
  position: fixed;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 410px;
  width: calc(100vw - 2rem);
  pointer-events: none;
}

.pos-top-left {
  top: 1.15rem;
  left: 1.15rem;
}

.pos-bottom-left {
  bottom: 1.15rem;
  left: 1.15rem;
}

.cyber-toast-card {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.95rem 1.1rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 20px 45px -10px rgba(0, 0, 0, 0.55),
    0 0 25px rgba(59, 130, 246, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

/* Variantes de color neón */
.cyber-success {
  border-color: rgba(16, 185, 129, 0.45);
  box-shadow: 0 18px 40px -10px rgba(0, 0, 0, 0.55), 0 0 24px rgba(16, 185, 129, 0.25);
}
.cyber-error {
  border-color: rgba(239, 68, 68, 0.55);
  box-shadow: 0 18px 40px -10px rgba(0, 0, 0, 0.55), 0 0 26px rgba(239, 68, 68, 0.3);
}
.cyber-warning {
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 18px 40px -10px rgba(0, 0, 0, 0.55), 0 0 24px rgba(245, 158, 11, 0.25);
}
.cyber-camera,
.cyber-info {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 18px 40px -10px rgba(0, 0, 0, 0.55), 0 0 26px rgba(56, 189, 248, 0.28);
}

.cyber-glow-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: linear-gradient(180deg, #38bdf8, #6366f1);
}
.cyber-success .cyber-glow-bar {
  background: linear-gradient(180deg, #34d399, #059669);
}
.cyber-error .cyber-glow-bar {
  background: linear-gradient(180deg, #f87171, #dc2626);
}
.cyber-warning .cyber-glow-bar {
  background: linear-gradient(180deg, #fbbf24, #d97706);
}

.cyber-icon-orb {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.08);
}

.cyber-content {
  flex: 1;
  min-width: 0;
}

.cyber-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
}

.cyber-tag {
  font-size: 0.63rem;
  font-weight: 900;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #38bdf8;
}
.cyber-success .cyber-tag { color: #34d399; }
.cyber-error .cyber-tag   { color: #f87171; }
.cyber-warning .cyber-tag { color: #fbbf24; }

.cyber-time {
  font-size: 0.6rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.06em;
}

.cyber-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.cyber-message {
  margin: 0.22rem 0 0;
  font-size: 0.78rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.cyber-actions {
  margin-top: 0.55rem;
}

.cyber-action-btn {
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #ffffff;
  border: 1px solid rgba(147, 197, 253, 0.4);
  padding: 0.32rem 0.75rem;
  border-radius: 8px;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
}
.cyber-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.cyber-close-btn {
  background: rgba(255, 255, 255, 0.07);
  color: #94a3b8;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.cyber-close-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #ffffff;
}

.cyber-progress-line {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  transform-origin: left;
  animation: shrinkBar linear forwards;
}
.cyber-success .cyber-progress-line {
  background: linear-gradient(90deg, #10b981, #34d399);
}
.cyber-error .cyber-progress-line {
  background: linear-gradient(90deg, #ef4444, #f87171);
}
.cyber-warning .cyber-progress-line {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

@keyframes shrinkBar {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* Transiciones elegantes de entrada y salida */
.cyber-toast-enter-active {
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.cyber-toast-leave-active {
  transition: all 0.22s ease-in;
}
.cyber-toast-enter-from {
  opacity: 0;
  transform: translateX(-40px) scale(0.92);
}
.cyber-toast-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}
</style>
