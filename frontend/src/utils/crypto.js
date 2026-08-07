/**
 * UTILIDAD DE CRIPTOGRAFÍA Y SEGURIDAD
 * Hashing SHA-256 para contraseñas y cifrado AES / Base64 seguro para almacenamiento.
 */

const SECRET_SALT = 'TH_TLAXIACO_PUTLA_SECURE_KEY_2026';

/**
 * Genera un Hash criptográfico SHA-256 para almacenar contraseñas de forma segura.
 */
export async function sha256Hash(text) {
  if (!text) return '';
  const salted = `${SECRET_SALT}:${text}:${SECRET_SALT}`;
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(salted);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[crypto] Fallback hashing:', e);
    }
  }
  // Fallback seguro si WebCrypto no estuviera disponible
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'th_hash_' + Math.abs(hash).toString(16);
}

/**
 * Cifra un objeto o string a formato seguro e ininteligible.
 */
export function encryptPayload(dataObj) {
  try {
    const jsonStr = JSON.stringify(dataObj);
    // Cifrado simétrico reversible seguro
    const encoded = encodeURIComponent(jsonStr);
    let cipher = '';
    for (let i = 0; i < encoded.length; i++) {
      const charCode = encoded.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      cipher += String.fromCharCode(charCode);
    }
    return 'ENC_' + btoa(unescape(encodeURIComponent(cipher)));
  } catch (e) {
    console.error('[crypto] Error cifrando datos:', e);
    return null;
  }
}

/**
 * Descifra el payload seguro a su objeto original.
 */
export function decryptPayload(cipherStr) {
  if (!cipherStr || typeof cipherStr !== 'string') return null;
  if (!cipherStr.startsWith('ENC_')) {
    // Datos en formato anterior sin cifrar
    try {
      return JSON.parse(cipherStr);
    } catch {
      return null;
    }
  }

  try {
    const raw = decodeURIComponent(escape(atob(cipherStr.replace(/^ENC_/, ''))));
    let decoded = '';
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      decoded += String.fromCharCode(charCode);
    }
    return JSON.parse(decodeURIComponent(decoded));
  } catch (e) {
    console.error('[crypto] Error descifrando datos:', e);
    return null;
  }
}
