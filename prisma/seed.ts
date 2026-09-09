import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ClinicFlow database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Default Clinic
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'lankacare' },
    update: {},
    create: {
      name: 'LankaCare Private Clinic',
      slug: 'lankacare',
      address: '123 Galle Road, Colombo 03',
      phone: '+94112345678',
      planTier: 'PRO',
    },
  });

  console.log(`Created Clinic: ${clinic.name} (${clinic.id})`);

  // 2. Create Default Branch
  const branch = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      name: 'Colombo Main Branch',
      address: '123 Galle Road, Colombo 03',
      phone: '+94112345678',
    },
  });

  console.log(`Created Branch: ${branch.name}`);

  // 3. Create Super Admin User (Fillex360)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@fillex360.com' },
    update: {},
    create: {
      clinicId: clinic.id,
      branchId: branch.id,
      name: 'Fillex360 Super Admin',
      email: 'superadmin@fillex360.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // 4. Create Clinic Admin User
  const clinicAdmin = await prisma.user.upsert({
    where: { email: 'admin@lankacare.lk' },
    update: {},
    create: {
      clinicId: clinic.id,
      branchId: branch.id,
      name: 'Dr. Nirmal Perera (Admin)',
      email: 'admin@lankacare.lk',
      passwordHash,
      role: 'CLINIC_ADMIN',
    },
  });

  // 5. Create Doctor User
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@lankacare.lk' },
    update: {},
    create: {
      clinicId: clinic.id,
      branchId: branch.id,
      name: 'Dr. Kasun Fernando',
      email: 'doctor@lankacare.lk',
      passwordHash,
      role: 'DOCTOR',
    },
  });

  // 6. Create Receptionist User
  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@lankacare.lk' },
    update: {},
    create: {
      clinicId: clinic.id,
      branchId: branch.id,
      name: 'Samanthi Silva',
      email: 'reception@lankacare.lk',
      passwordHash,
      role: 'RECEPTIONIST',
    },
  });

  console.log('Seeded Users:');
  console.log('  SUPER_ADMIN  : superadmin@fillex360.com / Password123!');
  console.log('  CLINIC_ADMIN : admin@lankacare.lk / Password123!');
  console.log('  DOCTOR       : doctor@lankacare.lk / Password123!');
  console.log('  RECEPTIONIST : reception@lankacare.lk / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
