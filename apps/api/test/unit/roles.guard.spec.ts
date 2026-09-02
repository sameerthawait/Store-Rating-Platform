import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@ratehub/shared';
import { RolesGuard } from '../../src/common/guards/roles.guard';

describe('RolesGuard (Isolated Unit Tests)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles metadata is specified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: 'normal' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user role matches allowed roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, 'admin']);
    const context = createMockContext({ id: 'admin-uuid', role: 'admin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw 403 Forbidden when user role does not match allowed roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, 'admin']);

    // 1. Normal user trying to access admin endpoint
    const normalContext = createMockContext({ id: 'user-uuid', role: 'normal' });
    expect(() => guard.canActivate(normalContext)).toThrow(
      new ForbiddenException('You do not have permission to access this resource'),
    );

    // 2. Store owner trying to access admin endpoint
    const ownerContext = createMockContext({ id: 'owner-uuid', role: 'store_owner' });
    expect(() => guard.canActivate(ownerContext)).toThrow(
      new ForbiddenException('You do not have permission to access this resource'),
    );
  });

  it('should throw 401 Unauthorized if user object is not present in request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Authentication required to access this resource'),
    );
  });
});
