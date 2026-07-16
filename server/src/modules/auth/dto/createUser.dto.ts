import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  Length,
  IsEmail,
  IsStrongPassword,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

@ApiSchema({
  name: "CreateUserRequest",
  description: "Request to populate of the CreateUserDto schema",
})
export class CreateUserDto {
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: "username must contain only letters and numbers",
  })
  @ApiProperty({
    description:
      "The user's name. 3–20 characters, letters and numbers only (no spaces or symbols).",
    maxLength: 20,
    minLength: 3,
    example: "AdminSys819",
  })
  username: string;

  @IsEmail()
  @ApiProperty({
    description:
      "The user's email address. It will be used for login and verification.",
    example: "john.doe@example.com",
  })
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @Length(8, 50)
  @ApiProperty({
    description:
      "The user's password. It will be hashed before added to the database. It must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols.",
    minLength: 8,
    example: "Abcdefg1*",
  })
  password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      "The id of the organization the user belongs to. This will be a UUID",
    minLength: 1,
    example: "019b1c4a-467c-78a6-bf0f-9fd6f7aa50db",
  })
  organization_id?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      "Ignored on public signup; set only by trusted internal flows (org bootstrap, member creation).",
    minLength: 4,
    example: "user",
  })
  user_role?: string;

  @IsOptional()
  @IsString()
  @Length(4, 32)
  @ApiProperty({
    required: false,
    description:
      "Organization invite code (F2). When present, the new account is linked to the invite's organization with the invite's role.",
    example: "ABCDEFGHJKLM",
  })
  organizationCode?: string;
}
