
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('Restaurant')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
    } else {
        console.log('No data found in Restaurant table');
    }
}

checkSchema();
