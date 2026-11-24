const DEFAULT_SUPABASE_URL = 'https://wpmlygdvfrnzdenxohpc.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_RWeZT7SfTktgs586vreUqg_H03rF1r_';

export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
