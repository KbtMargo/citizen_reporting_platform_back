import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ReportStatus, Prisma } from '@prisma/client'; 

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                osbb: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Користувача не знайдено');
        }

        const { password, ...result } = user;
        return result;
    }

    async updateProfile(userId: string, data: UpdateUserDto) {
        const { email, ...updateData } = data;
        if (email) {
            console.warn("Електронну пошту не можна змінювати.");
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData, 
        });

        const { password, ...result } = user;
        return result;
    }

    async getUserStats(userId: string) {
        const totalReports = await this.prisma.report.count({
            where: { authorId: userId },
        });
        const resolvedReports = await this.prisma.report.count({
            where: { authorId: userId, status: ReportStatus.DONE },
        });
        const activeReports = await this.prisma.report.count({
            where: {
                authorId: userId,
                status: { in: [ReportStatus.NEW, ReportStatus.IN_PROGRESS] }
            },
        });

        return { totalReports, resolvedReports, activeReports };
    }
}