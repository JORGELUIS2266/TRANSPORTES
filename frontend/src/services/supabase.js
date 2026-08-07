/**
 * CLIENTE SUPABASE — BASE DE DATOS REAL EN LA NUBE
 * TRANSPORTE TIERRA DE HUMOS — TLAXIACO ➔ PUTLA
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kcdezaahfqbctdncftdf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HifWy4O6Jud69fDYLbyyrQ_IUPH4cq-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
