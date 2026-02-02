
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) { }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Profile Sample ---');
    const { data } = await supabase.from('profiles').select('*').limit(1);
    if (data && data[0]) {
        console.log(Object.keys(data[0]));
        console.log('Sample Class Section:', data[0].class_section);
    } else {
        console.log('No profiles found');
    }
}

check();
