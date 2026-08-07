import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { sha256Hash, encryptPayload, decryptPayload } from '../utils/crypto';
import { cloudDatabase } from '../services/cloudDatabase';
import { api } from '../services/api';

const USERS_STORAGE_KEY = 'th_users_encrypted_v2';
const SESSION_STORAGE_KEY = 'th_session_encrypted_v2';

// Cuentas del sistema predeterminadas con sus hashes SHA-256
const SEED_USERS = [
  {
    id: 'u_admin',
    username: 'admin',
    passwordHash: 'th_admin_hash_protected',
    rawHint: 'admin123',
    nombre: 'Administrador General',
    rol: 'admin',
    icono: '👑'
  },
  {
    id: 'u_capturista',
    username: 'operador',
    passwordHash: 'th_operador_hash_protected',
    rawHint: 'operador123',
    nombre: 'Capturista de Ruta',
    rol: 'capturista',
    icono: '✍️'
  },
  {
    id: 'u_lector',
    username: 'socio',
    passwordHash: 'th_socio_hash_protected',
    rawHint: 'socio123',
    nombre: 'Socio Consulta',
    rol: 'lector',
    icono: '👁️'
  }
];

export const useAuthStore = defineStore('auth', () => {
  const users = ref([]);
  const currentUser = ref(null);
  const showUserAdminModal = ref(false);
  const isCloudSynced = ref(false);

  async function initAuth() {
    try {
      // 1. Cargar usuarios locales cifrados
      const rawEncrypted = localStorage.getItem(USERS_STORAGE_KEY);
      if (rawEncrypted) {
        const decrypted = decryptPayload(rawEncrypted);
        if (Array.isArray(decrypted) && decrypted.length > 0) {
          users.value = decrypted;
        } else {
          await seedDefaultUsers();
        }
      } else {
        await seedDefaultUsers();
      }

      // 2. Comprobar sesión activa (encriptada en sessionStorage)
      const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (rawSession) {
        const decSession = decryptPayload(rawSession);
        currentUser.value = decSession || null;
      } else {
        currentUser.value = null; // Obligatorio iniciar sesión
      }

      // 3. Sincronizar usuarios desde la nube central
      syncUsersFromCloud();
    } catch (e) {
      console.error('[auth] Error inicializando auth segura:', e);
      currentUser.value = null;
    }
  }

  async function seedDefaultUsers() {
    const list = [];
    for (const u of SEED_USERS) {
      const hash = await sha256Hash(u.rawHint);
      list.push({
        id: u.id,
        username: u.username,
        passwordHash: hash,
        nombre: u.nombre,
        rol: u.rol,
        icono: u.icono
      });
    }
    users.value = list;
    saveUsers();
  }

  async function syncUsersFromCloud() {
    try {
      const cloudData = await cloudDatabase.fetchCloudData();
      if (cloudData && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
        const merged = [...users.value];
        for (const cu of cloudData.users) {
          const idx = merged.findIndex(u => u && u.username && u.username.toLowerCase() === (cu.username || '').toLowerCase());
          if (idx >= 0) merged[idx] = cu;
          else merged.push(cu);
        }
        users.value = merged;
        saveUsers(false);
        isCloudSynced.value = true;
      }
    } catch {}
  }

  function saveUsers(pushToCloud = true) {
    const encrypted = encryptPayload(users.value);
    localStorage.setItem(USERS_STORAGE_KEY, encrypted);
    if (pushToCloud) {
      // Subir usuarios a la base de datos central en segundo plano
      api.pushFullStoreToCloud().catch(() => {});
    }
  }

  // ── Permisos y Roles ────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!currentUser.value);
  const role = computed(() => currentUser.value?.rol || 'lector');
  const isAdmin = computed(() => role.value === 'admin');
  const isCapturista = computed(() => role.value === 'capturista');
  const isLector = computed(() => role.value === 'lector');

  // Permisos granulares
  const puedeCapturar = computed(() => isAdmin.value || isCapturista.value);
  const puedeEditar = computed(() => isAdmin.value || isCapturista.value);
  const puedeEliminar = computed(() => isAdmin.value);
  const puedeAdministrarUsuarios = computed(() => isAdmin.value);
  const puedeDescargarReportes = computed(() => isAdmin.value || isCapturista.value);
  const puedeGestionarCatalogos = computed(() => isAdmin.value);

  // ── Autenticación Criptográfica ─────────────────────────────────────────────
  async function login(username, password) {
    if (!username || !password) {
      throw new Error('Por favor ingresa tu usuario y contraseña.');
    }

    const cleanUser = username.toLowerCase().trim();
    const inputHash = await sha256Hash(password.trim());

    // 1. Buscar en memoria local
    let user = users.value.find(
      u => u && u.username && u.username.toLowerCase() === cleanUser && u.passwordHash === inputHash
    );

    // 2. Si no se encuentra, consultar la base de datos en la nube en tiempo real
    if (!user) {
      await syncUsersFromCloud();
      user = users.value.find(
        u => u && u.username && u.username.toLowerCase() === cleanUser && u.passwordHash === inputHash
      );
    }

    if (!user) {
      // Registrar intento fallido en la bitácora
      api.registrarActividad(
        'Intento de acceso fallido',
        `Intento de inicio de sesión con usuario "${cleanUser}" (contraseña incorrecta)`,
        'seguridad',
        '🚨',
        { username: cleanUser, rol: 'desconocido' },
        '🔑 Pantalla de Acceso'
      );
      throw new Error('Usuario o contraseña incorrectos. Verifica tus credenciales.');
    }

    // Guardar sesión cifrada en memoria de pestaña
    currentUser.value = {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      icono: user.icono
    };

    const encSession = encryptPayload(currentUser.value);
    sessionStorage.setItem(SESSION_STORAGE_KEY, encSession);

    // Registrar inicio de sesión exitoso en la bitácora
    api.registrarActividad(
      'Inicio de sesión exitoso',
      `El usuario "${user.nombre}" (${user.username}) ingresó al sistema con rol [${user.rol.toUpperCase()}]`,
      'seguridad',
      '🔑',
      user,
      '🔑 Pantalla de Acceso'
    );

    return currentUser.value;
  }

  function logout() {
    if (currentUser.value) {
      try {
        api.registrarActividad(
          'Cierre de sesión',
          `El usuario "${currentUser.value.nombre}" (${currentUser.value.username}) cerró su sesión`,
          'seguridad',
          '🚪',
          currentUser.value,
          '🚪 Cierre de Sesión'
        );
      } catch (e) {
        console.warn('[auth] Error registrando logout:', e);
      }
    }
    currentUser.value = null;
    try {
      sessionStorage.clear();
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('th_active_session_v2');
      localStorage.removeItem('th_user');
      localStorage.removeItem('th_session');
    } catch {}
  }

  // ── Crear nuevo usuario con Hashing SHA-256 (Solo Administrador) ────────────
  async function agregarUsuario(nuevoUsuario) {
    if (!isAdmin.value) throw new Error('Solo un Administrador puede crear usuarios.');
    const uname = (nuevoUsuario.username || '').trim().toLowerCase();
    if (!uname) throw new Error('El nombre de usuario es obligatorio.');
    if (users.value.some(u => u && u.username && u.username.toLowerCase() === uname)) {
      throw new Error(`El usuario "${uname}" ya existe.`);
    }

    const pass = nuevoUsuario.password || '123456';
    const hash = await sha256Hash(pass.trim());

    const icono = nuevoUsuario.rol === 'admin' ? '👑' : nuevoUsuario.rol === 'capturista' ? '✍️' : '👁️';
    const rec = {
      id: 'u_' + Date.now(),
      username: uname,
      passwordHash: hash,
      nombre: nuevoUsuario.nombre || uname,
      rol: nuevoUsuario.rol || 'capturista',
      icono
    };

    users.value.push(rec);
    saveUsers(true);

    api.registrarActividad(
      'Creó nuevo usuario',
      `Registró al usuario "${rec.nombre}" (@${rec.username}) con rol [${rec.rol.toUpperCase()}]`,
      'seguridad',
      '👥',
      currentUser.value,
      '👥 Panel de Usuarios'
    );

    return rec;
  }

  function eliminarUsuario(id) {
    if (!isAdmin.value) throw new Error('Solo un Administrador puede eliminar usuarios.');
    if (currentUser.value?.id === id) {
      throw new Error('No puedes eliminar tu propio usuario activo.');
    }
    const victim = users.value.find(u => u && u.id === id);
    users.value = users.value.filter(u => u && u.id !== id);
    saveUsers(true);

    api.registrarActividad(
      'Eliminó usuario',
      `Eliminó del sistema al usuario "${victim?.nombre || id}" (@${victim?.username || '—'})`,
      'seguridad',
      '🗑️',
      currentUser.value,
      '👥 Panel de Usuarios'
    );

    return true;
  }

  // Inicializar al cargar
  initAuth();

  return {
    users,
    currentUser,
    showUserAdminModal,
    isCloudSynced,
    isAuthenticated,
    role,
    isAdmin,
    isCapturista,
    isLector,
    puedeCapturar,
    puedeEditar,
    puedeEliminar,
    puedeAdministrarUsuarios,
    puedeDescargarReportes,
    puedeGestionarCatalogos,
    login,
    logout,
    agregarUsuario,
    eliminarUsuario,
    syncUsersFromCloud
  };
});
