import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReportStatus, Prisma, UserRole } from '@prisma/client';
import { UpdateReportDto } from './dto/update-report.dto';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { NotificationsService } from '../notifications/notifications.service';

interface ReportExportFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  categoryId?: string;
  recipientId?: string;
  status?: string;
}

type Scope = { role: UserRole; osbbId?: string | null };

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    const region = process.env.S3_REGION;
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!region || !endpoint || !accessKeyId || !secretAccessKey) {
      this.logger.error('Відсутні необхідні змінні середовища для S3!');
      throw new InternalServerErrorException('Неправильна конфігурація S3');
    }
    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  private reportScopeWhere(scope: Scope): Prisma.ReportWhereInput {
    if (scope.role === 'OSBB_ADMIN') {
      return { author: { osbbId: scope.osbbId ?? undefined } };
    }
    return {};
  }

  private userScopeWhere(scope: Scope): Prisma.UserWhereInput {
    if (scope.role === 'OSBB_ADMIN') {
      return { osbbId: scope.osbbId ?? undefined };
    }
    return {};
  }

  async findAllUsers(scope: Scope, includeCounts: boolean) {
    const where = this.userScopeWhere(scope);
    const total = await this.prisma.user.count({ where });

    if (!includeCounts) {
      const users = await this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          osbbId: true,
          createdAt: true,
          osbb: true,
        },
      });
      return { data: users, total };
    }

    const usersWithCounts = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        osbbId: true,
        createdAt: true,
        osbb: true,
        _count: { select: { reports: true } },
      },
    });

    return { data: usersWithCounts, total };
  }

  async findAllReports(scope: Scope) {
    const where = this.reportScopeWhere(scope);
    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        category: true,
        recipient: true,
        files: { take: 1 },
      },
    });
  }

  async getDashboardStats(scope: Scope) {
    const base = this.reportScopeWhere(scope);
    const [pending, inProgress, resolved, total] = await Promise.all([
      this.prisma.report.count({
        where: { ...base, status: ReportStatus.NEW },
      }),
      this.prisma.report.count({
        where: { ...base, status: ReportStatus.IN_PROGRESS },
      }),
      this.prisma.report.count({
        where: { ...base, status: ReportStatus.DONE },
      }),
      this.prisma.report.count({ where: base }),
    ]);
    return { pending, inProgress, resolved, total };
  }

  async getCommonProblems(scope: Scope) {
    const base = this.reportScopeWhere(scope);
    const grouped = await this.prisma.report.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      where: base,
    });
    const ids = grouped.map((g) => g.categoryId).filter(Boolean) as string[];
    if (ids.length === 0) return [];
    const cats = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const nameById = new Map(cats.map((c) => [c.id, c.name]));
    return grouped
      .map((g) => ({
        name: g.categoryId
          ? nameById.get(g.categoryId) ?? 'Без категорії'
          : 'Без категорії',
        total: g._count._all,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async getReportsOverTime(scope: Scope) {
    if (scope.role === 'OSBB_ADMIN' && scope.osbbId) {
      const rows = await this.prisma.$queryRaw<
        Array<{ name: string; total: number }>
      >`
        SELECT 
          to_char(date_trunc('week', r."createdAt"), 'DD Mon') AS name,
          COUNT(*)::int AS total
        FROM "Report" r
        JOIN "User" u ON u."id" = r."authorId"
        WHERE u."osbbId" = ${scope.osbbId}
          AND r."createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY date_trunc('week', r."createdAt")
        ORDER BY date_trunc('week', r."createdAt")
      `;
      return rows;
    } else {
      const rows = await this.prisma.$queryRaw<
        Array<{ name: string; total: number }>
      >`
        SELECT 
          to_char(date_trunc('week', r."createdAt"), 'DD Mon') AS name,
          COUNT(*)::int AS total
        FROM "Report" r
        WHERE r."createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY date_trunc('week', r."createdAt")
        ORDER BY date_trunc('week', r."createdAt")
      `;
      return rows;
    }
  }

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    adminName: string,
    scope?: Scope,
  ) {
    if (scope?.role === 'OSBB_ADMIN') {
      const r = await this.prisma.report.findUnique({
        where: { id: reportId },
        select: { author: { select: { osbbId: true } } },
      });
      if (!r || r.author?.osbbId !== scope.osbbId) {
        throw new ForbiddenException();
      }
    }
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
      include: { author: true },
    });
    if (report && report.author) {
      const message = `Ваше звернення "${report.title}" отримало новий статус: ${status}.`;
      await this.notificationsService.create({
        title: report.title,
        message,
        userId: report.authorId,
        reportId: report.id,
        type: 'REPORT_UPDATE',
        priority: 'LOW',
      });
    }
    await this.prisma.reportUpdate.create({
      data: {
        description: `Статус змінено на "${status}"`,
        reportId,
        authorId: adminName,
      },
    });
    return report;
  }

  async updateReport(
    reportId: string,
    adminUserId: string,
    data: UpdateReportDto,
    scope?: Scope,
  ) {
    const { notes, status, filesToDelete, ...reportData } = data;
    const oldReport = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        status: true,
        authorId: true,
        title: true,
        author: { select: { osbbId: true } },
      },
    });
    if (!oldReport) throw new NotFoundException('Report not found');
    if (
      scope?.role === 'OSBB_ADMIN' &&
      oldReport.author?.osbbId !== scope.osbbId
    ) {
      throw new ForbiddenException();
    }
    if (filesToDelete && filesToDelete.length > 0) {
      const bucketName = process.env.S3_BUCKET;
      if (!bucketName)
        throw new InternalServerErrorException('Назва S3 бакету не налаштована.');
      for (const fileKey of filesToDelete) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
          });
          await this.s3Client.send(deleteCommand);
        } catch (error) {
          this.logger.error(
            `Не вдалося видалити файл з S3: ${fileKey}`,
            (error as any).stack,
          );
        }
      }
      await this.prisma.file.deleteMany({
        where: { key: { in: filesToDelete }, reportId },
      });
    }
    const dataToUpdate: Prisma.ReportUpdateInput = { ...reportData };
    if (status) dataToUpdate.status = status;
    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: dataToUpdate,
    });
    if (status && status !== oldReport.status) {
      const historyNote = notes || `Статус змінено на "${status}"`;
      await this.prisma.reportUpdate.create({
        data: { description: historyNote, reportId, authorId: adminUserId },
      });
      const message = `Ваше звернення "${oldReport.title}" отримало новий статус: ${status}.`;
      await this.notificationsService.create({
        title: oldReport.title,
        message,
        userId: oldReport.authorId,
        reportId,
        type: 'REPORT_STATUS_CHANGE',
        priority: 'MEDIUM',
      });
    } else if (notes) {
      await this.prisma.reportUpdate.create({
        data: { description: notes, reportId, authorId: adminUserId },
      });
    }
    return updatedReport;
  }

async updateUser(userId: string, data: UpdateUserAdminDto, scope: Scope) {
    if (scope.role === 'OSBB_ADMIN') {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { osbbId: true },
      });
      if (!u) throw new NotFoundException('Користувача не знайдено');
      if (u.osbbId !== scope.osbbId) throw new ForbiddenException();
      if (
        Object.prototype.hasOwnProperty.call(data, 'osbbId') &&
        data.osbbId !== u.osbbId
      ) {
        throw new ForbiddenException();
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      firstName: data.firstName ?? undefined,
      lastName: data.lastName ?? undefined,
      phone: data.phone ?? undefined,
      role: data.role ?? undefined,
    };

    // Виправлена логіка для оновлення зв'язку OSBB
    if (Object.prototype.hasOwnProperty.call(data, 'osbbId')) {
      if (data.osbbId === null) {
        updateData.osbb = {
          disconnect: true,
        };
      } else {
        updateData.osbb = {
          connect: { id: data.osbbId },
        };
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async deleteUser(userId: string, scope: Scope) {
    if (scope.role === 'OSBB_ADMIN') {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { osbbId: true },
      });
      if (!u) throw new NotFoundException('Користувача не знайдено');
      if (u.osbbId !== scope.osbbId) throw new ForbiddenException();
    }

    const userReportsCount = await this.prisma.report.count({
      where: { authorId: userId },
    });

    if (userReportsCount > 0) {
      throw new ConflictException(
        "Неможливо видалити користувача, оскільки він має пов'язані звернення.",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reportUpdate.deleteMany({ where: { authorId: userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
    return { message: 'Користувача успішно видалено' };
  }

  async findReportsForExport(filters: ReportExportFilters, scope: Scope) {
    const { dateFrom, dateTo, userId, categoryId, recipientId, status } =
      filters;
    const base = this.reportScopeWhere(scope);
    const where: Prisma.ReportWhereInput = { ...base };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setDate(toDate.getDate() + 1);
        where.createdAt.lte = toDate;
      }
    }
    if (userId && userId !== 'all') where.authorId = userId;
    if (categoryId && categoryId !== 'all') where.categoryId = categoryId;
    if (recipientId && recipientId !== 'all') where.recipientId = recipientId;
    if (status && status !== 'all') where.status = status as ReportStatus;
    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { firstName: true, lastName: true } },
        category: { select: { name: true } },
        recipient: { select: { name: true } },
      },
    });
  }

  async findAllOsbb() {
    return this.prisma.oSBB.findMany({ 
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        
        address: true,
        invitationCode: true,
        _count: {
          select: { members: true }
        },
        },
    });
  }
}