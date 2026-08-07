import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import { calcularLiquidacionSemanal } from '../utils/settlementAlgorithm';

export const useTransportStore = defineStore('transport', () => {
  const duenos = ref([]);
  const unidades = ref([]);
  const conductores = ref([]);
  const prestamos = ref([]);
  const registrosDiarios = ref([]);
  const loading = ref(false);

  const hoy = new Date().toISOString().split('T')[0];
  const fechaFin = ref(hoy);
  
  const d = new Date();
  d.setDate(d.getDate() - 6);
  const fechaInicio = ref(d.toISOString().split('T')[0]);

  const cuotaAdminSemanal = ref(300);

  async function cargarDatos() {
    loading.value = true;
    try {
      duenos.value = await api.getDuenos();
      unidades.value = await api.getUnidades();
      conductores.value = await api.getConductores();
      prestamos.value = await api.getPrestamos();
      registrosDiarios.value = await api.getRegistrosDiarios(fechaInicio.value, fechaFin.value);
    } catch (e) {
      console.error('Error cargando datos de transporte:', e);
    } finally {
      loading.value = false;
    }
  }

  async function agregarDueno(dueno) {
    loading.value = true;
    try {
      await api.addDueno(dueno);
      await cargarDatos();
    } finally {
      loading.value = false;
    }
  }

  async function agregarUnidad(unidad) {
    loading.value = true;
    try {
      await api.addUnidad(unidad);
      await cargarDatos();
    } finally {
      loading.value = false;
    }
  }

  async function agregarConductor(conductor) {
    loading.value = true;
    try {
      await api.addConductor(conductor);
      await cargarDatos();
    } finally {
      loading.value = false;
    }
  }

  async function guardarRegistroDiario(data) {
    loading.value = true;
    try {
      await api.guardarRegistroDiario(data);
      await cargarDatos();
    } finally {
      loading.value = false;
    }
  }

  async function cerrarDia(fecha) {
    loading.value = true;
    try {
      await api.cerrarDia(fecha);
      await cargarDatos();
    } finally {
      loading.value = false;
    }
  }

  async function agregarPrestamo(prestamo) {
    loading.value = true;
    try {
      await api.addPrestamo(prestamo);
      await cargarDatos();
    } finally {
      loading.value = false;
    }
  }

  const liquidacionSemanal = computed(() => {
    return calcularLiquidacionSemanal({
      registrosDiarios: registrosDiarios.value,
      duenos: duenos.value,
      unidades: unidades.value,
      prestamos: prestamos.value,
      cuotaAdminSemanal: cuotaAdminSemanal.value
    });
  });

  return {
    duenos,
    unidades,
    conductores,
    prestamos,
    registrosDiarios,
    loading,
    fechaInicio,
    fechaFin,
    cuotaAdminSemanal,
    cargarDatos,
    agregarDueno,
    agregarUnidad,
    agregarConductor,
    guardarRegistroDiario,
    cerrarDia,
    agregarPrestamo,
    liquidacionSemanal
  };
});
