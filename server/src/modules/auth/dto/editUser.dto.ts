import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Length, IsEmail, IsOptional, IsString } from "class-validator";

@ApiSchema({
  name: "EditUserRequest",
  description: "Request to edit the user infos from his profile",
})
export class EditUserDto {
  @Length(1, 50)
  @IsOptional()
  @ApiProperty({
    description: "The user's name",
    maxLength: 50,
    minLength: 1,
    example: "AdminSys819",
  })
  username: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description:
      "The user's email address. It will be used for login and verification.",
    example: "john.doe@example.com",
  })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: "The user's phone number",
    example: "+33 0767987834",
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description:
      "The user's profile picture. It will be usefull to reconize his/her",
  })
  profilePicture?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description:
      "The user's CV. It will be usefull for the IA to reconize the user activity sector and his/her competences or others important things for the interview simulation",
  })
  cv?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: "The user's activity sector",
  })
  activitySector?: string;
}
