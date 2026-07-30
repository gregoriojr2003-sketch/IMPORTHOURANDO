import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables from Vite client
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
    supabaseUrl.trim() !== ''
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseInstance && isSupabaseConfigured()) {
    try {
      supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (err) {
      console.warn('[SUPABASE] Failed to initialize Supabase client:', err);
    }
  }
  return supabaseInstance;
};

/**
 * Initiates Google OAuth login flow via Supabase
 */
export async function signInWithGoogle() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não está configurado no arquivo .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Signs up a user using Email and Password in Supabase Auth
 */
export async function signUpWithSupabaseEmail(email: string, password: string, name: string, phone: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Signs in a user using Email and Password in Supabase Auth
 */
export async function signInWithSupabaseEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Signs out the current user session from Supabase
 */
export async function signOutSupabase() {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
}
