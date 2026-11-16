
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';

import type { Response } from 'express';
import { StudentAccountsService } from './student-accounts.service';
import { ActivateStudentDto } from './dto/activate-student.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('student-accounts')
export class StudentAccountsController {
  constructor(
    private readonly studentAccountsService: StudentAccountsService,
  ) {}

  @Post('activate')
  async activateStudent(@Body() body: ActivateStudentDto) {
    return this.studentAccountsService.activateStudentAccount(body);
  }

  @Post('resolve-username')
  async resolveUsername(
    @Body() body: { username?: string },
  ) {
    const username = body?.username?.trim();

    if (
      !username ||
      username.length < 3 ||
      username.length > 50 ||
      !/^[a-zA-Z0-9._-]+$/.test(username)
    ) {
      throw new BadRequestException('Invalid username or password.');
    }

    return this.studentAccountsService.resolveStudentLoginEmail(username);
  }

  @Post('activation-codes/download')
  async downloadActivationCodes(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      schoolId?: string;
      studentIds?: string[];
    },
    @Res() response: Response,
  ) {
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      response.status(401).json({
        message: 'A valid login session is required.',
      });
      return;
    }

    if (
      !Array.isArray(body.studentIds) ||
      body.studentIds.length === 0 ||
      body.studentIds.length > 500
    ) {
      throw new BadRequestException(
        'Provide between 1 and 500 student IDs.',
      );
    }

    if (
      body.studentIds.some(
        (id) => typeof id !== 'string' || !UUID_REGEX.test(id),
      )
    ) {
      throw new BadRequestException('One or more student IDs are invalid.');
    }

    if (new Set(body.studentIds).size !== body.studentIds.length) {
      throw new BadRequestException('Duplicate student IDs were supplied.');
    }

    if (
      body.schoolId !== undefined &&
      !UUID_REGEX.test(body.schoolId)
    ) {
      throw new BadRequestException('Invalid school ID.');
    }

    const csv =
      await this.studentAccountsService.generateActivationCsv(
        match[1],
        body.studentIds,
        body.schoolId,
      );

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="student-activation-codes.csv"',
    );
    response.setHeader('Cache-Control', 'no-store, private');

    response.send(csv);
  }
}
