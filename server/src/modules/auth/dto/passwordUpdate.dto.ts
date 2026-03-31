import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsStrongPassword, Length } from "class-validator";

@ApiSchema({
  name: "PasswordUpdateRequest",
  description: "Update account password using a validated reset token",
})
export class PasswordUpdateDto {
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
      "The new account password. It must contain uppercase, lowercase, number, and symbol.",
    example: "Abcdefg1*",
    minLength: 8,
  })
  newPassword!: string;
}
