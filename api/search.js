import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        // 1. Generate Embedding for the query
        const embeddingResult = await model.embedContent(query);
        // text-embedding-004 is Matryoshka compliant, so we can slice to 768
        const embedding = embeddingResult.embedding.values.slice(0, 768);

        // 2. Search Supabase using RPC function
        const { data, error } = await supabase.rpc('match_fatwas', {
            query_embedding: embedding,
            match_threshold: 0.7, // Adjust threshold as needed
            match_count: 5
        });

        if (error) {
            console.error('Supabase search error:', error);
            throw error;
        }

        return res.status(200).json({ results: data });

    } catch (error) {
        console.error('Search API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
