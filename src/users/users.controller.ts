import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @UseGuards(AuthGuard) 
    @Get('me')
    getProfile(@Request() req) {
        const userId = req.user.sub; 
        return this.usersService.findById(userId);
    }
}