import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Realiza a autenticação com o Google utilizando Supabase Auth (OAuth 2.0).
 */
export async function signInWithGoogle() {
  try {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : '';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('[Supabase Auth] Erro ao iniciar login com Google:', error.message);
      throw error;
    }

    return data;
  } catch (err: any) {
    console.error('[Supabase Auth] Exceção em signInWithGoogle:', err);
    throw err;
  }
}

/**
 * Encerra a sessão ativa no Supabase.
 */
export async function signOutFromSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[Supabase Auth] Erro ao fazer logout:', error.message);
  }
}
