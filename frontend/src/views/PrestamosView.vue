<template>
  <div class="prestamos-page">
    <PrestamosManager />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import PrestamosManager from '../components/PrestamosManager.vue';
import { useTransportStore } from '../stores/transport';

const transportStore = useTransportStore();

onMounted(() => {
  transportStore.cargarDatos();
});
</script>
