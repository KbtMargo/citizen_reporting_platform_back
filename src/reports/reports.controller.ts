import { Controller, Get, Post, Body, Param, UseGuards, Request, ValidationPipe, Patch, ForbiddenException, Req, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { Role } from 'src/auth/roles.enum';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

class CreateReportPayload {
  dto: CreateReportDto;
  fileKeys: string[];
}

@Controller('reports')
export class ReportsController {
  prisma: any;
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAllPublic() {
    return this.reportsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('my')
  findMyReports(@Request() req) {
    const userId = req.user.sub;
    return this.reportsService.findMyReports(userId);
  }

  @UseGuards(AuthGuard)
  @Get('my-stats')
  async getMyStats(@Request() req) {
    const userId = req.user.sub;
    return this.reportsService.getStatsForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() payload: { 
      title: string; description?: string; lat?: string; lng?: string; address?: string; 
      categoryId: string; recipientId: string; fileKeys: string[] 
    },
    @Request() req
  ) {
    const userId = req.user.sub;
    
    const { fileKeys, ...createReportDto } = payload;
    
    return this.reportsService.create(createReportDto as CreateReportDto, userId, fileKeys);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateData: {
      status?: 'NEW' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
      priority?: 'LOW' | 'NORMAL' | 'URGENT';
      title?: string;
      description?: string;
      address?: string;
      notes?: string;
    },
    @Request() req
  ) {

    const userId = req.user.sub;
    return this.reportsService.update(id, updateData, userId);
  }
    @UseGuards(AuthGuard, RolesGuard)
    @Get('my-osbb')
    @Roles(Role.OSBB_ADMIN, Role.ADMIN)
    async listForOsbb(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('take') take = '50'
  ) {
    const where: any = { author: { osbbId: req.user.osbbId } };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.report.findMany({
      where,
      take: Math.min(Number(take) || 50, 200),
      orderBy: { createdAt: 'desc' },
      include: { author: true, category: true, recipient: true },
    });
  }

  @Patch(':id/assign')
  @Roles(Role.OSBB_ADMIN, Role.ADMIN)
  async assignRecipient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { recipientId: string }
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { author: { select: { osbbId: true } } },
    });
    if (!report) throw new ForbiddenException('Report not found');

    if (req.user.role === Role.OSBB_ADMIN && report.author.osbbId !== req.user.osbbId) {
      throw new ForbiddenException('Not your OSBB');
    }

    return this.prisma.report.update({
      where: { id },
      data: { recipientId: body.recipientId },
    });
  }
}
