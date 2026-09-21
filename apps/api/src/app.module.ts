import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionGeneratorModule } from './question-generator/question-generator.module';

@Module({
  imports: [QuestionGeneratorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
