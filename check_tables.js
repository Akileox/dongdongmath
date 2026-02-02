
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

async function checkTables() {
    // We can't list tables easily with js client without admin, but we can try to Select from likely tables
    console.log('Checking enrollment tables...');

    try {
        const { data: e1, error: e1err } = await supabase.from('enrollments').select('*').limit(1);
        console.log('enrollments:', e1 ? 'Found' : e1err.message);
    } catch (e) { }

    try {
        const { data: e2, error: e2err } = await supabase.from('lecture_enrollments').select('*').limit(1);
        console.log('lecture_enrollments:', e2 ? 'Found' : e2err.message);
    } catch (e) { }

    try {
        const { data: e3, error: e3err } = await supabase.from('class_enrollments').select('*').limit(1);
        console.log('class_enrollments:', e3 ? 'Found' : e3err.message);
    } catch (e) { }

    // Check assignments content to see if we can link
    const { data: assigns } = await supabase.from('lecture_assignments').select('student_id, lecture_id').limit(5);
    console.log('lecture_assignments sample:', assigns);
}

checkTables();
