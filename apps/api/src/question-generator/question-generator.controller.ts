import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { QuestionGeneratorService } from './question-generator.service';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';

@Controller('question-generator')
export class QuestionGeneratorController {
  constructor(
    private readonly questionGeneratorService: QuestionGeneratorService,
  ) {}

  @Post('generate')
  async generateQuestions(
    @Headers('x-generation-key')
    generationKey: string | undefined,

    @Body()
    body: GenerateQuestionsDto,
  ) {
    if (!generationKey) {
      throw new UnauthorizedException(
        'Generation key is required.',
      );
    }

    return this.questionGeneratorService.generateQuestions(
      body,
      generationKey,
    );
  }
}