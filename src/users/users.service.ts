import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
}

