import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Length, IsEmail, IsStrongPassword } from "class-validator";

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

  @ApiProperty({
    description: "The user's password.",
    example: "Abcdefg1*",
  })
  password: string;
}
