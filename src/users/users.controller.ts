import { Controller, Get, Patch, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

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
}
