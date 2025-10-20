import { Controller, Get, Param, UseGuards, Request, Post, Body, ValidationPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard'; 
import { CreateReportDto } from './dto/create-report.dto';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Post() // Обробляє POST-запити на /api/reports
  create(
    @Body(new ValidationPipe()) createReportDto: CreateReportDto, // Валідуємо тіло запиту
    @Request() req,
  ) {
    const userId = req.user.sub; // Беремо ID користувача з токена
    return this.reportsService.create(createReportDto, userId);
  }
}