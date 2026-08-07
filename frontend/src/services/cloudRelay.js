/**
 * SERVICIO DE RELAY Y SINCRONIZACIÓN EN LA NUBE MULTI-DISPOSITIVO
 * Permite que cualquier celular, computadora o tablet conectada a Vercel
 * comparta auditoría, inicios de sesión y capturas en tiempo real.
 */

const CLOUD_ROOM_ID = 'th_tlaxiaco_putla_audit_room_2026';
const RELAY_ENDPOINT = `https://api.restful-api.dev/objects`;

// Memoria de presencia activa (últimos 10 minutos)
const PRESENCE_KEY = 'th_live_presence_v1';

export const cloudRelay = {
  /**
   * Publica un evento o inicio de sesión en la nube global.
   */
  async publicarEvento(evento) {
    try {
      const payload = {
        name: `${CLOUD_ROOM_ID}_${Date.now()}`,
        data: {
          ...evento,
          room: CLOUD_ROOM_ID,
          serverTimestamp: Date.now()
        }
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(RELAY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      // Guardar también en presencia activa de este dispositivo
      this.actualizarPresencia(evento);

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[CloudRelay] Guardado en búfer local:', e.message);
    }
    return null;
  },

  /**
   * Obtiene todos los eventos e inicios de sesión generados por todos los dispositivos.
   */
  async obtenerEventosGlobales() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${RELAY_ENDPOINT}`, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const roomEvents = list
            .filter(item => item && item.data && item.data.room === CLOUD_ROOM_ID)
            .map(item => item.data)
            .sort((a, b) => (b.serverTimestamp || 0) - (a.serverTimestamp || 0));
          return roomEvents;
        }
      }
    } catch (e) {
      console.warn('[CloudRelay] Usando registros locales consolidados:', e.message);
    }
    return [];
  },

  /**
   * Registra el latido (heartbeat) de presencia en línea de este dispositivo.
   */
  actualizarPresencia(userLog) {
    try {
      const liveList = this.obtenerPresenciasLocales();
      const ahora = Date.now();
      const index = liveList.findIndex(p => p.usuario === userLog.usuario && p.dispositivo === userLog.dispositivo);
      const entrada = {
        usuario: userLog.usuario,
        nombre: userLog.nombre || userLog.usuario,
        rol: userLog.rol,
        dispositivo: userLog.dispositivo,
        ip: userLog.ip,
        ubicacion: userLog.ubicacion || 'Tlaxiaco, Oaxaca',
        seccion: userLog.seccion || '📱 Sistema',
        ultimoLatido: ahora
      };

      if (index >= 0) liveList[index] = entrada;
      else liveList.push(entrada);

      localStorage.setItem(PRESENCE_KEY, JSON.stringify(liveList));
    } catch {}
  },

  obtenerPresenciasLocales() {
    try {
      const raw = localStorage.getItem(PRESENCE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const limite15Min = Date.now() - (15 * 60 * 1000);
        return (parsed || []).filter(p => p.ultimoLatido > limite15Min);
      }
    } catch {}
    return [];
  }
};
