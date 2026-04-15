import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema({
    name: "UserProfileView",
    description: "User profile view",
  })
export class GetProfileDto {
  @ApiProperty({ description: "User ID" })
  userId: string;

  @ApiProperty({ description: "Username" })
  username: string;

  @ApiProperty({ description: "Email" })
  email: string | null;

  @ApiProperty({ description: "Phone" })
  phone: string | null;

  @ApiProperty({ description: "First name" })
  firstName: string | null;

  @ApiProperty({ description: "Last name" })
  lastName: string | null;

  @ApiProperty({ description: "Bio" })
  bio: string | null;

  @ApiProperty({ description: "Job title" })
  jobTitle: string | null;

  @ApiProperty({ description: "Linkedin URL" })
  linkedinUrl: string | null;

  @ApiProperty({ description: "Profile picture (URL or data URL)" })
  profilePicture: string | null;

  @ApiProperty({ description: "Avatar accent color" })
  avatarAccentColor: string | null;

  @ApiProperty({ description: "Banner gradient" })
  bannerGradient: string | null;

  @ApiProperty({ description: "Profile visibility" })
  profileVisibility: ProfileVisibility;

  @ApiProperty({ description: "Notification preferences" })
  notificationPrefs: Record<string, boolean> | null;
}
