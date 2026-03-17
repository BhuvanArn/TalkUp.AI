import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Equals, IsEmail, IsEnum, Length, Matches } from "class-validator";

import { OtpPurpose } from "@common/enums/OtpPurpose";

@ApiSchema({
  name: "PasswordResetVerifyRequest",
  description: "Verify password-reset OTP and get a short-lived reset token",
})
export class PasswordResetVerifyDto {
  @IsEmail()
  @ApiProperty({
    description: "Account email address",
    example: "john.doe@example.com",
  })
  email!: string;

  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: "code must be a 6-digit code" })
  @ApiProperty({
    description: "6-digit reset OTP code",
    example: "123456",
  })
  code!: string;

  @IsEnum(OtpPurpose)
  @Equals(OtpPurpose.RESET_PASSWORD)
  @ApiProperty({
    enum: [OtpPurpose.RESET_PASSWORD],
    description: "OTP purpose, must be RESET_PASSWORD",
    example: OtpPurpose.RESET_PASSWORD,
  })
  purpose!: OtpPurpose.RESET_PASSWORD;
}
