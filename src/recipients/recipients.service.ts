import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecipientsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.recipient.findMany();
  }
}