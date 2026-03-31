import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsEmail, IsEnum } from "class-validator";

import { OtpPurpose } from "@common/enums/OtpPurpose";

@ApiSchema({
  name: "ResendOtpRequest",
  description: "Request to resend an OTP for a given purpose",
})
export class ResendOtpDto {
  @IsEmail()
  @ApiProperty({
    description: "Email receiving the OTP",
    example: "john.doe@example.com",
  })
  email!: string;

  @IsEnum(OtpPurpose)
  @ApiProperty({
    enum: OtpPurpose,
    description: "OTP purpose",
    example: OtpPurpose.REGISTER,
  })
  purpose!: OtpPurpose;
}
