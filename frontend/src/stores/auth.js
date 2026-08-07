import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { sha256Hash, encryptPayload, decryptPayload } from '../utils/crypto';
import { supabase } from '../services/supabase';
import { api } from '../services/api';

const SESSION_STORAGE_KEY = 'th_session_encrypted_v2';

// Credenciales maestras de emergencia (para que siempre puedas entrar)
const MASTER_CREDENTIALS = [
  { username: 'admin',    password: 'admin123',    nombre: 'Administrador General', rol: 'admin',      icono: '👑', id: 'u_admin' },
  { username: 'operador', password: 'operador123', nombre: 'Capturista de Ruta',    rol: 'capturista', icono: '✍️', id: 'u_capturista' },
  { username: 'socio',    password: 'socio123',    nombre: 'Socio Consulta',        rol: 'lector',     icono: '👁️', id: 'u_lector' }
];

export const useAuthStore = defineStore('auth', () => {
  const users = ref([]);
  const currentUser = ref(null);
  const showUserAdminModal = ref(false);

  async function initAuth() {
    try {
      // Cargar sesión activa en sessionStorage
      const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (rawSession) {
        const decSession = decryptPayload(rawSession);
        currentUser.value = decSession || null;
      } else {
        currentUser.value = null;
      }
      // Cargar lista de usuarios desde Supabase en segundo plano
      cargarUsuariosCloud();
    } catch (e) {
      console.error('[auth] Error initAuth:', e);
      currentUser.value = null;
    }
  }

  async function cargarUsuariosCloud() {
    try {
      const { data, error } = await supabase.from('usuarios').select('*').order('nombre');
      if (!error && Array.isArray(data)) {
        users.value = data;
      }
    } catch (e) {
      console.warn('[auth] Error cargando usuarios de Supabase:', e);
    }
  }

  // ── Permisos y Roles ────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!currentUser.value);
  const role            = computed(() => currentUser.value?.rol || 'lector');
  const isAdmin         = computed(() => role.value === 'admin');
  const isCapturista    = computed(() => role.value === 'capturista');
  const isLector        = computed(() => role.value === 'lector');

  const puedeCapturar           = computed(() => isAdmin.value || isCapturista.value);
  const puedeEditar             = computed(() => isAdmin.value || isCapturista.value);
  const puedeEliminar           = computed(() => isAdmin.value);
  const puedeAdministrarUsuarios = computed(() => isAdmin.value);
  const puedeDescargarReportes  = computed(() => isAdmin.value || isCapturista.value);
  const puedeGestionarCatalogos = computed(() => isAdmin.value);

  // ── Login Real con Supabase ─────────────────────────────────────────────────
  async function login(username, password) {
    if (!username || !password) throw new Error('Por favor ingresa tu usuario y contraseña.');

    const uname = username.toLowerCase().trim();
    const pass  = password.trim();
    const inputHash = await sha256Hash(pass);

    // 1. VERIFICAR CREDENCIALES MAESTRAS (siempre funcionan)
    const master = MASTER_CREDENTIALS.find(c => c.username === uname && c.password === pass);
    if (master) {
      currentUser.value = { id: master.id, username: master.username, nombre: master.nombre, rol: master.rol, icono: master.icono };
      sessionStorage.setItem(SESSION_STORAGE_KEY, encryptPayload(currentUser.value));
      api.registrarActividad(
        'Inicio de sesión exitoso',
        `El usuario "${master.nombre}" (${master.username}) ingresó al sistema con rol [${master.rol.toUpperCase()}]`,
        'seguridad', '🔑', master, '🔑 Pantalla de Acceso'
      );
      cargarUsuariosCloud();
      return currentUser.value;
    }

    // 2. VERIFICAR EN LA BASE DE DATOS SUPABASE (usuarios creados por el administrador)
    await cargarUsuariosCloud();
    const dbUser = users.value.find(u =>
      u && u.username && u.username.toLowerCase() === uname &&
      (u.password_hash === inputHash || u.password_raw === pass)
    );

    if (!dbUser) {
      api.registrarActividad(
        'Intento de acceso fallido',
        `Intento de login con usuario "${uname}" (contraseña incorrecta o usuario no existe)`,
        'seguridad', '🚨',
        { username: uname, rol: 'desconocido' },
        '🔑 Pantalla de Acceso'
      );
      throw new Error('Usuario o contraseña incorrectos.');
    }

    currentUser.value = {
      id:       dbUser.id,
      username: dbUser.username,
      nombre:   dbUser.nombre,
      rol:      dbUser.rol,
      icono:    dbUser.icono || '👤'
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, encryptPayload(currentUser.value));
    api.registrarActividad(
      'Inicio de sesión exitoso',
      `El usuario "${dbUser.nombre}" (${dbUser.username}) ingresó al sistema con rol [${dbUser.rol.toUpperCase()}]`,
      'seguridad', '🔑', currentUser.value, '🔑 Pantalla de Acceso'
    );
    return currentUser.value;
  }

  function logout() {
    if (currentUser.value) {
      api.registrarActividad(
        'Cierre de sesión',
        `El usuario "${currentUser.value.nombre}" (${currentUser.value.username}) cerró su sesión`,
        'seguridad', '🚪', currentUser.value, '🚪 Cierre de Sesión'
      );
    }
    currentUser.value = null;
    try { sessionStorage.clear(); } catch {}
  }

  // ── Gestión de Usuarios (solo Admin) ───────────────────────────────────────
  async function agregarUsuario(nuevoUsuario) {
    if (!isAdmin.value) throw new Error('Solo un Administrador puede crear usuarios.');
    const uname = (nuevoUsuario.username || '').trim().toLowerCase();
    if (!uname) throw new Error('El nombre de usuario es obligatorio.');

    // Verificar duplicado
    const existe = users.value.some(u => u && u.username && u.username.toLowerCase() === uname);
    if (existe) throw new Error(`El usuario "${uname}" ya existe en el sistema.`);

    const pass = (nuevoUsuario.password || '123456').trim();
    const hash = await sha256Hash(pass);
    const icono = nuevoUsuario.rol === 'admin' ? '👑' : nuevoUsuario.rol === 'capturista' ? '✍️' : '👁️';

    const rec = {
      id:           'u_' + Date.now(),
      username:     uname,
      password_hash: hash,
      password_raw:  pass,
      nombre:       (nuevoUsuario.nombre || uname).trim(),
      rol:          nuevoUsuario.rol || 'capturista',
      icono
    };

    const { data, error } = await supabase.from('usuarios').insert([rec]).select();
    if (error) throw new Error('Error creando usuario: ' + error.message);

    const created = data?.[0] || rec;
    users.value.push(created);

    api.registrarActividad(
      'Creó nuevo usuario',
      `Registró al usuario "${rec.nombre}" (@${rec.username}) con rol [${rec.rol.toUpperCase()}]`,
      'seguridad', '👥', currentUser.value, '👥 Panel de Usuarios'
    );
    return created;
  }

  async function eliminarUsuario(id) {
    if (!isAdmin.value) throw new Error('Solo un Administrador puede eliminar usuarios.');
    if (currentUser.value?.id === id) throw new Error('No puedes eliminar tu propio usuario activo.');

    const victim = users.value.find(u => u && u.id === id);
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw new Error('Error eliminando usuario: ' + error.message);

    users.value = users.value.filter(u => u && u.id !== id);
    api.registrarActividad(
      'Eliminó usuario',
      `Eliminó del sistema al usuario "${victim?.nombre || id}" (@${victim?.username || '—'})`,
      'seguridad', '🗑️', currentUser.value, '👥 Panel de Usuarios'
    );
    return true;
  }

  // ── Actualizar Usuario Existente (Solo Admin) ───────────────────────────────
  async function actualizarUsuario(datos) {
    if (!isAdmin.value) throw new Error('Solo un Administrador puede editar usuarios.');
    if (!datos.id) throw new Error('ID de usuario requerido para actualizar.');

    const updates = {
      nombre: datos.nombre,
      rol:    datos.rol,
      icono:  datos.rol === 'admin' ? '👑' : datos.rol === 'capturista' ? '✍️' : '👁️'
    };

    // Solo actualizar contraseña si se proporcionó una nueva
    if (datos.password && datos.password.trim().length >= 1) {
      const hash = await sha256Hash(datos.password.trim());
      updates.password_hash = hash;
      updates.password_raw  = datos.password.trim();
    }

    const { data, error } = await supabase.from('usuarios').update(updates).eq('id', datos.id).select();
    if (error) throw new Error('Error actualizando usuario: ' + error.message);

    // Actualizar en memoria local
    const idx = users.value.findIndex(u => u && u.id === datos.id);
    if (idx >= 0) users.value[idx] = { ...users.value[idx], ...updates };

    api.registrarActividad(
      'Editó usuario',
      `Actualizó los datos del usuario "${datos.nombre}" (rol: ${datos.rol.toUpperCase()})`,
      'seguridad', '✏️', currentUser.value, '👥 Panel de Usuarios'
    );
    return data?.[0] || datos;
  }

  // Inicializar al cargar
  initAuth();

  return {
    users,
    currentUser,
    showUserAdminModal,
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
    actualizarUsuario,
    eliminarUsuario,
    cargarUsuariosCloud,
    syncUsersFromCloud: cargarUsuariosCloud
  };
});
