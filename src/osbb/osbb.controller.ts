import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ValidationPipe } from '@nestjs/common';
import { OsbbService } from './osbb.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Prisma, UserRole } from '@prisma/client';
import { CreateOsbbDto } from './dto/create-osbb.dto';
import { UpdateOsbbDto } from './dto/update-osbb.dto';
import { Role } from 'src/auth/roles.enum';


@Controller('api/admin/osbb')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class OsbbController {
  constructor(private readonly osbbService: OsbbService) {}

  @Post()
  create(@Body(new ValidationPipe()) createOsbbDto: CreateOsbbDto) {
    return this.osbbService.create(createOsbbDto);
  }

  @Get()
  findAll() {
    return this.osbbService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateOsbbDto: UpdateOsbbDto) {
    return this.osbbService.update(id, updateOsbbDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.osbbService.remove(id);
  }
}