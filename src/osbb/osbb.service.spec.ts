import { Test, TestingModule } from '@nestjs/testing';
import { OsbbService } from './osbb.service';

describe('OsbbService', () => {
  let service: OsbbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OsbbService],
    }).compile();

    service = module.get<OsbbService>(OsbbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
