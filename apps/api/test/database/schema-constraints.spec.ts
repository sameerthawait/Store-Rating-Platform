import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

describe('Database Schema & Integrity Constraints', () => {
  let testUser: any;
  let testStore: any;

  beforeAll(async () => {
    // Clean up or prepare test fixtures
    const rawPassword = 'SecurePassword123!';
    const passwordHash = await argon2.hash(rawPassword);

    testUser = await prisma.user.create({
      data: {
        name: 'Constraint Test User',
        email: `constraint.test.${Date.now()}@test.local`,
        password_hash: passwordHash,
        address: '123 Test Street, Suite 100, Testville',
        role: Role.normal,
      },
    });

    testStore = await prisma.store.create({
      data: {
        name: 'Constraint Test Store',
        email: `store.constraint.${Date.now()}@test.local`,
        address: '456 Market Road, Testville',
      },
    });
  });

  afterAll(async () => {
    // Cleanup fixtures
    if (testStore) {
      await prisma.rating.deleteMany({ where: { store_id: testStore.id } });
      await prisma.store.delete({ where: { id: testStore.id } }).catch(() => null);
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => null);
    }
    await prisma.$disconnect();
  });

  it('should enforce password hashing via Argon2 and never store plaintext', async () => {
    const rawPassword = 'SecurePassword123!';
    expect(testUser.password_hash).not.toEqual(rawPassword);
    expect(testUser.password_hash.startsWith('$argon2')).toBe(true);

    const isMatch = await argon2.verify(testUser.password_hash, rawPassword);
    expect(isMatch).toBe(true);
  });

  it('should enforce compound UNIQUE constraint on (user_id, store_id)', async () => {
    // 1. First rating insert succeeds
    const rating1 = await prisma.rating.create({
      data: {
        user_id: testUser.id,
        store_id: testStore.id,
        rating: 5,
      },
    });
    expect(rating1.id).toBeDefined();

    // 2. Second direct create on same (user_id, store_id) MUST fail at DB level (P2002)
    await expect(
      prisma.rating.create({
        data: {
          user_id: testUser.id,
          store_id: testStore.id,
          rating: 4,
        },
      }),
    ).rejects.toThrow();
  });

  it('should allow single atomic upsert on (user_id, store_id) to update existing rating', async () => {
    const updatedRating = await prisma.rating.upsert({
      where: {
        user_id_store_id: {
          user_id: testUser.id,
          store_id: testStore.id,
        },
      },
      update: {
        rating: 3,
      },
      create: {
        user_id: testUser.id,
        store_id: testStore.id,
        rating: 3,
      },
    });

    expect(updatedRating.rating).toBe(3);

    // Verify exactly 1 rating exists for this pair
    const count = await prisma.rating.count({
      where: {
        user_id: testUser.id,
        store_id: testStore.id,
      },
    });
    expect(count).toBe(1);
  });

  it('should enforce database-level CHECK constraint for rating range (1-5)', async () => {
    // Try inserting rating = 0 or rating = 6 via raw SQL to test Postgres CHECK constraint
    await expect(
      prisma.$executeRaw`INSERT INTO ratings (id, user_id, store_id, rating, created_at, updated_at) 
                          VALUES (gen_random_uuid(), ${testUser.id}::uuid, ${testStore.id}::uuid, 0, NOW(), NOW())`,
    ).rejects.toThrow();

    await expect(
      prisma.$executeRaw`INSERT INTO ratings (id, user_id, store_id, rating, created_at, updated_at) 
                          VALUES (gen_random_uuid(), ${testUser.id}::uuid, ${testStore.id}::uuid, 6, NOW(), NOW())`,
    ).rejects.toThrow();
  });
});
