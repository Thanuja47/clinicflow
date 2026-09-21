import { PrismaClient } from '@prisma/client';

const candidates = [
  { name: 'ap-northeast-1 6543', url: 'postgresql://postgres.fpmnkenfcvcfmkvkzttm:Apple%40222%23A12@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres' },
  { name: 'ap-northeast-1 5432', url: 'postgresql://postgres.fpmnkenfcvcfmkvkzttm:Apple%40222%23A12@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' },
  { name: 'ap-southeast-1 6543', url: 'postgresql://postgres.fpmnkenfcvcfmkvkzttm:Apple%40222%23A12@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres' },
  { name: 'ap-southeast-1 5432', url: 'postgresql://postgres.fpmnkenfcvcfmkvkzttm:Apple%40222%23A12@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres' },
  { name: 'us-east-1 6543', url: 'postgresql://postgres.fpmnkenfcvcfmkvkzttm:Apple%40222%23A12@aws-0-us-east-1.pooler.supabase.com:6543/postgres' },
  { name: 'eu-central-1 6543', url: 'postgresql://postgres.fpmnkenfcvcfmkvkzttm:Apple%40222%23A12@aws-0-eu-central-1.pooler.supabase.com:6543/postgres' },
  { name: 'ap-south-1 6543', url: 'postgresql://postgres.fpmnkenfcvcfmkvkzttm:Apple%40222%23A12@aws-0-ap-south-1.pooler.supabase.com:6543/postgres' },
  { name: 'postgres user plain ap-northeast-1 6543', url: 'postgresql://postgres:Apple%40222%23A12@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres' },
];

async function run() {
  for (const item of candidates) {
    const client = new PrismaClient({ datasources: { db: { url: item.url } } });
    try {
      await client.$connect();
      console.log(`SUCCESS CONNECT: ${item.name}`);
      const count = await client.user.count();
      console.log(`User count in ${item.name}: ${count}`);
      await client.$disconnect();
    } catch (e: any) {
      console.log(`FAIL ${item.name}: ${e.message.split('\n')[0]}`);
    }
  }
}

run();
