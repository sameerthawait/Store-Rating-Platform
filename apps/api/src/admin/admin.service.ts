import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves high-level platform health metrics.
   * Executes pure database-level COUNT queries in parallel for scalability.
   */
  async getDashboardMetrics(): Promise<AdminDashboardResponseDto> {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.store.count(),
      this.prisma.rating.count(),
    ]);

    return {
      totalUsers,
      totalStores,
      totalRatings,
    };
  }
}
