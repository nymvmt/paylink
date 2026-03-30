import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  tossClientKey: string;
}

const cfg: Config = await fetch('/api/config').then(r => r.json());
export const supabase: SupabaseClient = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
export const TOSS_CLIENT_KEY: string = cfg.tossClientKey;
