import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify that keys exist, are valid HTTP urls, and are not the default placeholder text
const isConfigured = !!(
  supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey && 
  !supabaseAnonKey.includes('REPLACE_WITH')
);

if (!isConfigured) {
  console.error(
    "❌ Supabase is not configured or has invalid placeholder values!\n" +
    "Please open your '.env' file in the root of 'gold-web-app' and set:\n\n" +
    "VITE_SUPABASE_URL=https://your-project-id.supabase.co\n" +
    "VITE_SUPABASE_ANON_KEY=your-anon-public-api-key\n\n" +
    "After saving the file, remember to restart your dev server (Ctrl+C and npm run dev)."
  );
}

// Resilient fallback client to prevent the React app from crashing on start
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
          eq: () => Promise.resolve({ data: [], error: null }),
          like: () => Promise.resolve({ data: [], error: null }),
          or: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        }),
        insert: () => ({
          select: () => Promise.resolve({ data: [{ id: 1 }], error: null })
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        }),
        delete: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        }),
        upsert: () => ({
          select: () => Promise.resolve({ data: [{ id: 1 }], error: null })
        })
      })
    };
