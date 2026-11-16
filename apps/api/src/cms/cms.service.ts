
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type QuestionInput = {
  question_text: string;
  question_type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMERICAL' | 'TRUE_FALSE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  source_type?: 'VERIFIED' | 'IMPORTED' | 'PREVIOUS_YEAR' | 'TEACHER_CREATED';
  explanation?: string;
  hint?: string;
  marks?: number;
  negative_marks?: number;
  tags?: string[];
  is_group_question?: boolean;
  topic_ids?: string[];
  options?: Array<{ option_text: string; is_correct: boolean }>;
  answer_text?: string;
};

@Injectable()
export class CmsService {
  private readonly db: SupabaseClient;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SECRET_KEY');

    if (!url || !key) {
      throw new Error('Missing backend Supabase configuration.');
    }

    this.db = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  private async authorize(token: string): Promise<string> {
    if (!token) {
      throw new UnauthorizedException('Login session required.');
    }

    let authData;

    try {
      const result = await this.db.auth.getUser(token);
      if (result.error || !result.data.user) {
        throw new UnauthorizedException('Invalid or expired login session.');
      }
      authData = result.data;
    } catch {
      throw new UnauthorizedException('Invalid or expired login session.');
    }

    const userId = authData.user.id;

    const { data: roles, error } = await this.db
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', userId);

    if (error) {
  console.error('Platform role lookup failed:', error);

  throw new InternalServerErrorException({
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

    const isSuperAdmin = (roles ?? []).some(
      (row: any) => row.roles?.name === 'SUPER_ADMIN',
    );

    if (!isSuperAdmin) {
      throw new ForbiddenException('SUPER_ADMIN access is required.');
    }

    return userId;
  }

  private async failOnError(error: any, message: string): Promise<never> {
    if (error) {
      console.error(message, error);
      throw new InternalServerErrorException(message);
    }
    throw new InternalServerErrorException(message);
  }

  async getExams(token: string) {
    await this.authorize(token);

    const { data, error } = await this.db
      .from('exams')
      .select('id,name,code,description,is_active')
      .order('name');

    if (error) await this.failOnError(error, 'Unable to load exams.');
    return data;
  }

  async getCurricula(token: string, examId?: string) {
    await this.authorize(token);

    let query = this.db
      .from('curricula')
      .select('id,exam_id,academic_level_id,name,description,is_active')
      .order('name');

    if (examId) query = query.eq('exam_id', examId);

    const { data, error } = await query;
    if (error) await this.failOnError(error, 'Unable to load curricula.');
    return data;
  }
async getGrades(token: string, curriculumId?: string) {
    await this.authorize(token);

    if (!curriculumId) {
      const { data, error } = await this.db
        .from('grades')
        .select('id,name,code,sequence,is_active')
        .eq('is_active', true)
        .order('sequence');

      if (error) {
  console.error("GET GRADES SUPABASE ERROR:", error);
  await this.failOnError(error, 'Unable to load grades.');
}
      return data ?? [];
    }

    const { data, error } = await this.db
      .from('curriculum_grades')
      .select(`
        sequence,
        grade:grades!inner(
          id,
          name,
          code,
          is_active
        )
      `)
      .eq('curriculum_id', curriculumId)
      .eq('grade.is_active', true)
      .order('sequence');

    if (error) {
      await this.failOnError(error, 'Unable to load curriculum grades.');
    }

    return (data ?? []).map((row: any) => ({
      ...row.grade,
      sequence: row.sequence,
    }));
  }


  async getSubjects(
    token: string,
    curriculumId?: string,
    gradeId?: string,
  ) {
    await this.authorize(token);

    if (gradeId && !curriculumId) {
      throw new BadRequestException(
        'Curriculum ID is required when selecting a grade.',
      );
    }

    if (curriculumId) {
      let query = this.db
        .from('curriculum_subjects')
        .select(`
          id,
          sequence,
          grade_id,
          subject:subjects(
            id,
            name,
            code,
            exam_id,
            is_active
          )
        `)
        .eq('curriculum_id', curriculumId)
        .order('sequence');

      if (gradeId) {
  query = query.or(`grade_id.eq.${gradeId},grade_id.is.null`);
}
      const { data, error } = await query;

      if (error) {
        await this.failOnError(error, 'Unable to load subjects.');
      }

      return (data ?? [])
  .filter((row: any) => row.subject?.is_active)
  .map((row: any) => ({
    ...row.subject,
    mapping_id: row.id,
    grade_id: row.grade_id,
    is_legacy_mapping: row.grade_id === null,
    sequence: row.sequence,
  }));
    }

    const { data, error } = await this.db
      .from('subjects')
      .select('id,name,code,exam_id,is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      await this.failOnError(error, 'Unable to load subjects.');
    }

    return data ?? [];
  }

  async getChapters(
    token: string,
    subjectId?: string,
    curriculumId?: string,
    gradeId?: string,
  ) {
    await this.authorize(token);

    if (gradeId && !curriculumId) {
      throw new BadRequestException(
        'Curriculum ID is required when selecting a grade.',
      );
    }

    let query = this.db
      .from('chapters')
      .select(`
        id,
        curriculum_subject_id,
        name,
        description,
        sequence,
        is_active,
        curriculum_subject:curriculum_subjects!inner(
          curriculum_id,
          subject_id,
          grade_id
        )
      `)
      .eq('is_active', true)
      .order('sequence');

    if (subjectId) {
      query = query.eq(
        'curriculum_subject.subject_id',
        subjectId,
      );
    }

    if (curriculumId) {
      query = query.eq(
        'curriculum_subject.curriculum_id',
        curriculumId,
      );
    }


    const { data, error } = await query;

    if (error) {
      await this.failOnError(error, 'Unable to load chapters.');
    }
    const filteredData = (data ?? []).filter((chapter: any) => {
  const mapping = Array.isArray(chapter.curriculum_subject)
    ? chapter.curriculum_subject[0]
    : chapter.curriculum_subject;

  return !gradeId || !mapping?.grade_id || mapping.grade_id === gradeId;
});

return filteredData;

    return data ?? [];
  }

  
  async getTopics(token: string, chapterId?: string) {
    await this.authorize(token);

    let query = this.db
      .from('topics')
      .select('id,chapter_id,name,description,sequence,is_active')
      .order('sequence');

    if (chapterId) query = query.eq('chapter_id', chapterId);

    const { data, error } = await query;
    if (error) await this.failOnError(error, 'Unable to load topics.');
    return data;
  }

  async createSubjectMapping(
    token: string,
    body: {
      exam_id: string;
      curriculum_id: string;
      grade_id: string;
      name: string;
      code: string;
      sequence?: number;
    },
  ) {
    await this.authorize(token);

    const name = body.name?.trim();
    const code = body.code?.trim().toUpperCase();

    if (!body.exam_id || !body.curriculum_id || !body.grade_id || !name || !code) {
      throw new BadRequestException(
        'Exam, curriculum, grade, subject name and code are required.',
      );
    }

    const sequence = body.sequence ?? 1;
    if (!Number.isInteger(sequence) || sequence < 1) {
      throw new BadRequestException('Sequence must be a positive integer.');
    }

    // Verify that the curriculum belongs to the selected exam.
    const { data: curriculum, error: curriculumError } = await this.db
      .from('curricula')
      .select('id, exam_id')
      .eq('id', body.curriculum_id)
      .maybeSingle();

    if (curriculumError) {
      await this.failOnError(curriculumError, 'Unable to verify curriculum.');
    }
    if (!curriculum || curriculum.exam_id !== body.exam_id) {
      throw new BadRequestException(
        'The selected curriculum does not belong to this exam.',
      );
    }

    // Verify that this grade is assigned to the curriculum.
    const { data: gradeMapping, error: gradeError } = await this.db
      .from('curriculum_grades')
      .select('id')
      .eq('curriculum_id', body.curriculum_id)
      .eq('grade_id', body.grade_id)
      .maybeSingle();

    if (gradeError) {
      await this.failOnError(gradeError, 'Unable to verify curriculum grade.');
    }
    if (!gradeMapping) {
      throw new BadRequestException(
        'The selected grade is not assigned to this curriculum.',
      );
    }

    // Reuse the subject if its exam-specific code already exists.
    let { data: subject, error: subjectError } = await this.db
      .from('subjects')
      .select('id')
      .eq('exam_id', body.exam_id)
      .eq('code', code)
      .maybeSingle();

    if (subjectError) {
      await this.failOnError(subjectError, 'Unable to find subject.');
    }

    if (!subject) {
      const { data: createdSubject, error: createError } = await this.db
        .from('subjects')
        .insert({
          exam_id: body.exam_id,
          name,
          code,
          display_order: sequence,
          is_active: true,
        })
        .select('id')
        .single();

      if (createError) {
        if (createError.code === '23505') {
          throw new ConflictException(
            'A subject with this code already exists for this exam. Refresh and try again.',
          );
        }
        await this.failOnError(createError, 'Unable to create subject.');
      }

      subject = createdSubject;
      if (!subject) {
  throw new NotFoundException('Unable to find or create subject.');
}
    }

    // Do not duplicate an existing grade-specific mapping.
    const { data: existingMapping, error: mappingFindError } = await this.db
      .from('curriculum_subjects')
      .select('id')
      .eq('curriculum_id', body.curriculum_id)
      .eq('grade_id', body.grade_id)
      .eq('subject_id', subject.id)
      .maybeSingle();

    if (mappingFindError) {
      await this.failOnError(mappingFindError, 'Unable to check subject mapping.');
    }

    if (existingMapping) {
      throw new ConflictException(
        'This subject is already mapped to the selected grade.',
      );
    }

    const { data: mapping, error: mappingError } = await this.db
      .from('curriculum_subjects')
      .insert({
        curriculum_id: body.curriculum_id,
        subject_id: subject.id,
        grade_id: body.grade_id,
        sequence,
      })
      .select('id,curriculum_id,subject_id,grade_id,sequence')
      .single();

    if (mappingError) {
      if (mappingError.code === '23505') {
        throw new ConflictException('This subject mapping already exists.');
      }
      await this.failOnError(mappingError, 'Unable to map subject to grade.');
    }

    return { subject_id: subject.id, mapping };
  }

  async createChapter(
    token: string,
    body: {
      curriculum_subject_id: string;
      name: string;
      description?: string;
      sequence?: number;
    },
  ) {
    await this.authorize(token);

    const name = body.name?.trim();
    if (!body.curriculum_subject_id || !name) {
      throw new BadRequestException('Subject mapping and chapter name are required.');
    }

    const { data: mapping, error: mappingError } = await this.db
      .from('curriculum_subjects')
      .select('id')
      .eq('id', body.curriculum_subject_id)
      .maybeSingle();

    if (mappingError) {
      await this.failOnError(mappingError, 'Unable to verify subject mapping.');
    }
    if (!mapping) throw new NotFoundException('Subject mapping not found.');

    const sequence = body.sequence ?? 1;
    if (!Number.isInteger(sequence) || sequence < 1) {
      throw new BadRequestException('Sequence must be a positive integer.');
    }

    const { data, error } = await this.db
      .from('chapters')
      .insert({
        curriculum_subject_id: body.curriculum_subject_id,
        name,
        description: body.description?.trim() || null,
        sequence,
        is_active: true,
      })
      .select('id,curriculum_subject_id,name,description,sequence,is_active')
      .single();

    if (error?.code === '23505') {
      throw new ConflictException('This chapter already exists for the subject.');
    }
    if (error) await this.failOnError(error, 'Unable to create chapter.');

    return data;
  }

  async updateChapter(
    token: string,
    id: string,
    body: {
      name?: string;
      description?: string;
      sequence?: number;
      is_active?: boolean;
    },
  ) {
    await this.authorize(token);

    const update: Record<string, any> = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) throw new BadRequestException('Chapter name cannot be empty.');
      update.name = body.name.trim();
    }
    if (body.description !== undefined) update.description = body.description.trim() || null;
    if (body.sequence !== undefined) {
      if (!Number.isInteger(body.sequence) || body.sequence < 1) {
        throw new BadRequestException('Sequence must be a positive integer.');
      }
      update.sequence = body.sequence;
    }
    if (body.is_active !== undefined) update.is_active = body.is_active;

    if (!Object.keys(update).length) {
      throw new BadRequestException('No chapter changes provided.');
    }

    const { data, error } = await this.db
      .from('chapters')
      .update(update)
      .eq('id', id)
      .select('id,curriculum_subject_id,name,description,sequence,is_active')
      .maybeSingle();

    if (error?.code === '23505') {
      throw new ConflictException('A chapter with this name already exists.');
    }
    if (error) await this.failOnError(error, 'Unable to update chapter.');
    if (!data) throw new NotFoundException('Chapter not found.');

    return data;
  }

  async createTopic(
    token: string,
    body: {
      chapter_id: string;
      name: string;
      description?: string;
      sequence?: number;
    },
  ) {
    await this.authorize(token);

    const name = body.name?.trim();
    if (!body.chapter_id || !name) {
      throw new BadRequestException('Chapter and topic name are required.');
    }

    const { data: chapter, error: chapterError } = await this.db
      .from('chapters')
      .select('id')
      .eq('id', body.chapter_id)
      .maybeSingle();

    if (chapterError) {
      await this.failOnError(chapterError, 'Unable to verify chapter.');
    }
    if (!chapter) throw new NotFoundException('Chapter not found.');

    const sequence = body.sequence ?? 1;
    if (!Number.isInteger(sequence) || sequence < 1) {
      throw new BadRequestException('Sequence must be a positive integer.');
    }

    const { data, error } = await this.db
      .from('topics')
      .insert({
        chapter_id: body.chapter_id,
        name,
        description: body.description?.trim() || null,
        sequence,
        is_active: true,
      })
      .select('id,chapter_id,name,description,sequence,is_active')
      .single();

    if (error?.code === '23505') {
      throw new ConflictException('This topic already exists in the chapter.');
    }
    if (error) await this.failOnError(error, 'Unable to create topic.');

    return data;
  }

  async updateTopic(
    token: string,
    id: string,
    body: {
      name?: string;
      description?: string;
      sequence?: number;
      is_active?: boolean;
    },
  ) {
    await this.authorize(token);

    const update: Record<string, any> = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) throw new BadRequestException('Topic name cannot be empty.');
      update.name = body.name.trim();
    }
    if (body.description !== undefined) update.description = body.description.trim() || null;
    if (body.sequence !== undefined) {
      if (!Number.isInteger(body.sequence) || body.sequence < 1) {
        throw new BadRequestException('Sequence must be a positive integer.');
      }
      update.sequence = body.sequence;
    }
    if (body.is_active !== undefined) update.is_active = body.is_active;

    if (!Object.keys(update).length) {
      throw new BadRequestException('No topic changes provided.');
    }

    const { data, error } = await this.db
      .from('topics')
      .update(update)
      .eq('id', id)
      .select('id,chapter_id,name,description,sequence,is_active')
      .maybeSingle();

    if (error?.code === '23505') {
      throw new ConflictException('A topic with this name already exists in the chapter.');
    }
    if (error) await this.failOnError(error, 'Unable to update topic.');
    if (!data) throw new NotFoundException('Topic not found.');

    return data;
  }


  async getQuestions(
    token: string,
    filters: { topicId?: string; status?: string; search?: string },
  ) {
    await this.authorize(token);

    let query = this.db
      .from('questions')
      .select(`
        id,
        question_text,
        question_type,
        difficulty,
        marks,
        negative_marks,
        status,
        source_type,
        created_at,
        question_topics(topic_id)
      `)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
      query = query.ilike('question_text', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) await this.failOnError(error, 'Unable to load questions.');

    if (!filters.topicId) return data;

    return (data ?? []).filter((question: any) =>
      question.question_topics?.some(
        (link: any) => link.topic_id === filters.topicId,
      ),
    );
  }

  async getQuestion(token: string, id: string) {
    await this.authorize(token);

    const { data, error } = await this.db
      .from('questions')
      .select(`
        *,
        question_options(id,option_text,option_order,is_correct),
        question_answers(id,answer_text),
        question_topics(topic_id)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) await this.failOnError(error, 'Unable to load question.');
    if (!data) throw new NotFoundException('Question not found.');

    return data;
  }

  private validateQuestion(input: QuestionInput) {
    if (!input.question_text?.trim()) {
      throw new BadRequestException('Question text is required.');
    }

    const allowedTypes = [
      'SINGLE_CHOICE',
      'MULTIPLE_CHOICE',
      'NUMERICAL',
      'TRUE_FALSE',
    ];

    if (!allowedTypes.includes(input.question_type)) {
      throw new BadRequestException('Invalid question type.');
    }

    if (!['EASY', 'MEDIUM', 'HARD'].includes(input.difficulty)) {
      throw new BadRequestException('Invalid difficulty.');
    }

    if (
      input.marks !== undefined &&
      (!Number.isFinite(input.marks) || input.marks < 0)
    ) {
      throw new BadRequestException('Invalid marks.');
    }

    if (
      input.negative_marks !== undefined &&
      (!Number.isFinite(input.negative_marks) || input.negative_marks < 0)
    ) {
      throw new BadRequestException('Invalid negative marks.');
    }

    if (
      input.question_type === 'SINGLE_CHOICE' ||
      input.question_type === 'MULTIPLE_CHOICE'
    ) {
      const options = input.options ?? [];
      const correct = options.filter((option) => option.is_correct);

      if (options.length < 2 || correct.length === 0) {
        throw new BadRequestException(
          'Provide at least two options and mark the correct answer.',
        );
      }

      if (
        input.question_type === 'SINGLE_CHOICE' &&
        correct.length !== 1
      ) {
        throw new BadRequestException(
          'Single-choice questions require exactly one correct option.',
        );
      }
    } else if (!input.answer_text?.trim()) {
      throw new BadRequestException('An answer is required for this question type.');
    }
  }

  async createQuestion(token: string, input: QuestionInput) {
    const userId = await this.authorize(token);
    this.validateQuestion(input);

    const topicIds = [...new Set(input.topic_ids ?? [])];

    if (!topicIds.length) {
      throw new BadRequestException('Select at least one topic.');
    }

    const { data: topics, error: topicError } = await this.db
      .from('topics')
      .select('id')
      .in('id', topicIds);

    if (topicError) await this.failOnError(topicError, 'Unable to verify topics.');
    if (!topics || topics.length !== topicIds.length) {
      throw new BadRequestException('One or more selected topics are invalid.');
    }

    const { data: question, error } = await this.db
      .from('questions')
      .insert({
        question_text: input.question_text.trim(),
        question_type: input.question_type,
        difficulty: input.difficulty,
        source_type: input.source_type ?? 'VERIFIED',
        explanation: input.explanation ?? null,
        hint: input.hint ?? null,
        marks: input.marks ?? 1,
        negative_marks: input.negative_marks ?? 0,
        tags: input.tags ?? [],
        is_group_question: input.is_group_question ?? false,
        status: 'DRAFT',
        is_active: false,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) {
  console.error('Question creation failed:', error);
  throw new InternalServerErrorException(
    'Unable to create question.',
  );
}

if (!question) {
  throw new InternalServerErrorException(
    'Question was not returned after creation.',
  );
}

const questionId = question.id;
    try {
      if (input.options?.length) {
        const { error: optionError } = await this.db
          .from('question_options')
          .insert(
            input.options.map((option, index) => ({
              question_id: questionId,
              option_text: option.option_text.trim(),
              option_order: index + 1,
              is_correct: option.is_correct,
            })),
          );

        if (optionError) throw optionError;
      }

      if (input.answer_text?.trim()) {
        const { error: answerError } = await this.db
          .from('question_answers')
          .insert({
            question_id: questionId,
            answer_text: input.answer_text.trim(),
          });

        if (answerError) throw answerError;
      }

      const { error: linkError } = await this.db
        .from('question_topics')
        .insert(
          topicIds.map((topicId) => ({
            question_id: questionId,
            topic_id: topicId,
          })),
        );

      if (linkError) throw linkError;

      return { id: questionId, status: 'DRAFT' };
    } catch (saveError) {
      await this.db.from('questions').delete().eq('id', questionId);
      console.error('Question detail save failed:', saveError);
      throw new InternalServerErrorException(
        'Question could not be saved. Changes were rolled back.',
      );
    }
  }
    async bulkImportQuestions(token: string, questions: QuestionInput[]) {
    const userId = await this.authorize(token);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('No questions provided for import.');
    }

    if (questions.length > 500) {
      throw new BadRequestException(
        'A maximum of 500 questions can be imported at once.',
      );
    }

    const allTopicIds = new Set<string>();

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];

      try {
        this.validateQuestion(question);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw new BadRequestException(
            `Row ${index + 2}: ${error.message}`,
          );
        }
        throw error;
      }

      const topicIds = [...new Set(question.topic_ids ?? [])];

      if (topicIds.length === 0) {
        throw new BadRequestException(
          `Row ${index + 2}: At least one topic is required.`,
        );
      }

      topicIds.forEach((id) => allTopicIds.add(id));

      question.topic_ids = topicIds;

      if (
        question.source_type &&
        ![
          'VERIFIED',
          'IMPORTED',
          'PREVIOUS_YEAR',
          'TEACHER_CREATED',
        ].includes(question.source_type)
      ) {
        throw new BadRequestException(
          `Row ${index + 2}: Invalid source type for bulk import.`,
        );
      }

      question.source_type = question.source_type ?? 'IMPORTED';
    }

    const topicIds = [...allTopicIds];

    const { data: topics, error: topicError } = await this.db
      .from('topics')
      .select('id')
      .in('id', topicIds);

    if (topicError) {
      await this.failOnError(
        topicError,
        'Unable to verify question topics.',
      );
    }

    if (!topics || topics.length !== topicIds.length) {
      throw new BadRequestException(
        'One or more uploaded questions contain invalid topic IDs.',
      );
    }

    const { data, error } = await this.db.rpc('bulk_import_questions', {
      p_questions: questions,
      p_created_by: userId,
    });

    if (error) {
      console.error('Bulk question import failed:', error);
      throw new BadRequestException(
        'Bulk import failed. No questions were imported. Please check the uploaded data.',
      );
    }

    return data;
  }

  async updateQuestion(token: string, id: string, input: QuestionInput) {
    await this.authorize(token);
    this.validateQuestion(input);

    const { data: existing, error: findError } = await this.db
      .from('questions')
      .select('id,status,version')
      .eq('id', id)
      .maybeSingle();

    if (findError) await this.failOnError(findError, 'Unable to find question.');
    if (!existing) throw new NotFoundException('Question not found.');
    if (existing.status === 'PUBLISHED') {
      throw new BadRequestException(
        'Published questions cannot be edited directly. Create a new version first.',
      );
    }

    const { error } = await this.db
      .from('questions')
      .update({
        question_text: input.question_text.trim(),
        question_type: input.question_type,
        difficulty: input.difficulty,
        explanation: input.explanation ?? null,
        hint: input.hint ?? null,
        marks: input.marks ?? 1,
        negative_marks: input.negative_marks ?? 0,
        tags: input.tags ?? [],
        is_group_question: input.is_group_question ?? false,
      })
      .eq('id', id);

    if (error) await this.failOnError(error, 'Unable to update question.');

    return { id, updated: true };
  }

  async submitReview(token: string, id: string) {
    await this.authorize(token);

    const { data, error } = await this.db
      .from('questions')
      .update({ status: 'PENDING_REVIEW' })
      .eq('id', id)
      .eq('status', 'DRAFT')
      .select('id')
      .maybeSingle();

    if (error) await this.failOnError(error, 'Unable to submit question.');
    if (!data) {
      throw new BadRequestException('Only draft questions can be submitted.');
    }

    return { id, status: 'PENDING_REVIEW' };
  }

  async reviewQuestion(
    token: string,
    id: string,
    body: { decision: 'APPROVED' | 'REJECTED' | 'RETURNED'; comments?: string },
  ) {
    const userId = await this.authorize(token);

    if (!['APPROVED', 'REJECTED', 'RETURNED'].includes(body.decision)) {
      throw new BadRequestException('Invalid review decision.');
    }

    const { data: question, error: findError } = await this.db
      .from('questions')
      .select('id')
      .eq('id', id)
      .eq('status', 'PENDING_REVIEW')
      .maybeSingle();

    if (findError) await this.failOnError(findError, 'Unable to find question.');
    if (!question) throw new NotFoundException('Pending question not found.');

    const { error: reviewError } = await this.db
      .from('question_reviews')
      .insert({
        question_id: id,
        reviewer_id: userId,
        decision: body.decision,
        comments: body.comments ?? null,
      });

    if (reviewError) {
      await this.failOnError(reviewError, 'Unable to save review.');
    }

    const nextStatus =
      body.decision === 'APPROVED'
        ? 'APPROVED'
        : body.decision === 'REJECTED'
          ? 'REJECTED'
          : 'DRAFT';

    const { error } = await this.db
      .from('questions')
      .update({ status: nextStatus, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) await this.failOnError(error, 'Unable to update review status.');

    return { id, status: nextStatus };
  }

  async publishQuestion(token: string, id: string) {
    await this.authorize(token);

    const { data, error } = await this.db
      .from('questions')
      .update({
        status: 'PUBLISHED',
        is_active: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'APPROVED')
      .select('id')
      .maybeSingle();

    if (error) await this.failOnError(error, 'Unable to publish question.');
    if (!data) {
      throw new BadRequestException(
        'Only approved questions can be published.',
      );
    }

    return { id, status: 'PUBLISHED' };
  }
}
