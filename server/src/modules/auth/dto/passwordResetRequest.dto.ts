import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

@ApiSchema({
  name: "PasswordResetRequest",
  description: "Request a password reset OTP for an email address",
})
export class PasswordResetRequestDto {
  @IsEmail()
  @ApiProperty({
    description: "Account email address",
    example: "john.doe@example.com",
  })
  email!: string;
}
