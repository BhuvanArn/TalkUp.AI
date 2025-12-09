import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

@ApiSchema({
  name: "CreateOrganizationRequest",
  description: "Request to create the organization with it infos",
})
export class CreateOrganizationDto {
  @IsString()
  @ApiProperty({
    description: "The id of the organization. This will be a UUID",
    minLength: 1,
    example: "AGBDUIJ178276889",
  })
  OrganizationId?: string;

  @IsString()
  @ApiProperty({
    description: "The Organization's name",
    example: "AdminSys819",
  })
  OrganizationName: string;

  @IsString()
  @IsEmail()
  @ApiProperty({
    description:
      "The Organization's email address. It will be used for login and verification.",
    example: "Talkup.doe@example.com",
  })
  OrganizationEmail: string;
}
