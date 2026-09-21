import { PrismaClient } from '@prisma/client';

async function testConnection(url: string, name: string) {
  console.log(`Testing ${name}...`);
  const client = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    await client.$connect();
    console.log(`SUCCESS: ${name}`);
    const userCount = await client.user.count();
    console.log(`User count in ${name}: ${userCount}`);
    await client.$disconnect();
  } catch (err: any) {
    console.error(`FAILED ${name}: ${err.message}`);
  }
}

async function main() {
  const envUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';
  const directHostUrl = 'postgresql://postgres:Apple%40222%23A12@db.fpmnkenfcvcfmkvkzttm.supabase.co:5432/postgres';

  await testConnection(envUrl, 'DATABASE_URL (.env)');
  await testConnection(directUrl, 'DIRECT_URL (.env)');
  await testConnection(directHostUrl, 'Direct DB host (db.fpmnkenfcvcfmkvkzttm.supabase.co)');
}

main();
