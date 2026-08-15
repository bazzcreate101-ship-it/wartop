import { createClient } from '@supabase/supabase-js';

// Ambil URL dan Anon Key dari Environment Variables Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const authFallback = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe() {} } },
  }),
  signOut: async () => ({ error: null }),
  signInWithOAuth: async () => ({
    error: new Error('Supabase belum dikonfigurasi.'),
  }),
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { auth: authFallback };
