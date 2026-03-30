import { supabase } from '../shared/supabaseClient';
import type { User } from '@supabase/supabase-js';

export class AuthService {
  currentUser: User | null = null;

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) this.currentUser = session.user;
    return session;
  }

  async getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }

  async login(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/admin.html` },
    });
    if (error) {
      const el = document.getElementById('login-error')!;
      el.textContent = error.message;
      el.classList.remove('hidden');
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
  }
}
