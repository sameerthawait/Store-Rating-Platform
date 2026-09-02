import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@ratehub/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Admins have platform-wide oversight
    if (user.role === Role.ADMIN || user.role === 'admin') {
      return true;
    }

    // Must be a store owner
    if (user.role !== Role.STORE_OWNER && user.role !== 'store_owner') {
      throw new ForbiddenException('Only store owners can access this resource');
    }

    // Extract target store ID from request params, query, or body
    const storeId =
      request.params?.storeId ||
      request.params?.id ||
      request.query?.storeId ||
      request.body?.storeId;

    if (storeId) {
      // Direct store access: re-verify store ownership in database
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      if (store.owner_id !== user.id) {
        throw new ForbiddenException('You do not have ownership access to this store');
      }

      // Attach verified store to request context
      request.store = store;
      return true;
    }

    // If no storeId in params/body, verify that the owner has an assigned store
    const store = await this.prisma.store.findFirst({
      where: { owner_id: user.id },
    });

    if (!store) {
      throw new NotFoundException('No store is currently assigned to your account');
    }

    request.store = store;
    return true;
  }
}
