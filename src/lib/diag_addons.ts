import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostic() {
  console.log('--- ADDON DIAGNOSTIC START ---');
  
  // 1. Get a sample restaurant (e.g., Burger House or similar)
  const { data: restaurants, error: resError } = await supabase
    .from('Restaurant')
    .select('id, name')
    .limit(5);

  if (resError) {
    console.error('Error fetching restaurants:', resError);
    return;
  }

  console.log(`Found ${restaurants.length} restaurants to audit.`);

  for (const res of restaurants) {
    console.log(`\nAuditing Restaurant: ${res.name} (${res.id})`);
    
    // 2. Get MenuItems
    const { data: items } = await supabase
      .from('MenuItem')
      .select('id, label')
      .eq('restaurantId', res.id)
      .limit(3);

    if (!items || items.length === 0) {
      console.log('  - No items found.');
      continue;
    }

    for (const item of items) {
      console.log(`  - Item: ${item.label} (${item.id})`);
      
      // 3. Check for Junction links
      const { data: junctions } = await supabase
        .from('MenuItemAddon')
        .select('addonGroupId')
        .eq('menuItemId', item.id);

      if (!junctions || junctions.length === 0) {
        console.log('    - [MISSING] No MenuItemAddon links.');
        continue;
      }

      console.log(`    - Found ${junctions.length} addon groups.`);

      for (const j of junctions) {
        // 4. Check Group Metadata
        const { data: group } = await supabase
          .from('AddonGroup')
          .select('name, displayName')
          .eq('id', j.addonGroupId)
          .single();

        console.log(`      - Group: ${group?.displayName || group?.name} (${j.addonGroupId})`);

        // 5. Check Options
        const { data: options } = await supabase
          .from('AddonOption')
          .select('name, priceAdjustment')
          .eq('addonGroupId', j.addonGroupId);

        if (!options || options.length === 0) {
          console.log('        - [CRITICAL] No options found for this group in Supabase.');
        } else {
          console.log(`        - Success: ${options.length} options found (${options.map(o => o.name).join(', ')})`);
        }
      }
    }
  }
  console.log('\n--- ADDON DIAGNOSTIC END ---');
}

runDiagnostic();
