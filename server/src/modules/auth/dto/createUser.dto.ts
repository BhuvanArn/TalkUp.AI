import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Length, IsEmail, IsStrongPassword, IsOptional, IsString } from "class-validator";

@ApiSchema({
  name: "CreateUserRequest",
  description: "Request to populate of the CreateUserDto schema",
})
export class CreateUserDto {
  @Length(1, 50)
  @ApiProperty({
    description: "The user's name",
    maxLength: 50,
    minLength: 1,
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
    description: "The id of the organization the user belongs to. This will be a UUID",
    minLength: 1,
    example: "AGBDUIJ178276889",
  })
  OrganizationId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "The role of the user in the organization",
    minLength: 4,
    example: "user",
    default: "user",
  })
  userRole: string = "user";

}
