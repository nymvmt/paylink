import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const cfg = await fetch('/api/config').then(r => r.json());
export const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
export const TOSS_CLIENT_KEY = cfg.tossClientKey;
