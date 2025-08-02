import { Injectable } from '@angular/core';
import { AuthChangeEvent, AuthSession, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Database } from '../storage/supabase';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;
  _session: AuthSession | null = null;

  constructor() { 
    console.log('Initializing Supabase Service');
    this.supabase = createClient<Database>(environment.supabaseUrl, environment.supabaseKey);
  }

  async session() {
    const { data } = await this.supabase.auth.getSession();
    this._session = data.session;
    return this._session;
  }

  getSupabase() {
    return this.supabase;
  }

  profile(user: User) {
    return this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
  }

  getUser() {
    return this.supabase.auth.getUser();
  }

  async isAuthenticated(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return data?.session !== null;
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  signInWithPassword(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  signInWithGoogle(source: string = 'signup') {
    // Use the redirect method for Google sign-in
    let redirectUrl = 'https://deeplink.wdylt.com/identify'; // OR com.wydlt.app://identify
    if (source === 'signin') {
      // redirect directly to home page
      redirectUrl = 'https://deeplink.wdylt.com/';
    }

    // if pwa
    if (!Capacitor.isNativePlatform()) {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      if (source === 'signin') {
        redirectUrl = `${baseUrl}`;
      } else if (source === 'signup') {
        redirectUrl = `${baseUrl}/identify`;
      }
    }

    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
  }

}
