import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import cuid from 'cuid';

dotenv.config({ path: '.env.local' });

const s = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

async function forceCreateSizes() {
  console.log('--- STARTING SIZE INJECTION ---');

  // Hardcoded target from Vercel feed
  const RESTAURANT_ID = "cmkgns0w50001td5s9lo9gg46"; // Pizza Heart Vercel ID
  const ITEM_ID = "cmkgns0w50003td5shyujucdv"; // Crown Crust Vercel ID

  const now = new Date().toISOString();

  // Create Addon Group
  const groupId = cuid();
  console.log(`Creating AddonGroup (${groupId})...`);
  const { error: groupErr } = await s.from('AddonGroup').insert({
    id: groupId,
    restaurantId: RESTAURANT_ID,
    name: 'crownCrust',
    displayName: 'Choose your Size',
    selectionType: 'SINGLE',
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now
  });
  if (groupErr) throw groupErr;

  // Create Addon Options (Horizontal Pills)
  const sizes = [
    { name: 'Small', price: 0, order: 1, default: true },
    { name: 'Medium', price: 300, order: 2, default: false },
    { name: 'Large', price: 600, order: 3, default: false }
  ];

  for (const size of sizes) {
    console.log(`Creating Option ${size.name}...`);
    const { error: optErr } = await s.from('AddonOption').insert({
      id: cuid(),
      addonGroupId: groupId,
      name: size.name,
      priceAdjustment: size.price,
      isDefault: size.default,
      sortOrder: size.order,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    if (optErr) throw optErr;
  }

  // Inject the "Glue" (Junction Link)
  console.log(`Injecting Junction Link for item ${ITEM_ID}...`);
  const { error: linkErr } = await s.from('MenuItemAddon').insert({
    id: cuid(),
    menuItemId: ITEM_ID,
    addonGroupId: groupId,
    sortOrder: 1,
    createdAt: now
  });
  
  if (linkErr) {
    if (linkErr.code === '23503') { // Foreign Key Violation (menuItem doesn't exist in Supabase DB)
      console.log('Foreign key violation! Item does not exist natively in Supabase.');
      console.log('To bypass this completely, we must use the Unified Hydration code instead.');
    } else {
      throw linkErr;
    }
  }

  console.log('--- SIZE INJECTION COMPLETE ---');
}

forceCreateSizes().catch(console.error);
