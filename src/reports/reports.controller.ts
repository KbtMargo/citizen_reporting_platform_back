import { Controller, Get, Post, Body, Param, UseGuards, Request, ValidationPipe, Patch } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateReportDto } from './dto/create-report.dto';

class CreateReportPayload {
  dto: CreateReportDto;
  fileKeys: string[];
}

@Controller('api/reports')
export class ReportsController {
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
}