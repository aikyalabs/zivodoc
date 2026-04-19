import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleEntity } from '../entities/role.entity';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saas_template',
    entities: [join(__dirname, '../entities/*{.ts,.js}')],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Connected to database.');

  const orgRepo = dataSource.getRepository(OrganizationEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);

  // Check if admin already exists
  const existingAdmin = await userRepo.findOne({ where: { email: 'hello@aikyalabs.app' } });
  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.');
    await dataSource.destroy();
    return;
  }

  // Create default organization
  const org = orgRepo.create({
    name: 'zivodoc',
    slug: 'zivodoc',
  });
  const savedOrg = await orgRepo.save(org);
  console.log(`Created organization: ${savedOrg.name} (${savedOrg.id})`);

  // Create admin role with full permissions
  const adminRole = roleRepo.create({
    name: 'admin',
    description: 'Full access to all resources',
    permissions: [{ resource: '*', actions: ['manage'] }],
    organizationId: savedOrg.id,
  });
  const savedRole = await roleRepo.save(adminRole);
  console.log(`Created role: ${savedRole.name} (${savedRole.id})`);

  // Create platform admin (no organization — admins are platform-wide)
  const admin = userRepo.create({
    firstName: 'Ritesh',
    lastName: 'Kumar',
    email: 'hello@aikyalabs.app',
    role: 'admin',
    organizationId: null,
    onboardingCompleted: true,
  });
  const savedUser = await userRepo.save(admin);
  console.log(`Created admin: ${savedUser.email} (${savedUser.id})`);

  // Create an org owner for the default org
  const owner = userRepo.create({
    firstName: 'Org',
    lastName: 'Owner',
    email: 'owner@zivodoc.com',
    role: 'owner',
    organizationId: savedOrg.id,
    roleId: savedRole.id,
    onboardingCompleted: true,
  });
  const savedOwner = await userRepo.save(owner);
  console.log(`Created org owner: ${savedOwner.email} (${savedOwner.id})`);

  console.log('\n--- Seed Complete ---');
  console.log(`Admin:        hello@aikyalabs.app (use Google OAuth or Email OTP to sign in)`);
  console.log(`Org Owner:    owner@zivodoc.com (use Google OAuth or Email OTP to sign in)`);
  console.log(`Organization: ${savedOrg.name}`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
