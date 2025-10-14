import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get() 
  findAll() {
    return this.reportsService.findAll();
  }

}