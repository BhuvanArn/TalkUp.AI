import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsEmail, Length, Matches } from "class-validator";

@ApiSchema({
  name: "VerifyEmailRequest",
  description: "Request to verify account email using OTP",
})
export class VerifyEmailDto {
  @IsEmail()
  @ApiProperty({
    description: "Email associated with the account",
    example: "john.doe@example.com",
  })
  email!: string;

  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: "otpCode must be a 6-digit code" })
  @ApiProperty({
    description: "6-digit OTP code",
    example: "123456",
  })
  otpCode!: string;
}
