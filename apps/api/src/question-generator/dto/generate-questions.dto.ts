import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  @IsNotEmpty()
  exam!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  chapter!: string;

  @IsString()
  @IsIn(['EASY', 'MEDIUM', 'HARD', 'MIXED'])
  difficulty!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  count!: number;
}
