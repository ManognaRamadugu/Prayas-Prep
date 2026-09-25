import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import {
  GenerateDifficulty,
  GenerateQuestionType,
  GenerateQuestionsDto,
} from './dto/generate-questions.dto';

export interface ConceptContext {
  conceptId: string;
  conceptName: string;
  conceptDescription: string | null;

  topicId: string;
  topicName: string;
  topicDescription: string | null;

  chapterId: string;
  chapterName: string;
  chapterDescription: string | null;

  curriculumSubjectId: string;

  curriculumId: string;
  curriculumName: string;
  curriculumDescription: string | null;

  subjectId: string;
  subjectName: string;
  subjectCode: string;

  examId: string;
  examName: string;
  examCode: string;

  academicLevelId: string;
  academicLevelName: string;
  academicLevelCode: string;
}

interface GeneratedOption {
  option_text: string;
  is_correct: boolean;
}

interface GeneratedQuestion {
  question_text: string;
  options: GeneratedOption[];
  explanation: string;
  hint: string;
  correct_option_index: number;
}

interface GeneratedQuestionPayload {
  questions: GeneratedQuestion[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(
    QuestionGeneratorService.name,
  );

  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI;

  private readonly model =
    process.env.OPENAI_MODEL || 'gpt-5.6-luna';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SECRET_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured.');
    }

    if (!serviceRoleKey) {
      throw new Error(
        'SUPABASE_SECRET_KEY is not configured.',
      );
    }

    if (!openaiApiKey) {
      throw new Error(
        'OPENAI_API_KEY is not configured.',
      );
    }

    this.supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  async generateQuestions(
    dto: GenerateQuestionsDto,
    generationKey: string,
  ) {
    this.assertGenerationKey(generationKey);

    let jobId: string | null = null;

    try {
      const context = await this.getConceptContext(
        dto.conceptId,
      );

      const existingQuestionTexts =
        await this.getExistingQuestionTexts(
          dto.conceptId,
        );

      const job = await this.createGenerationJob(
        dto,
      );

      jobId = job.id;

      await this.updateJob(job.id, {
        status: 'GENERATING',
        started_at: new Date().toISOString(),
        provider: 'openai',
        model: this.model,
      });

      const generated =
        await this.callOpenAI(
          context,
          dto,
          existingQuestionTexts,
        );

      await this.updateJob(job.id, {
        status: 'VALIDATING',
      });

      const drafts =
        await this.saveValidatedDrafts(
          job.id,
          context,
          dto,
          generated,
          existingQuestionTexts,
        );

      await this.updateJob(job.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        jobId: job.id,
        context,
        generatedCount: generated.questions.length,
        drafts,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown generation error';

      this.logger.error(message);

      if (jobId) {
        await this.updateJob(jobId, {
          status: 'FAILED',
          error_message: message,
        });
      }

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Question generation failed.',
      );
    }
  }

  private assertGenerationKey(
    generationKey: string,
  ): void {
    const configuredKey =
      process.env.GENERATION_ADMIN_KEY;

    if (!configuredKey) {
      throw new InternalServerErrorException(
        'GENERATION_ADMIN_KEY is not configured.',
      );
    }

    if (generationKey !== configuredKey) {
      throw new UnauthorizedException(
        'Invalid generation key.',
      );
    }
  }

  private async getConceptContext(
    conceptId: string,
  ): Promise<ConceptContext> {
    const { data: concept, error: conceptError } =
      await this.supabase
        .from('concepts')
        .select(
          'id,name,description,topic_id,is_active',
        )
        .eq('id', conceptId)
        .eq('is_active', true)
        .single();

    if (conceptError || !concept) {
      throw new BadRequestException(
        'Concept was not found or is inactive.',
      );
    }

    const { data: topic, error: topicError } =
      await this.supabase
        .from('topics')
        .select(
          'id,name,description,chapter_id,is_active',
        )
        .eq('id', concept.topic_id)
        .eq('is_active', true)
        .single();

    if (topicError || !topic) {
      throw new BadRequestException(
        'Parent topic was not found or is inactive.',
      );
    }

    const { data: chapter, error: chapterError } =
      await this.supabase
        .from('chapters')
        .select(
          'id,name,description,curriculum_subject_id,is_active',
        )
        .eq('id', topic.chapter_id)
        .eq('is_active', true)
        .single();

    if (chapterError || !chapter) {
      throw new BadRequestException(
        'Parent chapter was not found or is inactive.',
      );
    }

    const {
      data: curriculumSubject,
      error: curriculumSubjectError,
    } = await this.supabase
      .from('curriculum_subjects')
      .select(
        'id,curriculum_id,subject_id',
      )
      .eq('id', chapter.curriculum_subject_id)
      .single();

    if (
      curriculumSubjectError ||
      !curriculumSubject
    ) {
      throw new BadRequestException(
        'Curriculum-subject relationship was not found.',
      );
    }

    const { data: curriculum, error: curriculumError } =
      await this.supabase
        .from('curricula')
        .select(
          'id,name,description,exam_id,academic_level_id,is_active',
        )
        .eq('id', curriculumSubject.curriculum_id)
        .eq('is_active', true)
        .single();

    if (curriculumError || !curriculum) {
      throw new BadRequestException(
        'Curriculum was not found or is inactive.',
      );
    }

    const { data: subject, error: subjectError } =
      await this.supabase
        .from('subjects')
        .select('id,name,code,is_active')
        .eq('id', curriculumSubject.subject_id)
        .eq('is_active', true)
        .single();

    if (subjectError || !subject) {
      throw new BadRequestException(
        'Subject was not found or is inactive.',
      );
    }

    const { data: exam, error: examError } =
      await this.supabase
        .from('exams')
        .select('id,name,code,is_active')
        .eq('id', curriculum.exam_id)
        .eq('is_active', true)
        .single();

    if (examError || !exam) {
      throw new BadRequestException(
        'Exam was not found or is inactive.',
      );
    }

    const {
      data: academicLevel,
      error: academicLevelError,
    } = await this.supabase
      .from('academic_levels')
      .select('id,name,code')
      .eq('id', curriculum.academic_level_id)
      .single();

    if (academicLevelError || !academicLevel) {
      throw new BadRequestException(
        'Academic level was not found.',
      );
    }

    return {
      conceptId: concept.id,
      conceptName: concept.name,
      conceptDescription: concept.description,

      topicId: topic.id,
      topicName: topic.name,
      topicDescription: topic.description,

      chapterId: chapter.id,
      chapterName: chapter.name,
      chapterDescription: chapter.description,

      curriculumSubjectId:
        curriculumSubject.id,

      curriculumId: curriculum.id,
      curriculumName: curriculum.name,
      curriculumDescription:
        curriculum.description,

      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,

      examId: exam.id,
      examName: exam.name,
      examCode: exam.code,

      academicLevelId: academicLevel.id,
      academicLevelName:
        academicLevel.name,
      academicLevelCode:
        academicLevel.code,
    };
  }

  private async getExistingQuestionTexts(
    conceptId: string,
  ): Promise<string[]> {
    const {
      data: questionLinks,
      error: questionLinksError,
    } = await this.supabase
      .from('question_concepts')
      .select('question_id')
      .eq('concept_id', conceptId);

    if (questionLinksError) {
      throw new Error(
        `Unable to load existing question mappings: ${questionLinksError.message}`,
      );
    }

    const questionIds = (
      questionLinks ?? []
    ).map((item) => item.question_id);

    if (questionIds.length === 0) {
      return [];
    }

    const {
      data: questions,
      error: questionsError,
    } = await this.supabase
      .from('questions')
      .select('question_text')
      .in('id', questionIds);

    if (questionsError) {
      throw new Error(
        `Unable to load existing questions: ${questionsError.message}`,
      );
    }

    return (questions ?? [])
      .map((item) => item.question_text)
      .filter(
        (text): text is string =>
          typeof text === 'string' &&
          text.trim().length > 0,
      );
  }

  private async createGenerationJob(
    dto: GenerateQuestionsDto,
  ) {
    const { data, error } =
      await this.supabase
        .from('question_generation_jobs')
        .insert({
          requested_by: null,
          concept_id: dto.conceptId,
          difficulty: dto.difficulty,
          question_type: dto.questionType,
          requested_count: dto.count,
          status: 'QUEUED',
        })
        .select()
        .single();

    if (error || !data) {
      throw new Error(
        `Unable to create generation job: ${
          error?.message ?? 'Unknown error'
        }`,
      );
    }

    return data;
  }

  private async updateJob(
    jobId: string,
    values: Record<string, unknown>,
  ) {
    const { error } =
      await this.supabase
        .from('question_generation_jobs')
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

    if (error) {
      this.logger.error(
        `Unable to update generation job ${jobId}: ${error.message}`,
      );
    }
  }

  private async callOpenAI(
    context: ConceptContext,
    dto: GenerateQuestionsDto,
    existingQuestionTexts: string[],
  ): Promise<GeneratedQuestionPayload> {
    const excludedQuestions =
      existingQuestionTexts.length > 0
        ? existingQuestionTexts
            .slice(0, 20)
            .map(
              (text, index) =>
                `${index + 1}. ${text}`,
            )
            .join('\n')
        : 'None';

    const prompt = `
Generate ${dto.count} original multiple-choice questions for the following academic context.

Exam:
${context.examName} (${context.examCode})

Academic level:
${context.academicLevelName} (${context.academicLevelCode})

Curriculum:
${context.curriculumName}

Subject:
${context.subjectName} (${context.subjectCode})

Chapter:
${context.chapterName}

Topic:
${context.topicName}

Concept:
${context.conceptName}

Concept description:
${context.conceptDescription ?? 'Not provided'}

Required difficulty:
${dto.difficulty}

Required question type:
${dto.questionType}

Question requirements:
- Generate exactly ${dto.count} questions.
- Each question must directly test the specified concept.
- Questions must be appropriate for the specified exam and academic level.
- Each question must be self-contained.
- Avoid vague wording.
- Avoid trick questions based on ambiguous language.
- Use correct physics notation where necessary.
- State numerical constants such as g when they are needed.
- Each question must have exactly four options.
- Exactly one option must be correct.
- The correct option must be represented by correct_option_index using zero-based indexing.
- The explanation must clearly justify the correct answer.
- The hint must help the student think without directly giving away the answer.
- Do not use markdown tables.
- Do not include the answer in the question text.
- Do not copy or closely paraphrase an existing question.

Existing questions to avoid:
${excludedQuestions}
`;

    const response =
      await this.openai.responses.create({
        model: this.model,
        input: [
          {
            role: 'system',
            content:
              'You are an expert educational question author. Accuracy is more important than creativity. Return only the requested structured data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'generated_questions',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      question_text: {
                        type: 'string',
                      },
                      options: {
                        type: 'array',
                        items: {
                          type: 'object',
                          additionalProperties: false,
                          properties: {
                            option_text: {
                              type: 'string',
                            },
                            is_correct: {
                              type: 'boolean',
                            },
                          },
                          required: [
                            'option_text',
                            'is_correct',
                          ],
                        },
                      },
                      explanation: {
                        type: 'string',
                      },
                      hint: {
                        type: 'string',
                      },
                      correct_option_index: {
                        type: 'integer',
                      },
                    },
                    required: [
                      'question_text',
                      'options',
                      'explanation',
                      'hint',
                      'correct_option_index',
                    ],
                  },
                },
              },
              required: ['questions'],
            },
          },
        },
      });

    if (!response.output_text) {
      throw new Error(
        'OpenAI returned an empty response.',
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(
        response.output_text,
      );
    } catch {
      throw new Error(
        'OpenAI returned invalid structured output.',
      );
    }

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('questions' in parsed)
    ) {
      throw new Error(
        'OpenAI response did not contain a questions array.',
      );
    }

    const questions = (
      parsed as {
        questions: unknown;
      }
    ).questions;

    if (!Array.isArray(questions)) {
      throw new Error(
        'OpenAI response questions field is invalid.',
      );
    }

    return {
      questions:
        questions as GeneratedQuestion[],
    };
  }

  private async saveValidatedDrafts(
    jobId: string,
    context: ConceptContext,
    dto: GenerateQuestionsDto,
    generated: GeneratedQuestionPayload,
    existingQuestionTexts: string[],
  ) {
    const normalizedExisting =
      new Set(
        existingQuestionTexts.map((text) =>
          this.normalizeQuestionText(text),
        ),
      );

    const normalizedGenerated =
      new Set<string>();

    const draftRows = generated.questions.map(
      (question, index) => {
        const validation =
          this.validateQuestion(
            question,
            dto.questionType,
            dto.difficulty,
            normalizedExisting,
            normalizedGenerated,
          );

        if (validation.isValid) {
          normalizedGenerated.add(
            this.normalizeQuestionText(
              question.question_text,
            ),
          );
        }

        return {
          job_id: jobId,
          draft_order: index + 1,
          question_text:
            question.question_text.trim(),
          question_type: dto.questionType,
          difficulty: dto.difficulty,
          explanation:
            question.explanation?.trim() || null,
          hint:
            question.hint?.trim() || null,
          marks:
            context.examCode === 'JEE'
              ? 4
              : 1,
          negative_marks:
            context.examCode === 'JEE'
              ? 1
              : 0,
          generated_payload: {
            ...question,
            generation_context: {
              concept_id:
                context.conceptId,
              concept_name:
                context.conceptName,
              topic_id:
                context.topicId,
              topic_name:
                context.topicName,
              chapter_id:
                context.chapterId,
              chapter_name:
                context.chapterName,
              subject_id:
                context.subjectId,
              subject_name:
                context.subjectName,
              curriculum_id:
                context.curriculumId,
              curriculum_name:
                context.curriculumName,
              exam_id:
                context.examId,
              exam_name:
                context.examName,
            },
          },
          validation_status:
            validation.isValid
              ? 'PASSED'
              : 'FAILED',
          validation_errors:
            validation.isValid
              ? null
              : validation.errors,
          approved_question_id: null,
        };
      },
    );

    if (draftRows.length === 0) {
      throw new Error(
        'The generator returned no questions.',
      );
    }

    const { data, error } =
      await this.supabase
        .from('question_generation_drafts')
        .insert(draftRows)
        .select(
          'id,job_id,draft_order,question_text,question_type,difficulty,explanation,hint,marks,negative_marks,generated_payload,validation_status,validation_errors,approved_question_id,created_at,updated_at',
        )
        .order('draft_order', {
          ascending: true,
        });

    if (error || !data) {
      throw new Error(
        `Unable to save generation drafts: ${
          error?.message ?? 'Unknown error'
        }`,
      );
    }

    return data;
  }

  private validateQuestion(
    question: GeneratedQuestion,
    questionType: GenerateQuestionType,
    difficulty: GenerateDifficulty,
    normalizedExisting: Set<string>,
    normalizedGenerated: Set<string>,
  ): ValidationResult {
    const errors: string[] = [];

    if (questionType !== 'SINGLE_CHOICE') {
      errors.push(
        'Only SINGLE_CHOICE is supported by this generator version.',
      );
    }

    if (!['EASY', 'MEDIUM', 'HARD'].includes(
      difficulty,
    )) {
      errors.push(
        'Invalid difficulty.',
      );
    }

    if (
      typeof question.question_text !==
        'string' ||
      question.question_text.trim().length <
        10
    ) {
      errors.push(
        'Question text is missing or too short.',
      );
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length !== 4
    ) {
      errors.push(
        'SINGLE_CHOICE questions must contain exactly four options.',
      );
    }

    const correctOptions = Array.isArray(
      question.options,
    )
      ? question.options.filter(
          (option) =>
            option &&
            option.is_correct === true,
        )
      : [];

    if (correctOptions.length !== 1) {
      errors.push(
        'Exactly one option must be marked correct.',
      );
    }

    if (
      !Number.isInteger(
        question.correct_option_index,
      ) ||
      question.correct_option_index < 0 ||
      question.correct_option_index > 3
    ) {
      errors.push(
        'correct_option_index must be an integer from 0 to 3.',
      );
    }

    if (
      correctOptions.length === 1 &&
      Array.isArray(question.options)
    ) {
      const actualCorrectIndex =
        question.options.findIndex(
          (option) =>
            option?.is_correct === true,
        );

      if (
        actualCorrectIndex !==
        question.correct_option_index
      ) {
        errors.push(
          'correct_option_index does not match the option marked as correct.',
        );
      }
    }

    if (
      Array.isArray(question.options) &&
      question.options.some(
        (option) =>
          !option ||
          typeof option.option_text !==
            'string' ||
          option.option_text.trim()
            .length === 0,
      )
    ) {
      errors.push(
        'Every option must contain non-empty text.',
      );
    }

    if (
      typeof question.explanation !==
        'string' ||
      question.explanation.trim()
        .length < 10
    ) {
      errors.push(
        'Explanation is missing or too short.',
      );
    }

    if (
      typeof question.hint !==
        'string' ||
      question.hint.trim().length < 5
    ) {
      errors.push(
        'Hint is missing or too short.',
      );
    }

    const normalizedText =
      this.normalizeQuestionText(
        question.question_text ?? '',
      );

    if (normalizedExisting.has(
      normalizedText,
    )) {
      errors.push(
        'Question matches an existing question for this concept.',
      );
    }

    if (normalizedGenerated.has(
      normalizedText,
    )) {
      errors.push(
        'Duplicate question generated within this batch.',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private normalizeQuestionText(
    text: string,
  ): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[â€œâ€â€˜â€™]/g, "'")
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .trim();
  }
}


