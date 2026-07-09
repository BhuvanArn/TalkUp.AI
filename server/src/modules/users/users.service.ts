import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ObjectLiteral, QueryFailedError, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

import { ProfileVisibility } from "@common/enums/ProfileVisibility";
import {
  user,
  user_email,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";
import {
  CvExtraction,
  MAX_LLM_INPUT_CHARS,
  extractWithGroq,
} from "../../common/utils/groqExtraction";

import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { GetProfileDto } from "./dto/getProfile.dto";
import { user_cv } from "@entities/userCV.entity";
import pdfParse from "pdf-parse-debugging-disabled";

/** Minimal shape of the multer file we consume (avoids depending on the global
 * Express.Multer namespace, which is not in this project's tsconfig `types`). */
export interface UploadedPdf {
  buffer: Buffer;
}

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

    @InjectRepository(user_cv)
    private user_cvRepo: Repository<user_cv>,
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
      const result = await this.userRepo.delete({
        user_id: userEntity.user_id,
      });
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

  /**
   * Find-or-update a single row keyed by user_id: updates when one exists,
   * otherwise creates and saves. Used for the one-per-user CV row.
   * Returns true when an existing row was updated, false when one was created.
   *
   * The user_id column carries a unique constraint, so two concurrent uploads
   * can both miss the findOne and race the insert. The loser hits a unique
   * violation (Postgres 23505); we swallow it and fall back to an update so the
   * row stays one-per-user instead of silently duplicating.
   */
  private async upsertByUser<E extends ObjectLiteral>(
    repo: Repository<E>,
    userId: string,
    data: QueryDeepPartialEntity<E>,
  ): Promise<boolean> {
    const existing = await repo.findOne({
      where: { user_id: userId } as never,
    });

    if (existing) {
      await repo.update({ user_id: userId } as never, data);
      return true;
    }

    try {
      const row = repo.create({ user_id: userId, ...data } as never);
      await repo.save(row);
      return false;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === "23505"
      ) {
        await repo.update({ user_id: userId } as never, data);
        return true;
      }
      throw error;
    }
  }

  async uploadCV(
    userId: string,
    file?: UploadedPdf,
  ): Promise<{ message: string }> {
    if (!file) {
      throw new BadRequestException("Upload a PDF file.");
    }

    const pdfData = await pdfParse(file.buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.length === 0) {
      throw new BadRequestException(
        "The PDF file is empty or could not be parsed.",
      );
    }

    const cvText = rawText.substring(0, MAX_LLM_INPUT_CHARS);

    const prompt = `You are a specialized CV analysis assistant. Analyze the following text extracted from a CV and return ONLY a valid JSON object (no markdown, no backticks, no comments) with exactly this structure:
      {
        "desired_job": "string or null",
        "resume": "string or null - candidate profile/summary",
        "experiences": [
          {
            "company": "string",
            "title": "string",
            "description": "string",
            "duration": "string"
          }
        ],
        "education": [
          {
            "degree": "string",
            "school_name": "string",
            "duration": "string"
          }
        ],
        "technical_skills": ["string"],
        "languages": [
          {
            "language": "string",
            "level": "string"
          }
        ]
      }

      Rules:
      - Always return valid JSON, even if the CV is incomplete or poorly formatted
      - Use null for missing fields
      - Use an empty array [] if no entries are found for a list field
      - Extract all experiences, education, skills and languages you can find
      - For durations, keep the original format from the CV (e.g. "Jan 2022 - Mar 2024")

      CV text:
      ${cvText}`;

    const data = await extractWithGroq<CvExtraction>(prompt);

    const existed = await this.upsertByUser(this.user_cvRepo, userId, {
      desired_job: data.desired_job ?? null,
      resume: data.resume ?? null,
      experiences: data.experiences ?? [],
      education: data.education ?? [],
      technical_skills: data.technical_skills ?? [],
      languages: data.languages ?? [],
    } as QueryDeepPartialEntity<user_cv>);

    this.logger.log(
      `CV ${existed ? "updated" : "created"} for user ID: ${userId}`,
    );
    return {
      message: existed ? "CV updated successfully" : "CV uploaded successfully",
    };
  }
}
