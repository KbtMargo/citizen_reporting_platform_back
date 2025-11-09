import { SetMetadata } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role } from './roles.enum';


export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
