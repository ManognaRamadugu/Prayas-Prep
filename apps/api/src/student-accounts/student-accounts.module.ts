import { Module } from '@nestjs/common';
import { StudentAccountsController } from './student-accounts.controller';
import { StudentAccountsService } from './student-accounts.service';

@Module({
  controllers: [StudentAccountsController],
  providers: [StudentAccountsService],
  exports: [StudentAccountsService],
})
export class StudentAccountsModule {}