import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 5000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'api-search-middleware',
        configureServer(server) {
          server.middlewares.use(async (req: any, res: any, next: any) => {
            if (req.url === '/api/search' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: string) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { query } = JSON.parse(body);
                  const supabaseUrl = env.VITE_SUPABASE_URL || '';
                  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || '';
                  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';

                  const supabase = createClient(supabaseUrl, supabaseKey);
                  const genAI = new GoogleGenerativeAI(geminiKey);
                  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

                  const embeddingResult = await model.embedContent(query);
                  const embedding = embeddingResult.embedding.values;

                  const { data, error } = await supabase.rpc('match_fatwas', {
                    query_embedding: embedding,
                    match_threshold: 0.5,
                    match_count: 8
                  });

                  if (error) throw error;

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ results: data }));
                } catch (error) {
                  console.error('Local Search API Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
          adminDashboard: path.resolve(__dirname, 'admin-dashboard.html'),
        },
      },
    },
  };
});
