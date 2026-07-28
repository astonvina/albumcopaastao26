import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase (Vite client or server side)
const metaEnv = (import.meta as any).env || {};
const safeProcessEnv = typeof process !== 'undefined' ? process.env : {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || safeProcessEnv.VITE_SUPABASE_URL || safeProcessEnv.SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || safeProcessEnv.VITE_SUPABASE_ANON_KEY || safeProcessEnv.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

