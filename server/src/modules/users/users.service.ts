import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import {
  user,
  user_email,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";

import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { GetProfileDto } from "./dto/getProfile.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(user)
    private readonly userRepo: Repository<user>,
    @InjectRepository(user_profile)
    private readonly profileRepo: Repository<user_profile>,
    @InjectRepository(user_email)
    private readonly userEmailRepo: Repository<user_email>,
    @InjectRepository(user_phone_number)
    private readonly phoneRepo: Repository<user_phone_number>,
  ) {}

  async getProfile(user: user): Promise<GetProfileDto> {
    const p = await this.profileRepo.findOne({
      where: { user_id: user.user_id },
    });
    return this.assembleProfileView(user, p);
  }

  async updateProfile(
    userEntity: user,
    dto: UpdateProfileDto,
  ): Promise<GetProfileDto> {
    const profile = await this.ensureProfile(userEntity.user_id);

    if (dto.username !== undefined) {
      Object.assign(userEntity, { username: dto.username });
    }
    this.applyProfileDto(profile, dto);

    try {
      await this.userRepo.save(userEntity);
      await this.profileRepo.save(profile);
      return this.assembleProfileView(userEntity, profile);
    } catch (error) {
      this.logger.error(
        `updateProfile failed for ${userEntity.user_id}: ${error}`,
      );
      throw new InternalServerErrorException(
        "Internal server error while updating profile.",
      );
    }
  }

  async deleteAccount(userEntity: user): Promise<void> {
    try {
      const result = await this.userRepo.delete({ user_id: userEntity.user_id });
      if (!result.affected) {
        throw new NotFoundException("User not found.");
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `deleteAccount failed for ${userEntity.user_id}: ${error}`,
      );
      throw new InternalServerErrorException(
        "Internal server error while deleting account.",
      );
    }
  }

  private applyProfileDto(profile: user_profile, dto: UpdateProfileDto): void {
    const strOrNull = (v: string | undefined) =>
      v === undefined ? undefined : v.trim() === "" ? null : v;

    if (dto.profilePicture !== undefined) {
      profile.profile_picture =
        dto.profilePicture === "" ? null : dto.profilePicture;
    }
    if (dto.firstName !== undefined) {
      profile.first_name = strOrNull(dto.firstName) ?? null;
    }
    if (dto.lastName !== undefined) {
      profile.last_name = strOrNull(dto.lastName) ?? null;
    }
    if (dto.bio !== undefined) {
      profile.bio = strOrNull(dto.bio) ?? null;
    }
    if (dto.jobTitle !== undefined) {
      profile.job_title = strOrNull(dto.jobTitle) ?? null;
    }
    if (dto.linkedinUrl !== undefined) {
      profile.linkedin_url = strOrNull(dto.linkedinUrl) ?? null;
    }
    if (dto.avatarAccentColor !== undefined) {
      profile.avatar_accent_color =
        dto.avatarAccentColor === "" ? null : dto.avatarAccentColor;
    }
    if (dto.bannerGradient !== undefined) {
      profile.banner_gradient =
        dto.bannerGradient === "" ? null : dto.bannerGradient;
    }
    if (dto.profileVisibility !== undefined) {
      profile.profile_visibility = dto.profileVisibility;
    }
    if (dto.notificationPrefs !== undefined) {
      profile.notification_prefs = dto.notificationPrefs;
    }
  }

  private async ensureProfile(userId: string): Promise<user_profile> {
    let p = await this.profileRepo.findOne({ where: { user_id: userId } });

    if (!p) {
      p = this.profileRepo.create({
        user_id: userId,
        profile_visibility: ProfileVisibility.PUBLIC,
      });

      await this.profileRepo.save(p);
    }

    return p;
  }

  private async assembleProfileView(
    u: user,
    p: user_profile | null,
  ): Promise<GetProfileDto> {
    const emailRow = await this.userEmailRepo.findOne({
      where: { user_id: u.user_id },
    });
    const phoneRow = await this.phoneRepo.findOne({
      where: { user_id: u.user_id },
    });

    return {
      userId: u.user_id,
      username: u.username,
      email: emailRow?.email ?? null,
      phone: phoneRow?.phone_number ?? null,
      firstName: p?.first_name ?? null,
      lastName: p?.last_name ?? null,
      bio: p?.bio ?? null,
      jobTitle: p?.job_title ?? null,
      linkedinUrl: p?.linkedin_url ?? null,
      profilePicture: p?.profile_picture ?? null,
      avatarAccentColor: p?.avatar_accent_color ?? null,
      bannerGradient: p?.banner_gradient ?? null,
      profileVisibility: p?.profile_visibility ?? ProfileVisibility.PUBLIC,
      notificationPrefs: p?.notification_prefs ?? null,
    };
  }
}
