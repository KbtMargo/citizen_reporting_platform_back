import { 
  Controller, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  UseGuards, 
  Request, 
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('stats')
  getAllReportsStats() {
    return this.usersService.getAllReportsStats();
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  updateProfile(@Request() req, @Body(new ValidationPipe()) data: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.sub, data);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(AuthGuard)
  @Patch(':id/role')
  async changeUserRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body('role') role: UserRole
  ) {
    return this.usersService.changeUserRole(userId, role);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Request() req
  ) {
    return this.usersService.deleteUser(userId, req.user.sub);
  }
}