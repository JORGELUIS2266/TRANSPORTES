/**
 * DETECTOR DE IP, DISPOSITIVO Y NAVEGADOR PARA AUDITORÍA
 * TRANSPORTE TIERRA DE HUMOS
 */

let cachedIP = null;

export async function getClientIP() {
  if (cachedIP) return cachedIP;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedIP = data.ip;
        return cachedIP;
      }
    }
  } catch (e) {
    // Si no hay conexión externa o está en red local
  }
  cachedIP = '192.168.1.103 (Red Local)';
  return cachedIP;
}

export function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  let os = 'Windows';
  if (/Android/i.test(ua)) os = 'Android Móvil';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS (iPhone/iPad)';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Navegador Web';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return `${os} · ${browser}`;
}
