import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionGeneratorModule } from './question-generator/question-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    QuestionGeneratorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}