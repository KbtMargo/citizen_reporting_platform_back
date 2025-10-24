// import { Controller, Get, UseGuards, Request } from '@nestjs/common';
// import { UsersService } from './users.service';
// import { AuthGuard } from '../auth/auth.guard';

// @Controller('api/users')
// export class UsersController {
//     constructor(private usersService: UsersService) {}

//     @UseGuards(AuthGuard) 
//     @Get('me')
//     getProfile(@Request() req) {
//         const userId = req.user.sub; 
//         return this.usersService.findById(userId);
//     }
// }


import { Controller, Get, Patch, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common'; // <-- Додали Patch, Body, ValidationPipe
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto'; // <-- Імпортуємо DTO

@Controller('api/users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @UseGuards(AuthGuard)
    @Get('me')
    getProfile(@Request() req) {
        return this.usersService.findById(req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Get('me/stats')
    getUserStats(@Request() req) {
        return this.usersService.getUserStats(req.user.sub);
    }

    @UseGuards(AuthGuard)
    @Patch('me')
    updateProfile(
        @Request() req,
        @Body(new ValidationPipe()) data: UpdateUserDto 
    ) {
        const userId = req.user.sub;
        return this.usersService.updateProfile(userId, data);
    }
}