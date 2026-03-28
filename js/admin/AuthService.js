import { supabase } from '../shared/supabaseClient.js';

export class AuthService {
  constructor() {
    this.currentUser = null;
  }

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) this.currentUser = session.user;
    return session;
  }

  async getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }

  async login() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/admin.html` },
    });
    if (error) {
      const el = document.getElementById('login-error');
      el.textContent = error.message;
      el.classList.remove('hidden');
    }
  }

  async logout() {
    await supabase.auth.signOut();
    this.currentUser = null;
  }
}
