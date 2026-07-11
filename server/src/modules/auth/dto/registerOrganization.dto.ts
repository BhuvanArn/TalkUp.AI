import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsEmail, IsString, IsStrongPassword, Length } from "class-validator";

@ApiSchema({
  name: "RegisterOrganizationRequest",
  description: "Public self-serve organization signup (F12)",
})
export class RegisterOrganizationDto {
  @IsString()
  @Length(2, 40)
  @ApiProperty({
    description: "The organization's display name (must be unique).",
    minLength: 2,
    maxLength: 40,
    example: "Acme School",
  })
  organizationName: string;

  @IsEmail()
  @ApiProperty({
    description:
      "The organization admin's email — used for login and OTP verification.",
    example: "admin@acme.example",
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
    description: "The admin's password (same policy as normal register).",
    minLength: 8,
    example: "Abcdefg1*",
  })
  password: string;
}
