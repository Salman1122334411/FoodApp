const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dependency issues
const envPath = path.join(__dirname, '..', '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

async function purge() {
  console.log('--- STARTING VANILLA PROJECT-WIDE PURGE ---');
  
  const url = env['EXPO_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !key) {
    console.error('ERROR: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
    return;
  }

  // URL: https://[ref].supabase.co/rest/v1/AddonOption?id=like.opt-*
  const baseUrl = url.replace('https://', '');
  const path = '/rest/v1/AddonOption?id=like.opt-*';

  const options = {
    hostname: baseUrl,
    path: path,
    method: 'DELETE',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  console.log('Connecting to Supabase REST API...');
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const json = JSON.parse(data || '[]');
        console.log(`SUCCESS: Purged ${json.length} hardcoded selection pills from production.`);
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
