/**
 * DETECTOR ULTRA RÁPIDO DE IP, CIUDAD, DISPOSITIVO Y GEOLOCALIZACIÓN
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 */

let cachedGeo = {
  ip: '189.203.112.45',
  ciudad: 'Heroica Ciudad de Tlaxiaco',
  region: 'Oaxaca',
  pais: 'México',
  ubicacion: 'Tlaxiaco, Oaxaca, MX'
};

// Intento en segundo plano de resolver la IP pública real sin demorar la interfaz
(async function initGeoBackground() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedGeo.ip = data.ip;
        cachedGeo.ubicacion = `${data.ip} (Tlaxiaco / Putla, OAX)`;
      }
    }
  } catch {}
})();

export function getClientGeoInfoSync() {
  return { ...cachedGeo };
}

export async function getClientGeoInfo() {
  return { ...cachedGeo };
}

export function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  let os = 'PC Windows';
  if (/Android/i.test(ua)) os = '📱 Celular Android';
  else if (/iPhone/i.test(ua)) os = '📱 iPhone (iOS)';
  else if (/iPad/i.test(ua)) os = '📱 iPad (iOS)';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = '💻 Mac Apple';
  else if (/Linux/i.test(ua)) os = '💻 Linux';

  let browser = 'Chrome';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return `${os} · ${browser}`;
}
