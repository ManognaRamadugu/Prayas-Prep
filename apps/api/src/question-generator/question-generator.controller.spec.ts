import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { QuestionGeneratorService } from './question-generator.service';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';

@Controller('question-generator')
export class QuestionGeneratorController {
  constructor(
    private readonly questionGeneratorService: QuestionGeneratorService,
  ) {}

  @Post('generate')
  generateQuestions(
    @Body() body: GenerateQuestionsDto,
  ) {
    return this.questionGeneratorService.generateQuestions(
      body.exam,
      body.subject,
      body.chapter,
      body.difficulty,
      body.count,
    );
  }
}