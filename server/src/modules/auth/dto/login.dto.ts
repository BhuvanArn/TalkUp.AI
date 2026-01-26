import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsStrongPassword,
  Length,
} from "class-validator";

@ApiSchema({
  name: "User login",
  description: "Request for the user login",
})
export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: "The user's email address for login.",
    example: "john.doe@example.com",
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })

  @ApiProperty({
    description: "The user's password.",
    example: "Abcdefg1*",
  })
  password: string;
}

