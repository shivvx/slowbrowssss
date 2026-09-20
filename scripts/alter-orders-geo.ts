import { Client } from 'pg';

async function updateOrdersTable() {
  const client = new Client({
    host: 'db.soykxeyxccgmycekjxmy.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Shiv8817504671',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL...');

    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS delivery_address TEXT,
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS distance_km DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    `);

    console.log('✅ Successfully added geolocation and delivery address columns to Supabase!');
  } catch (e: any) {
    console.error('Error updating schema:', e.message);
  } finally {
    await client.end();
  }
}

updateOrdersTable();
