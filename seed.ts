import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertSampleData() {
  try {
    // Insert a sample record into a mock table 'xyz'
    const { data, error } = await supabase
      .from('xyz') // Replace 'xyz' with your table name
      .insert([
        { name: 'Test Name', description: 'Sample Description' },
      ]);
      
    if (error) {
      throw new Error(`Error inserting data: ${error.message}`);
    }

    console.log('Data inserted successfully:', data);
  } catch (error) {
    console.error('Error inserting data:', error);
  }
}

insertSampleData();
