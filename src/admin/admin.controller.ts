import { Controller, Get, Patch, Body, Param, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Prisma } from '@prisma/client';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { Role } from 'src/auth/roles.enum';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN) 
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('users')
    findAllUsers() {
        return this.adminService.findAllUsers();
    }

    @Get('reports')
    findAllReports() {
        return this.adminService.findAllReports();
    }

    @Get('stats')
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }
    
    @Patch('reports/:id/status') 
    updateReportStatus(
        @Param('id') reportId: string,
        @Body(new ValidationPipe()) body: UpdateReportStatusDto,
        @Request() req
    ) {
        const adminUserId = req.user.sub;
        return this.adminService.updateReportStatus(reportId, body.status, body.notes, adminUserId);
    }
}