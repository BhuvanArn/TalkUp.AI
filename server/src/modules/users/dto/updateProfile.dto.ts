import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from "class-validator";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";

/** Max length for data URLs after client-side resize (~512 KiB string). */
const PROFILE_PICTURE_MAX_LEN = 524_288;

@ApiSchema({
  name: "UpdateProfileRequest",
  description: "Partial update of the authenticated user's profile",
})
export class UpdateProfileDto {
  @Length(1, 50)
  @IsOptional()
  @ApiPropertyOptional({ description: "Account username / handle" })
  username?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsString()
  @MaxLength(PROFILE_PICTURE_MAX_LEN)
  @ApiPropertyOptional({
    description: "Profile picture: HTTPS URL or base64 data URL; null clears",
    nullable: true,
  })
  profilePicture?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  @ApiPropertyOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  @ApiPropertyOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @ApiPropertyOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  @ApiPropertyOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  @ApiPropertyOptional()
  linkedinUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(16)
  @ApiPropertyOptional({ description: "Avatar accent (hex)" })
  avatarAccentColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @ApiPropertyOptional({ description: "CSS background for banner" })
  bannerGradient?: string;

  @IsEnum(ProfileVisibility)
  @IsOptional()
  @ApiPropertyOptional({ enum: ProfileVisibility })
  profileVisibility?: ProfileVisibility;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: "Map of notification id → enabled (e.g. { training: true })",
    type: "object",
    additionalProperties: { type: "boolean" },
  })
  notificationPrefs?: Record<string, boolean>;
}
