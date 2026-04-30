import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import cuid from 'cuid';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function restoreWaltonData() {
  console.log('--- WALTON RESTORATION START ---');
  
  // 1. Find the "Choose your Size" group ID
  const { data: groupData } = await supabase
    .from('AddonGroup')
    .select('id, name')
    .eq('name', 'Choose your Size')
    .eq('isActive', true)
    .limit(1);

  let sizeGroupId = groupData?.[0]?.id;

  if (!sizeGroupId) {
    console.log('Size group not found, searching for approximate match...');
    const { data: altGroup } = await supabase
      .from('AddonGroup')
      .select('id, name')
      .ilike('name', '%size%')
      .eq('isActive', true)
      .limit(1);
    sizeGroupId = altGroup?.[0]?.id;
  }

  if (!sizeGroupId) {
    console.error('CRITICAL ERROR: No Size AddonGroup found in database. Restoration aborted.');
    return;
  }

  console.log(`Using Size Group ID: ${sizeGroupId}`);

  // 2. Identify Walton Area Restaurants (using the IDs from previous diagnostic)
  const waltonResIds = [
    'cmm0yyfo90007ueaonnak2qtc', // Burger House
    'cmm0yyi6y000bueaovaggudtf', // Thai Spice Garden
    'cmm0yykpe000hueaozdfh34wu', // Mediterranean Mezze
    'cmm0yyn70000nueaogmklnkwf', // Indian Curry House
    'cmm0yyq44000wueaota9t1eqx'  // Dim Sum Palace
  ];

  // 3. Link MenuItems to the Size group
  for (const resId of waltonResIds) {
    console.log(`Restoring Restaurant: ${resId}`);
    
    // Get items for this restaurant
    const { data: items } = await supabase
      .from('MenuItem')
      .select('id, label')
      .eq('restaurantId', resId);

    if (!items || items.length === 0) continue;

    for (const item of items) {
      // Check if already linked
      const { data: existing } = await supabase
        .from('MenuItemAddon')
        .select('*')
        .eq('menuItemId', item.id)
        .eq('addonGroupId', sizeGroupId)
        .maybeSingle();

      if (existing) {
        console.log(`  - ${item.label} already linked.`);
        continue;
      }

      // Create the link
      const { error: insertError } = await supabase
        .from('MenuItemAddon')
        .insert({
          id: cuid(),
          menuItemId: item.id,
          addonGroupId: sizeGroupId
        });

      if (insertError) {
        console.error(`  - Failed to link ${item.label}:`, insertError.message);
      } else {
        console.log(`  - [SUCCESS] Linked ${item.label} to Size Group.`);
      }
    }
  }

  // 4. Ensure "Small", "Medium", "Large" options exist for this group
  console.log('\nVerifying options for the Size Group...');
  const optionsToEnsure = [
    { name: 'Small', priceAdjustment: 0, sortOrder: 1 },
    { name: 'Medium', priceAdjustment: 400, sortOrder: 2 },
    { name: 'Large', priceAdjustment: 800, sortOrder: 3 }
  ];

  for (const opt of optionsToEnsure) {
    const { data: existingOpt } = await supabase
      .from('AddonOption')
      .select('id')
      .eq('addonGroupId', sizeGroupId)
      .eq('name', opt.name)
      .maybeSingle();

    if (!existingOpt) {
      console.log(`  - Creating missing option: ${opt.name}`);
      await supabase.from('AddonOption').insert({
        addonGroupId: sizeGroupId,
        name: opt.name,
        priceAdjustment: opt.priceAdjustment,
        sortOrder: opt.sortOrder,
        isActive: true
      });
    } else {
      console.log(`  - Option ${opt.name} already exists.`);
    }
  }

  console.log('\n--- WALTON RESTORATION END ---');
}

restoreWaltonData();
