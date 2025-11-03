import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Prisma, UserRole } from '@prisma/client';
import { UpdateReportDto } from './dto/update-report.dto';
import { Role } from 'src/auth/roles.enum';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

@Get('users')
  findAllUsers(@Query('includeCounts') includeCounts?: string) {
    return this.adminService.findAllUsers(includeCounts === 'true');
  }
  @Get('reports')
  findAllReports() {
    return this.adminService.findAllReports();
  }

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Patch('reports/:id')
  updateReport(
    @Param('id') reportId: string,
    @Body(new ValidationPipe()) body: UpdateReportDto,
    @Request() req,
  ) {
    const adminUserId = req.user.sub;
    return this.adminService.updateReport(reportId, adminUserId, body);
  }

  @Get('analytics')
  async getAnalyticsDashboard() {
    const [stats, commonProblems, reportsOverTime] = await Promise.all([
      this.adminService.getDashboardStats(),
      this.adminService.getCommonProblems(),
      this.adminService.getReportsOverTime(),
    ]);
    return { stats, commonProblems, reportsOverTime };
  }

  @Get('reports/export')
  findReportsForExport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('userId') userId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.findReportsForExport({
      dateFrom,
      dateTo,
      userId,
      categoryId,
      recipientId,
      status,
    });
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserAdminDto,
  ) {
    return this.adminService.updateUser(userId, updateUserDto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }
}