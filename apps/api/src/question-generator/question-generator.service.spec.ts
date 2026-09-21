import { Test, TestingModule } from '@nestjs/testing';
import { QuestionGeneratorService } from './question-generator.service';

describe('QuestionGeneratorService', () => {
  let service: QuestionGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionGeneratorService],
    }).compile();

    service = module.get<QuestionGeneratorService>(QuestionGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
