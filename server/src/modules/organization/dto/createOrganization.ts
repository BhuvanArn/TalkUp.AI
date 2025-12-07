import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Length, IsEmail, IsStrongPassword, IsOptional, IsString } from "class-validator";

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

    @IsOptional()
    @ApiProperty({
        description: "The Organization's name",
        example: "AdminSys819",
    })
    OrganizationName: string;

    @IsEmail()
    @ApiProperty({
        description:
        "The Organization's email address. It will be used for login and verification.",
        example: "Talkup.doe@example.com",
    })
    OrganizationEmail: string;

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
            "The Organization's password. It will be hashed before added to the database. It must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols.",
        minLength: 8,
        example: "Abcdefg1*",
    })
    OrganizationPassword: string;
}
