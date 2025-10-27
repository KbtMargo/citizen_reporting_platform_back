import { Test, TestingModule } from '@nestjs/testing';
import { OsbbController } from './osbb.controller';
import { OsbbService } from './osbb.service';

describe('OsbbController', () => {
  let controller: OsbbController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OsbbController],
      providers: [OsbbService],
    }).compile();

    controller = module.get<OsbbController>(OsbbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
