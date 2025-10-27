import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReportStatus, Prisma } from '@prisma/client';
import { UpdateReportDto } from './dto/update-report.dto';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    private readonly s3Client: S3Client;

    constructor(private prisma: PrismaService) {
        const region = process.env.S3_REGION;
        const endpoint = process.env.S3_ENDPOINT;
        const accessKeyId = process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

        if (!region || !endpoint || !accessKeyId || !secretAccessKey) {
            this.logger.error('Відсутні необхідні змінні середовища для S3!');
            throw new InternalServerErrorException('Неправильна конфігурація S3');
        }
        
        this.s3Client = new S3Client({
            endpoint, region,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true,
        });
    }

    findAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: { osbb: true },
        });
    }

    findAllReports() {
        return this.prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                author: true, category: true, 
                recipient: true, files: { take: 1 }
            },
        });
    }

    async getDashboardStats() {
        const pending = await this.prisma.report.count({ where: { status: ReportStatus.NEW } });
        const inProgress = await this.prisma.report.count({ where: { status: ReportStatus.IN_PROGRESS } });
        const resolved = await this.prisma.report.count({ where: { status: ReportStatus.DONE } });
        const total = await this.prisma.report.count();
        return { pending, inProgress, resolved, total };
    }

    async getCommonProblems() {
        const categoriesWithCounts = await this.prisma.category.findMany({
            include: {
                _count: {
                    select: { reports: true },
                },
            },
        });

        return categoriesWithCounts
            .filter(cat => cat._count.reports > 0) 
            .map(cat => ({
                name: cat.name,
                total: cat._count.reports,
            }))
            .sort((a, b) => b.total - a.total);
    }

    async getReportsOverTime() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const reports = await this.prisma.report.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
            },
            select: {
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        const dailyCounts = reports.reduce((acc, report) => {
            const date = report.createdAt.toISOString().split('T')[0]; 
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(dailyCounts).map(([date, count]) => ({
            name: new Date(date).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' }), 
            total: count,
        }));
    }

    async updateReport(reportId: string, adminUserId: string, data: UpdateReportDto) {
        const { notes, status, filesToDelete, ...reportData } = data;

        if (filesToDelete && filesToDelete.length > 0) {
            const bucketName = process.env.S3_BUCKET;
            if (!bucketName) throw new InternalServerErrorException('Назва S3 бакету не налаштована.');
            
            for (const fileKey of filesToDelete) {
                try {
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: fileKey,
                    });
                    await this.s3Client.send(deleteCommand);
                } catch (error) {
                    this.logger.error(`Не вдалося видалити файл з S3: ${fileKey}`, error.stack);
                }
            }
            
            await this.prisma.file.deleteMany({
                where: {
                    key: { in: filesToDelete },
                    reportId: reportId,
                }
            });
        }

        const dataToUpdate: Prisma.ReportUpdateInput = { ...reportData };
        if (status) {
            dataToUpdate.status = status;
        }

        const updatedReport = await this.prisma.report.update({
            where: { id: reportId },
            data: dataToUpdate,
        });

        if (notes || (status && status !== data.status)) {
            const historyNote = notes || `Статус змінено на "${status}"`;
            await this.prisma.reportUpdate.create({
                data: {
                    description: historyNote,
                    reportId: reportId,
                    authorId: adminUserId,
                }
            });
        }
        
        return updatedReport;
    }

    async updateUser(userId: string, data: UpdateUserAdminDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        osbbId: data.osbbId,
          },
      });
    }

    async deleteUser(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
    }
}