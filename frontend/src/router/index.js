import { createRouter, createWebHistory } from 'vue-router'
import CapturaView           from '../views/CapturaView.vue'
import ResumenDiarioView      from '../views/ResumenDiarioView.vue'
import VueltasView           from '../views/VueltasView.vue'
import ExportarView          from '../views/ExportarView.vue'
import UnidadesView          from '../views/UnidadesView.vue'
import BitacoraAuditoriaView from '../views/BitacoraAuditoriaView.vue'

const routes = [
  { path: '/',          name: 'captura',   component: CapturaView },
  { path: '/resumen',   name: 'resumen',   component: ResumenDiarioView },
  { path: '/vueltas',   name: 'vueltas',   component: VueltasView },
  { path: '/unidades',  name: 'unidades',  component: UnidadesView },
  { path: '/exportar',  name: 'exportar',  component: ExportarView },
  { path: '/bitacora',  name: 'bitacora',  component: BitacoraAuditoriaView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
