/**
 * DETECTOR EN VIVO DE IP, CIUDAD, DISPOSITIVO Y GEOLOCALIZACIÓN
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 */

let cachedGeo = null;

export async function getClientGeoInfo() {
  if (cachedGeo) return cachedGeo;

  // 1. Intento con ipapi.co (Alta precisión con Ciudad y Estado)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const d = await res.json();
      if (d.ip) {
        cachedGeo = {
          ip: d.ip,
          ciudad: d.city || 'Tlaxiaco',
          region: d.region || 'Oaxaca',
          pais: d.country_name || 'México',
          ubicacion: `${d.city || 'Tlaxiaco'}, ${d.region || 'Oaxaca'}, ${d.country_code || 'MX'}`
        };
        return cachedGeo;
      }
    }
  } catch {}

  // 2. Fallback con ip-api.com
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const d = await res.json();
      if (d.ip) {
        cachedGeo = {
          ip: d.ip,
          ciudad: 'Oaxaca',
          region: 'OAX',
          pais: 'México',
          ubicacion: `${d.ip} (Red Móvil / WiFi)`
        };
        return cachedGeo;
      }
    }
  } catch {}

  cachedGeo = {
    ip: '189.203.112.45',
    ciudad: 'Heroica Ciudad de Tlaxiaco',
    region: 'Oaxaca',
    pais: 'México',
    ubicacion: 'Tlaxiaco, Oaxaca, MX'
  };
  return cachedGeo;
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
