import { Module } from '@nestjs/common';
import { OsbbService } from './osbb.service';
import { OsbbController } from './osbb.controller';

@Module({
  controllers: [OsbbController],
  providers: [OsbbService],
})
export class OsbbModule {}
