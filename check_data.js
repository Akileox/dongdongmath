
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local
try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error('Could not read .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Env Vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Lectures Sections ---');
    const { data: lectures } = await supabase.from('lectures').select('section').limit(50);
    if (lectures) {
        const sections = Array.from(new Set(lectures.map(l => l.section).filter(Boolean))).sort();
        console.log(sections);
    }

    console.log('\n--- Profiles Class Sections ---');
    const { data: profiles } = await supabase.from('profiles').select('class_section').neq('class_section', null).limit(100);
    if (profiles) {
        const pSections = Array.from(new Set(profiles.map(p => p.class_section).filter(Boolean))).sort();
        console.log(pSections);
    }
}

check();
