import { Controller, Get } from '@nestjs/common';
import { RecipientsService } from './recipients.service';

@Controller('recipients')
export class RecipientsController {
  constructor(private readonly recipientsService: RecipientsService) {}

  @Get()
  findAll() {
    return this.recipientsService.findAll();
  }
}