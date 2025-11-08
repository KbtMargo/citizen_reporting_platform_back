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
import { UpdateReportDto } from './dto/update-report.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { Role } from '../auth/roles.enum';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OSBB_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findAllUsers(
    @Request() req,
    @Query('includeCounts') includeCounts?: string,
  ) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.findAllUsers(scope, includeCounts === 'true');
  }

  @Get('reports')
  findAllReports(@Request() req) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.findAllReports(scope);
  }

  @Get('stats')
  getDashboardStats(@Request() req) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.getDashboardStats(scope);
  }

  @Get('analytics')
  async getAnalyticsDashboard(@Request() req) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    const [stats, commonProblems, reportsOverTime] = await Promise.all([
      this.adminService.getDashboardStats(scope),
      this.adminService.getCommonProblems(scope),
      this.adminService.getReportsOverTime(scope),
    ]);
    return { stats, commonProblems, reportsOverTime };
  }

  @Patch('reports/:id')
  updateReport(
    @Param('id') reportId: string,
    @Body(new ValidationPipe()) body: UpdateReportDto,
    @Request() req,
  ) {
    const adminUserId = req.user.sub as string;
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.updateReport(reportId, adminUserId, body, scope);
  }

  @Get('reports/export')
  findReportsForExport(
    @Request() req,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('userId') userId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('recipientId') recipientId?: string,
    @Query('status') status?: string,
  ) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.findReportsForExport(
      { dateFrom, dateTo, userId, categoryId, recipientId, status },
      scope,
    );
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserAdminDto,
    @Request() req,
  ) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.updateUser(userId, updateUserDto, scope);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') userId: string, @Request() req) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.deleteUser(userId, scope);
  }

  @Get('osbb-reports')
  getOsbbReports(@Request() req) {
    const scope = { role: req.user.role, osbbId: req.user.osbbId as string | null | undefined };
    return this.adminService.findAllReports(scope);
  }

  @Get('osbb')
findAllOsbb() {
  return this.adminService.findAllOsbb();
}
}