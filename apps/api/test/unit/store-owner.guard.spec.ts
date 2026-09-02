import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { StoreOwnerGuard } from '../../src/common/guards/store-owner.guard';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('StoreOwnerGuard (Isolated Unit Tests)', () => {
  let guard: StoreOwnerGuard;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      store: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    guard = new StoreOwnerGuard(mockPrismaService as unknown as PrismaService);
  });

  const createMockContext = (user?: any, params?: any, body?: any): ExecutionContext => {
    const request = {
      user,
      params: params || {},
      body: body || {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access when stores.owner_id === currentUser.id', async () => {
    const user = { id: 'owner-uuid-1', role: 'store_owner' };
    const context = createMockContext(user, { storeId: 'store-uuid-100' });

    mockPrismaService.store.findUnique.mockResolvedValue({
      id: 'store-uuid-100',
      name: 'Apex Electronics',
      owner_id: 'owner-uuid-1', // Match!
    });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);

    // Verify verified store is attached to request
    const req = context.switchToHttp().getRequest() as any;
    expect(req.store.id).toBe('store-uuid-100');
  });

  it('should throw 403 Forbidden when store owner attempts to access a store owned by someone else', async () => {
    const user = { id: 'owner-uuid-1', role: 'store_owner' };
    const context = createMockContext(user, { storeId: 'store-uuid-200' });

    // Store belongs to a different owner!
    mockPrismaService.store.findUnique.mockResolvedValue({
      id: 'store-uuid-200',
      name: 'Other Store',
      owner_id: 'different-owner-uuid-2',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have ownership access to this store'),
    );
  });

  it('should throw 404 NotFound when target store does not exist', async () => {
    const user = { id: 'owner-uuid-1', role: 'store_owner' };
    const context = createMockContext(user, { storeId: 'non-existent-store-uuid' });

    mockPrismaService.store.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new NotFoundException('Store not found'),
    );
  });

  it('should throw 403 Forbidden when a normal user attempts to access a store owner route', async () => {
    const user = { id: 'normal-user-uuid', role: 'normal' };
    const context = createMockContext(user, { storeId: 'store-uuid-100' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('Only store owners can access this resource'),
    );

    expect(mockPrismaService.store.findUnique).not.toHaveBeenCalled();
  });

  it('should allow Admin users to access any store without ownership restriction', async () => {
    const adminUser = { id: 'admin-uuid', role: 'admin' };
    const context = createMockContext(adminUser, { storeId: 'store-uuid-100' });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(mockPrismaService.store.findUnique).not.toHaveBeenCalled();
  });

  it('should throw 401 Unauthorized if request context has no user', async () => {
    const context = createMockContext(undefined, { storeId: 'store-uuid-100' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authentication required'),
    );
  });
});
