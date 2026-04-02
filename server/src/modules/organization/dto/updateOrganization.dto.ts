import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

@ApiSchema({
  name: "UpdateOrganizationDto",
  description: "Request to update the organization with it infos",
})
export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "The Organization's name",
    example: "TalkUp",
  })
  OrganizationName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description:
      "The Organization's profile picture. It will be usefull to reconize it",
    example: "https://example.com/profile.png",
  })
  OrganizationProfilePicture?: string;
}
