import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export type GenerateDifficulty =
  | 'EASY'
  | 'MEDIUM'
  | 'HARD';

export type GenerateQuestionType =
  'SINGLE_CHOICE';

export class GenerateQuestionsDto {
  @IsUUID()
  @IsNotEmpty()
  conceptId!: string;

  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty!: GenerateDifficulty;

  @IsIn(['SINGLE_CHOICE'])
  questionType!: GenerateQuestionType;

  @IsInt()
  @Min(1)
  @Max(10)
  count!: number;
}
