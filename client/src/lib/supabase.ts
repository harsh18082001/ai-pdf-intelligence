import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a dummy client if environment variables are not provided to prevent uncaught runtime errors
const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey = 'placeholder-anon-key';

export const supabase = createClient(
  supabaseUrl || placeholderUrl,
  supabaseAnonKey || placeholderKey
);
