import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, ReportStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

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
                author: true, 
                category: true, 
                recipient: true,
                files: { take: 1 }
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

    async updateReportStatus(
        reportId: string, 
        newStatus: ReportStatus, 
        notes: string | undefined, 
        adminUserId: string
    ) {
        const updatedReport = await this.prisma.report.update({
            where: { id: reportId },
            data: { status: newStatus },
        });

        if (notes) {
            await this.prisma.reportUpdate.create({
                data: {
                    description: notes,
                    reportId: reportId,
                    authorId: adminUserId, 
                }
            });
        }
        
        return updatedReport;
    }
}