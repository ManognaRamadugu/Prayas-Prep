
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ActivateStudentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username contains invalid characters.',
  })
  username!: string;

  @IsString()
  @Matches(/^[A-Fa-f0-9]{4}(-[A-Fa-f0-9]{4}){3}$/, {
    message: 'Invalid activation code format.',
  })
  activationCode!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
