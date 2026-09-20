import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key Present:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log('\n--- 1. Testing Supabase Database Tables ---');
  try {
    const { data: products, error: prodErr } = await supabase.from('products').select('*').limit(5);
    if (prodErr) {
      console.log('❌ Error querying products table:', prodErr.message, prodErr.code);
    } else {
      console.log(`✅ Products table queried successfully! Found ${products?.length || 0} rows.`);
    }
  } catch (e: any) {
    console.log('❌ Exception querying products table:', e.message);
  }

  console.log('\n--- 2. Testing Supabase Auth Phone OTP (Twilio) ---');
  try {
    const testPhone = '+919981154672';
    console.log(`Attempting signInWithOtp for phone: ${testPhone}...`);
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: testPhone,
    });

    if (error) {
      console.log('❌ Supabase Phone Auth (Twilio) Error:', error.message, error.status);
    } else {
      console.log('✅ Supabase Phone Auth OTP sent successfully via Twilio!', data);
    }
  } catch (e: any) {
    console.log('❌ Exception in Phone Auth:', e.message);
  }
}

testSupabase().catch(console.error);
