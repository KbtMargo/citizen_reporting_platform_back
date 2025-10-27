import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOsbbDto } from './dto/create-osbb.dto';
import { UpdateOsbbDto } from './dto/update-osbb.dto';

@Injectable()
export class OsbbService {
  constructor(private prisma: PrismaService) {}

  create(createOsbbDto: CreateOsbbDto) {
    return this.prisma.oSBB.create({
      data: {
        name: createOsbbDto.name,
        address: createOsbbDto.address,
      },
    });
  }

  findAll() {
    return this.prisma.oSBB.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  update(id: string, updateOsbbDto: UpdateOsbbDto) {
    return this.prisma.oSBB.update({
      where: { id },
      data: updateOsbbDto,
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.oSBB.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('ОСББ не знайдено або його неможливо видалити');
    }
  }
}