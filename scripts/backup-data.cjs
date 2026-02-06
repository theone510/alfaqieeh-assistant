
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function backupData() {
    console.log('🚀 Starting full backup (Text + Vectors)...');

    const backupDir = path.resolve(__dirname, '../backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    let allRows = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('fatwas')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ Error fetching data:', error);
            break;
        }

        if (data.length > 0) {
            allRows = allRows.concat(data);
            console.log(`   Fetched ${data.length} rows (Total: ${allRows.length})...`);
            page++;
        } else {
            hasMore = false;
        }
    }

    const outputPath = path.join(backupDir, 'fatwas_with_vectors.json');
    fs.writeFileSync(outputPath, JSON.stringify(allRows, null, 2));

    console.log(`✅ Backup complete! Saved ${allRows.length} records to:`);
    console.log(`   ${outputPath}`);
}

backupData();
