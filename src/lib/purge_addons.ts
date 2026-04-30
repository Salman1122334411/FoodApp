import https from 'https';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function purge() {
  console.log('--- STARTING ZERO-DEPENDENCY PROJECT-WIDE PURGE ---');
  
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('ERROR: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
    return;
  }

  // Target: /rest/v1/AddonOption?id=like.opt-*
  const endpoint = `${url}/rest/v1/AddonOption?id=like.opt-*`;
  const options = {
    method: 'DELETE',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  console.log('Sending Master Delete Request to Supabase REST API...');
  
  const req = https.request(endpoint, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        const json = JSON.parse(data || '[]');
        console.log(`SUCCESS: Purged ${json.length} injected selection pills from production.`);
      } else {
        console.error(`PURGE ERROR (${res.statusCode}):`, data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('CRITICAL NETWORK ERROR:', err);
  });

  req.end();
}

purge().catch(console.error);
