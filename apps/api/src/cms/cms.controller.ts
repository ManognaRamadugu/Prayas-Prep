
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CmsService } from './cms.service';

@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  private token(header?: string) {
    const match = header?.match(/^Bearer\s+(\S+)$/i);
    return match?.[1] ?? '';
  }

  @Get('grades')
  getGrades(
    @Headers('authorization') auth: string,
    @Query('curriculumId') curriculumId?: string,
  ) {
    return this.cms.getGrades(this.token(auth), curriculumId);
  }

  @Get('subjects')
  getSubjects(
    @Headers('authorization') auth: string,
    @Query('curriculumId') curriculumId?: string,
    @Query('gradeId') gradeId?: string,
  ) {
    return this.cms.getSubjects(this.token(auth), curriculumId, gradeId);
  }

  @Get('chapters')
  getChapters(
    @Headers('authorization') auth: string,
    @Query('subjectId') subjectId?: string,
    @Query('curriculumId') curriculumId?: string,
    @Query('gradeId') gradeId?: string,
  ) {
    return this.cms.getChapters(
      this.token(auth),
      subjectId,
      curriculumId,
      gradeId,
    );
  }

  @Get('exams')
  getExams(@Headers('authorization') auth: string) {
    return this.cms.getExams(this.token(auth));
  }

  @Get('curricula')
  getCurricula(
    @Headers('authorization') auth: string,
    @Query('examId') examId?: string,
  ) {
    return this.cms.getCurricula(this.token(auth), examId);
  }

  @Get('topics')
  getTopics(
    @Headers('authorization') auth: string,
    @Query('chapterId') chapterId?: string,
  ) {
    return this.cms.getTopics(this.token(auth), chapterId);
  }

  @Get('questions')
  getQuestions(
    @Headers('authorization') auth: string,
    @Query('topicId') topicId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.cms.getQuestions(this.token(auth), {
      topicId,
      status,
      search,
    });
  }

  @Get('questions/:id')
  getQuestion(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    return this.cms.getQuestion(this.token(auth), id);
  }

  @Post('questions')
  createQuestion(
    @Headers('authorization') auth: string,
    @Body() body: any,
  ) {
    return this.cms.createQuestion(this.token(auth), body);
  }

  @Post('questions/bulk-import')
  bulkImportQuestions(
    @Headers('authorization') auth: string,
    @Body() body: { questions: any[] },
  ) {
    return this.cms.bulkImportQuestions(
      this.token(auth),
      body?.questions,
    );
  }

  @Patch('questions/:id')
  updateQuestion(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.cms.updateQuestion(this.token(auth), id, body);
  }

  @Post('questions/:id/submit-review')
  submitReview(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    return this.cms.submitReview(this.token(auth), id);
  }

  @Post('questions/:id/review')
  reviewQuestion(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: {
      decision: 'APPROVED' | 'REJECTED' | 'RETURNED';
      comments?: string;
    },
  ) {
    return this.cms.reviewQuestion(this.token(auth), id, body);
  }

  @Post('questions/:id/publish')
  publishQuestion(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    return this.cms.publishQuestion(this.token(auth), id);
  }

  // Syllabus management

  @Post('syllabus/subjects')
  createSubjectMapping(
    @Headers('authorization') auth: string,
    @Body() body: {
      exam_id: string;
      curriculum_id: string;
      grade_id: string;
      name: string;
      code: string;
      sequence?: number;
    },
  ) {
    return this.cms.createSubjectMapping(this.token(auth), body);
  }

  @Post('syllabus/chapters')
  createChapter(
    @Headers('authorization') auth: string,
    @Body() body: {
      curriculum_subject_id: string;
      name: string;
      description?: string;
      sequence?: number;
    },
  ) {
    return this.cms.createChapter(this.token(auth), body);
  }

  @Patch('syllabus/chapters/:id')
  updateChapter(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      sequence?: number;
      is_active?: boolean;
    },
  ) {
    return this.cms.updateChapter(this.token(auth), id, body);
  }

  @Post('syllabus/topics')
  createTopic(
    @Headers('authorization') auth: string,
    @Body() body: {
      chapter_id: string;
      name: string;
      description?: string;
      sequence?: number;
    },
  ) {
    return this.cms.createTopic(this.token(auth), body);
  }

  @Patch('syllabus/topics/:id')
  updateTopic(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      sequence?: number;
      is_active?: boolean;
    },
  ) {
    return this.cms.updateTopic(this.token(auth), id, body);
  }
}
