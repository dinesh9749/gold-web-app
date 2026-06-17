import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Helper function to create a Proxy that acts like a Promise and handles any chained method calls
const createMockPromise = () => {
  const promise = Promise.resolve({ data: [], error: null });
  const handler = {
    get: (target, prop) => {
      if (prop === 'then') return target.then.bind(target);
      if (prop === 'catch') return target.catch.bind(target);
      // For any chained query method (e.g. .order(), .limit(), .eq()), return a new proxy promise
      return () => createMockPromise();
    }
  };
  return new Proxy(promise, handler);
};

// Resilient fallback client using ES6 Proxies to handle any Supabase query builders transparently
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => {
        const handler = {
          get: (target, prop) => {
            // Intercept calls like .select(), .insert(), .upsert() and return a chainable mock promise
            return () => createMockPromise();
          }
        };
        return new Proxy({}, handler);
      }
    };
