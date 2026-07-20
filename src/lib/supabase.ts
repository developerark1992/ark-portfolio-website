import { createClient } from '@supabase/supabase-js';

// Public, browser-safe credentials. The anon key is designed to be exposed;
// all write access is gated by Supabase Auth + Row Level Security (see supabase/schema.sql).
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

export const supabase = supabaseConfigured
  ? createClient(url, anon)
  : null;
