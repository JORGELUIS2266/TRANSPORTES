<template>
  <div class="liquidacion-page">
    <LiquidacionSemanal />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import LiquidacionSemanal from '../components/LiquidacionSemanal.vue';
import { useTransportStore } from '../stores/transport';

const transportStore = useTransportStore();

onMounted(() => {
  transportStore.cargarDatos();
});
</script>
