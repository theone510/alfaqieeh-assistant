/**
 * verify-supabase.cjs - فحص بيانات Supabase
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  🔍 Supabase Verification                    ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // 1. Total count
    const { count: total } = await supabase.from('fatwas').select('*', { count: 'exact', head: true });
    console.log(`📊 Total entries in Supabase: ${total}\n`);

    // 2. Check الجزء الثاني (المعاملات - should have been swapped from v3)
    const { data: v2Sample } = await supabase.from('fatwas')
        .select('content, metadata')
        .like('content', '%منهاج الصالحين - الجزء الثاني - كتاب التجارة%')
        .limit(2);

    console.log('--- ✅ الجزء الثاني (المعاملات) ---');
    if (v2Sample && v2Sample.length > 0) {
        console.log(`   Found ${v2Sample.length}+ entries`);
        console.log(`   Sample: ${v2Sample[0].metadata?.full_citation || 'N/A'}`);
        console.log(`   Book: ${v2Sample[0].metadata?.book || 'N/A'}`);
    } else {
        console.log('   ❌ NOT FOUND!');
    }

    // 3. Check الجزء الثالث (النكاح - new entries)
    const { data: v3Nikah } = await supabase.from('fatwas')
        .select('content, metadata')
        .like('content', '%منهاج الصالحين - الجزء الثالث - كتاب النكاح%')
        .limit(2);

    console.log('\n--- ✅ الجزء الثالث (النكاح) ---');
    if (v3Nikah && v3Nikah.length > 0) {
        console.log(`   Found ${v3Nikah.length}+ entries`);
        console.log(`   Sample: ${v3Nikah[0].metadata?.full_citation || 'N/A'}`);
        console.log(`   Book: ${v3Nikah[0].metadata?.book || 'N/A'}`);
    } else {
        console.log('   ❌ NOT FOUND!');
    }

    // 4. Check الجزء الثالث (الطلاق)
    const { data: v3Talaq } = await supabase.from('fatwas')
        .select('content, metadata')
        .like('content', '%منهاج الصالحين - الجزء الثالث - كتاب الطلاق%')
        .limit(2);

    console.log('\n--- ✅ الجزء الثالث (الطلاق) ---');
    if (v3Talaq && v3Talaq.length > 0) {
        console.log(`   Found ${v3Talaq.length}+ entries`);
        console.log(`   Sample: ${v3Talaq[0].metadata?.full_citation || 'N/A'}`);
    } else {
        console.log('   ❌ NOT FOUND!');
    }

    // 5. Check الجزء الثالث (الميراث)
    const { data: v3Mirath } = await supabase.from('fatwas')
        .select('content, metadata')
        .like('content', '%منهاج الصالحين - الجزء الثالث - كتاب الميراث%')
        .limit(2);

    console.log('\n--- ✅ الجزء الثالث (الميراث) ---');
    if (v3Mirath && v3Mirath.length > 0) {
        console.log(`   Found ${v3Mirath.length}+ entries`);
        console.log(`   Sample: ${v3Mirath[0].metadata?.full_citation || 'N/A'}`);
    } else {
        console.log('   ❌ NOT FOUND!');
    }

    // 6. Verify NO books were left incorrectly as v3 (التجارة should be v2 now)
    const { data: wrongV3 } = await supabase.from('fatwas')
        .select('content, metadata')
        .like('content', '%منهاج الصالحين - الجزء الثالث - كتاب التجارة%')
        .limit(1);

    console.log('\n--- ⚠️ Verify no stale v3 التجارة ---');
    if (wrongV3 && wrongV3.length > 0) {
        console.log('   ❌ PROBLEM: كتاب التجارة still marked as الجزء الثالث!');
    } else {
        console.log('   ✅ Clean — كتاب التجارة correctly moved to الجزء الثاني');
    }

    // 7. Count by volume
    const { data: v2All } = await supabase.from('fatwas')
        .select('metadata', { count: 'exact' })
        .like('content', '%منهاج الصالحين - الجزء الثاني%')
        .limit(1);

    const { data: v3All } = await supabase.from('fatwas')
        .select('metadata', { count: 'exact' })
        .like('content', '%منهاج الصالحين - الجزء الثالث%')
        .limit(1);

    console.log('\n--- 📈 Summary ---');
    console.log(`   Total in Supabase: ${total}`);
    console.log('   ✅ Verification complete!');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
