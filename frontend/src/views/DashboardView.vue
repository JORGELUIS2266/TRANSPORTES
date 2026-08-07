<template>
  <div class="dashboard-page">
    <SemaforoRentabilidad />
    <div style="margin-top: 2rem;">
      <TablaBitacora />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import SemaforoRentabilidad from '../components/SemaforoRentabilidad.vue';
import TablaBitacora from '../components/TablaBitacora.vue';
import { useTransportStore } from '../stores/transport';

const transportStore = useTransportStore();

onMounted(() => {
  transportStore.cargarDatos();
});
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
