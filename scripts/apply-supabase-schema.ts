import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function applySchema() {
  const host = 'db.soykxeyxccgmycekjxmy.supabase.co';
  const password = 'Shiv8817504671';
  const user = 'postgres';
  const database = 'postgres';

  console.log(`Connecting to Supabase PostgreSQL at ${host}...`);

  const client = new Client({
    host,
    port: 5432,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL database!');

    const schemaPath = path.resolve('supabase/migrations/20260920000000_init_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    console.log(`Applying schema from ${schemaPath} (${schemaSql.length} bytes)...`);
    await client.query(schemaSql);
    console.log('✅ Schema applied successfully!');

    const seedPath = path.resolve('supabase/seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      console.log(`Applying seed data from ${seedPath} (${seedSql.length} bytes)...`);
      await client.query(seedSql);
      console.log('✅ Seed data applied successfully!');
    }

    const res = await client.query('SELECT COUNT(*) FROM products');
    console.log(`🎉 Products table in Supabase now has ${res.rows[0].count} items!`);
  } catch (err: any) {
    console.error('❌ Error applying schema to Supabase:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

applySchema();
