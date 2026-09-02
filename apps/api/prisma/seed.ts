import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting idempotent database seeding...');

  // 1. Hash default password for seeded accounts
  const defaultPassword = 'Password123!';
  const hashedPassword = await argon2.hash(defaultPassword);

  // 2. Admin account from environment variables
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@storerating.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
  const hashedAdminPassword = await argon2.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'System Administrator',
      address: '742 Evergreen Terrace, Platform HQ, Springfield',
      role: Role.admin,
    },
    create: {
      name: 'System Administrator',
      email: adminEmail,
      password_hash: hashedAdminPassword,
      address: '742 Evergreen Terrace, Platform HQ, Springfield',
      role: Role.admin,
    },
  });
  console.info(`✓ Admin account provisioned: ${admin.email}`);

  // 3. Store Owners
  const owner1 = await prisma.user.upsert({
    where: { email: 'owner.tech@storerating.local' },
    update: {
      name: 'Marcus Vance (Tech Owner)',
      address: '100 Silicon Way, Tech District, San Francisco, CA',
      role: Role.store_owner,
    },
    create: {
      name: 'Marcus Vance (Tech Owner)',
      email: 'owner.tech@storerating.local',
      password_hash: hashedPassword,
      address: '100 Silicon Way, Tech District, San Francisco, CA',
      role: Role.store_owner,
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'owner.coffee@storerating.local' },
    update: {
      name: 'Elena Rostova (Coffee Owner)',
      address: '250 Roast Lane, Market Quarter, Seattle, WA',
      role: Role.store_owner,
    },
    create: {
      name: 'Elena Rostova (Coffee Owner)',
      email: 'owner.coffee@storerating.local',
      password_hash: hashedPassword,
      address: '250 Roast Lane, Market Quarter, Seattle, WA',
      role: Role.store_owner,
    },
  });

  const owner3 = await prisma.user.upsert({
    where: { email: 'owner.apparel@storerating.local' },
    update: {
      name: 'David Kim (Apparel Owner)',
      address: '500 Fifth Avenue, Fashion District, New York, NY',
      role: Role.store_owner,
    },
    create: {
      name: 'David Kim (Apparel Owner)',
      email: 'owner.apparel@storerating.local',
      password_hash: hashedPassword,
      address: '500 Fifth Avenue, Fashion District, New York, NY',
      role: Role.store_owner,
    },
  });
  console.info('✓ Store owners provisioned');

  // 4. Stores (assigned to owners)
  const store1 = await prisma.store.upsert({
    where: { email: 'contact@apexelectronics.com' },
    update: {
      name: 'Apex Electronics Superstore',
      address: '100 Silicon Way, Tech District, San Francisco, CA',
      owner_id: owner1.id,
    },
    create: {
      name: 'Apex Electronics Superstore',
      email: 'contact@apexelectronics.com',
      address: '100 Silicon Way, Tech District, San Francisco, CA',
      owner_id: owner1.id,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { email: 'hello@artisancoffeeroasters.com' },
    update: {
      name: 'Artisan Coffee Roasters',
      address: '250 Roast Lane, Market Quarter, Seattle, WA',
      owner_id: owner2.id,
    },
    create: {
      name: 'Artisan Coffee Roasters',
      email: 'hello@artisancoffeeroasters.com',
      address: '250 Roast Lane, Market Quarter, Seattle, WA',
      owner_id: owner2.id,
    },
  });

  const store3 = await prisma.store.upsert({
    where: { email: 'info@urbanthreadsapparel.com' },
    update: {
      name: 'Urban Threads Premium Apparel',
      address: '500 Fifth Avenue, Fashion District, New York, NY',
      owner_id: owner3.id,
    },
    create: {
      name: 'Urban Threads Premium Apparel',
      email: 'info@urbanthreadsapparel.com',
      address: '500 Fifth Avenue, Fashion District, New York, NY',
      owner_id: owner3.id,
    },
  });
  console.info('✓ Stores provisioned');

  // 5. Normal Users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice.walker@storerating.local' },
    update: {
      name: 'Alice Walker (Shopper)',
      address: '12 Maple Road, Suburbia, Chicago, IL',
      role: Role.normal,
    },
    create: {
      name: 'Alice Walker (Shopper)',
      email: 'alice.walker@storerating.local',
      password_hash: hashedPassword,
      address: '12 Maple Road, Suburbia, Chicago, IL',
      role: Role.normal,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob.miller@storerating.local' },
    update: {
      name: 'Robert Miller (Shopper)',
      address: '45 Pine Street, Downtown, Denver, CO',
      role: Role.normal,
    },
    create: {
      name: 'Robert Miller (Shopper)',
      email: 'bob.miller@storerating.local',
      password_hash: hashedPassword,
      address: '45 Pine Street, Downtown, Denver, CO',
      role: Role.normal,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'charlie.davis@storerating.local' },
    update: {
      name: 'Charlotte Davis (Shopper)',
      address: '88 Ocean Boulevard, Waterfront, Miami, FL',
      role: Role.normal,
    },
    create: {
      name: 'Charlotte Davis (Shopper)',
      email: 'charlie.davis@storerating.local',
      password_hash: hashedPassword,
      address: '88 Ocean Boulevard, Waterfront, Miami, FL',
      role: Role.normal,
    },
  });
  console.info('✓ Normal users provisioned');

  // 6. Ratings (Atomic upsert on composite unique key [user_id, store_id])
  const ratingData = [
    { userId: user1.id, storeId: store1.id, rating: 5 },
    { userId: user2.id, storeId: store1.id, rating: 4 },
    { userId: user3.id, storeId: store1.id, rating: 4 },
    { userId: user1.id, storeId: store2.id, rating: 5 },
    { userId: user2.id, storeId: store2.id, rating: 5 },
    { userId: user3.id, storeId: store3.id, rating: 3 },
    { userId: user1.id, storeId: store3.id, rating: 4 },
  ];

  for (const r of ratingData) {
    await prisma.rating.upsert({
      where: {
        user_id_store_id: {
          user_id: r.userId,
          store_id: r.storeId,
        },
      },
      update: {
        rating: r.rating,
      },
      create: {
        user_id: r.userId,
        store_id: r.storeId,
        rating: r.rating,
      },
    });
  }
  console.info(`✓ Seeded ${ratingData.length} ratings idempotently`);

  console.info('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
