import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import cuid from 'cuid';

dotenv.config({ path: '.env.local' });

const s = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

const VERCEL_API = 'https://tes-sigma-blush.vercel.app/api/restaurants';
const VENDOR_ID = 'cmkgnnqof0000td8s055kx0xq'; // Discovered valid owner in new cloud instance

async function universalSync() {
  console.log('--- STARTING UNIVERSAL IDENTITY BRIDGE ---');
  const now = new Date().toISOString();

  // 1. Fetch Production Feed
  const { data: vRest } = await axios.get(VERCEL_API);
  console.log(`Fetched ${vRest.length} production restaurants.`);

  for (const r of vRest) {
    console.log(`\nProcessing: ${r.name} (${r.id || 'N/A'})...`);
    
    // Identifier-based region mapping
    const isBaku = r.city?.toLowerCase().includes('baku') || r.area?.toLowerCase().includes('baku');
    const currency = isBaku ? 'AZN' : 'PKR';
    
    // 2. UPSERT Restaurant (Using Vercel-Native ID)
    const { error: rErr } = await s.from('Restaurant').upsert({
      id: r.id,
      name: r.name,
      chainName: r.chainName || r.name,
      address: r.address || 'Production Feed',
      latitude: r.latitude || 0,
      longitude: r.longitude || 0,
      cuisineType: r.cuisineType || 'Unknown',
      segment: r.segment || 'Unknown',
      city: r.city || (isBaku ? 'Baku' : 'Walton'),
      area: r.area || 'Main',
      rating: r.rating || 4.5,
      coverImage: r.cover_image || r.coverImage || '',
      deliveryTime: r.deliveryTime || '30-45',
      minimumOrder: r.minimumOrder || '5.00',
      deliveryCharges: r.deliveryCharges || 0,
      currency: currency,
      vendorId: VENDOR_ID,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
    if (rErr) { console.error(`Restaurant ${r.name} Error:`, rErr); continue; }

    // 3. IDENTIFY Options from Vercel Feed (The Source of Truth)
    const items = r.menuItems || r.menu_items || [];
    for (const item of items) {
      console.log(`  Importing item: ${item.label}...`);
      
      const { error: mErr } = await s.from('MenuItem').upsert({
        id: item.id,
        label: item.label,
        description: item.description || '',
        price: item.price || 10,
        image: item.image || '',
        category: item.category || 'General',
        restaurantId: r.id,
        createdAt: now,
        updatedAt: now
      });

      if (mErr) continue;

      const vGroups = item.addonGroups || [];
      for (const vg of vGroups) {
        const groupDetails = vg.addonGroup || vg;
        const groupId = vg.addonGroupId || groupDetails.id;
        
        if (!groupId) continue;

        console.log(`    Gluing AddonGroup: ${groupDetails.displayName || groupDetails.name} (${groupId})...`);

        // UPSERT Group using Vercel ID
        await s.from('AddonGroup').upsert({
          id: groupId,
          restaurantId: r.id,
          name: groupDetails.name,
          displayName: groupDetails.displayName,
          selectionType: groupDetails.selectionType || 'SINGLE',
          isRequired: groupDetails.isRequired || false,
          minSelections: groupDetails.minSelections || 0,
          maxSelections: groupDetails.maxSelections || null,
          sortOrder: groupDetails.sortOrder || 0,
          isActive: true,
          createdAt: now,
          updatedAt: now
        });

        // 5. Injected Junction (The Glue)
        await s.from('MenuItemAddon').upsert({
          menuItemId: item.id,
          addonGroupId: groupId,
          sortOrder: vg.sortOrder || 0,
          createdAt: now
        }, { onConflict: 'menuItemId,addonGroupId' });
      }
    }
  }

  console.log('\n--- RESTORATION COMPLETE ---');
}

universalSync().catch(console.error);
