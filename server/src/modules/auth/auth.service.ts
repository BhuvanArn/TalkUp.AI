import { randomInt } from "crypto";
import { DataSource, Repository } from "typeorm";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { EventEmitter2 } from "@nestjs/event-emitter";
import * as bcrypt from "bcrypt";

import { CreateUserDto } from "./dto/createUser.dto";
import { EditUserDto } from "./dto/editUser.dto";
import { VerifyEmailDto } from "./dto/verifyEmail.dto";
import { PasswordResetRequestDto } from "./dto/passwordResetRequest.dto";
import { PasswordResetVerifyDto } from "./dto/passwordResetVerify.dto";

import { OtpPurpose } from "@common/enums/OtpPurpose";
import { UserStatus } from "@common/enums/UserStatus";
import { Otp } from "@entities/otp.entity";
import { user, user_password, user_email } from "@entities/user.entity";

import { OtpGeneratedEvent } from "./events/otp-generated.event";
import { hashPassword } from "@common/utils/passwordHasher";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type PasswordResetVerifyResult = {
  isValid: boolean;
  userId?: string;
};

const OTP_EXPIRATION_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const DUMMY_OTP_HASH = bcrypt.hashSync("000000", 10);
const PASSWORD_RESET_AUTHORIZED_PURPOSE = "PASSWORD_RESET_AUTHORIZED";
const GENERIC_RESET_VERIFY_ERROR = "Invalid or expired verification code";
const PASSWORD_RESET_REQUEST_MIN_RESPONSE_MS = 120;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(user) private userRepository: Repository<user>,
    @InjectRepository(user_password)
    private userPasswordRepository: Repository<user_password>,
    @InjectRepository(user_email)
    private userEmailRepository: Repository<user_email>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private readonly dataSource: DataSource,
    private jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<void> {
    let otpEvent: OtpGeneratedEvent | null = null;

    // Retry once when a concurrent registration causes a unique-key race.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        otpEvent = await this.dataSource.transaction(async (manager) => {
          const userRepo = manager.getRepository(user);
          const userPasswordRepo = manager.getRepository(user_password);
          const userEmailRepo = manager.getRepository(user_email);
          const otpRepo = manager.getRepository(Otp);

          const emailEntity = await userEmailRepo.findOne({
            where: { email: createUserDto.email },
          });

          if (!emailEntity) {
            const newUser = userRepo.create({
              username: createUserDto.username,
              status: UserStatus.PENDING,
            });
            const savedUser = await userRepo.save(newUser);

            await userPasswordRepo.save(
              userPasswordRepo.create({
                password: await hashPassword(createUserDto.password),
                user_id: savedUser.user_id,
              }),
            );

            await userEmailRepo.save(
              userEmailRepo.create({
                email: createUserDto.email,
                user_id: savedUser.user_id,
                is_verified: false,
              }),
            );
          } else {
            const existingUser = await userRepo
              .createQueryBuilder("user")
              .setLock("pessimistic_write")
              .where("user.user_id = :userId", { userId: emailEntity.user_id })
              .getOne();

            if (!existingUser) {
              throw new InternalServerErrorException(
                "User account data is invalid",
              );
            }

            if (existingUser.status === UserStatus.ACTIVE) {
              throw new ConflictException(
                "An account with this email already exists",
              );
            }

            existingUser.username = createUserDto.username;
            existingUser.status = UserStatus.PENDING;
            await userRepo.save(existingUser);

            const existingPassword = await userPasswordRepo.findOne({
              where: { user_id: existingUser.user_id },
            });
            const hashedPassword = await hashPassword(createUserDto.password);

            if (!existingPassword) {
              await userPasswordRepo.save(
                userPasswordRepo.create({
                  user_id: existingUser.user_id,
                  password: hashedPassword,
                }),
              );
            } else {
              existingPassword.password = hashedPassword;
              await userPasswordRepo.save(existingPassword);
            }
          }

          const existingOtp = await otpRepo
            .createQueryBuilder("otp")
            .setLock("pessimistic_write")
            .where("otp.email = :email", { email: createUserDto.email })
            .andWhere("otp.purpose = :purpose", {
              purpose: OtpPurpose.REGISTER,
            })
            .orderBy("otp.createdAt", "DESC")
            .getOne();

          const now = Date.now();
          const shouldGenerateNewOtp =
            !existingOtp ||
            existingOtp.expiresAt.getTime() <= now ||
            now - existingOtp.createdAt.getTime() >= OTP_RESEND_COOLDOWN_MS;

          if (!shouldGenerateNewOtp) {
            return null;
          }

          if (existingOtp) {
            await otpRepo.delete({
              email: createUserDto.email,
              purpose: OtpPurpose.REGISTER,
            });
          }

          const plainOtp = this.generateOtpCode();
          const codeHash = await bcrypt.hash(plainOtp, 10);

          await otpRepo.save(
            otpRepo.create({
              email: createUserDto.email,
              codeHash,
              purpose: OtpPurpose.REGISTER,
              expiresAt: this.generateOtpExpiration(),
            }),
          );

          return {
            email: createUserDto.email,
            plainOtp,
            purpose: OtpPurpose.REGISTER,
          };
        });
        break;
      } catch (error) {
        const shouldRetry = attempt === 0 && this.isPgUniqueViolation(error);
        if (!shouldRetry) {
          throw error;
        }
      }
    }

    if (otpEvent) {
      this.eventEmitter.emit("auth.otp_generated", otpEvent);
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<AuthTokens> {
    const otpEntity = await this.otpRepository.findOne({
      where: {
        email: verifyEmailDto.email,
        purpose: OtpPurpose.REGISTER,
      },
      order: {
        createdAt: "DESC",
      },
    });

    const otpIsValid = await bcrypt.compare(
      verifyEmailDto.otpCode,
      otpEntity?.codeHash ?? DUMMY_OTP_HASH,
    );

    if (!otpEntity) {
      throw new UnauthorizedException("Invalid verification code");
    }

    if (otpEntity.expiresAt.getTime() < Date.now()) {
      await this.otpRepository.delete({ id: otpEntity.id });
      throw new UnauthorizedException("Verification code expired");
    }

    if (!otpIsValid) {
      const incrementResult = await this.otpRepository
        .createQueryBuilder()
        .update(Otp)
        .set({ attempts: () => `attempts + 1` })
        .where("id = :id", { id: otpEntity.id })
        .returning(["attempts"])
        .execute();

      // Get the incremented attempts count from the query result, fallback to current attempts + 1 if not available
      const incrementedAttempts = Number(
        incrementResult.raw?.[0]?.attempts ?? otpEntity.attempts + 1,
      );

      // If incremented attempts exceed max allowed, delete the OTP entry to prevent further attempts
      if (incrementedAttempts >= MAX_OTP_ATTEMPTS) {
        await this.otpRepository.delete({ id: otpEntity.id });
      }

      throw new UnauthorizedException("Invalid verification code");
    }

    const emailEntity = await this.userEmailRepository.findOne({
      where: { email: verifyEmailDto.email },
    });

    if (!emailEntity) {
      throw new UnauthorizedException("Invalid verification code");
    }

    const userEntity = await this.userRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    if (!userEntity) {
      throw new UnauthorizedException("Invalid verification request");
    }

    const userForTokens = await this.dataSource.transaction(async (manager) => {
      const otpRepo = manager.getRepository(Otp);

      const lockedOtp = await otpRepo.findOne({
        where: { id: otpEntity.id },
        lock: { mode: "pessimistic_write" },
      });

      if (!lockedOtp) {
        throw new UnauthorizedException("Verification code already used");
      }

      if (lockedOtp.expiresAt.getTime() < Date.now()) {
        await otpRepo.delete({ id: lockedOtp.id });
        throw new UnauthorizedException("Verification code expired");
      }

      const userUpdate = await manager.update(
        user,
        { user_id: emailEntity.user_id },
        { status: UserStatus.ACTIVE },
      );
      const emailUpdate = await manager.update(
        user_email,
        { email: verifyEmailDto.email },
        { is_verified: true },
      );

      if (
        (userUpdate.affected ?? 0) === 0 ||
        (emailUpdate.affected ?? 0) === 0
      ) {
        throw new BadRequestException("Invalid verification request");
      }

      await otpRepo.delete({ id: lockedOtp.id });

      const refreshedUser = await manager.getRepository(user).findOne({
        where: { user_id: emailEntity.user_id },
      });

      if (!refreshedUser) {
        throw new InternalServerErrorException("User account data is invalid");
      }

      return refreshedUser;
    });

    return await this.createAuthTokens(userForTokens);
  }

  async resendOtp(email: string, purpose: OtpPurpose): Promise<void> {
    const existingOtp = await this.otpRepository.findOne({
      where: { email, purpose },
    });

    if (
      existingOtp &&
      Date.now() - existingOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      // Perform dummy hash comparison to prevent timing attacks
      await bcrypt.compare("000000", DUMMY_OTP_HASH);
      // nestJS doesn't have builtin exception for 429
      throw new HttpException(
        "Please wait 60 seconds before requesting a new code",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const emailEntity = await this.userEmailRepository.findOne({
      where: { email },
    });

    // Perform dummy hash comparison to prevent timing attacks
    if (!emailEntity) {
      await bcrypt.compare("000000", DUMMY_OTP_HASH);
      throw new BadRequestException("Email not found");
    }

    const userEntity = await this.userRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    if (!userEntity) {
      await bcrypt.compare("000000", DUMMY_OTP_HASH);
      throw new BadRequestException("Email not found");
    }

    if (
      purpose === OtpPurpose.REGISTER &&
      userEntity.status === UserStatus.ACTIVE
    ) {
      throw new ConflictException("Account is already active");
    }

    const plainOtp = this.generateOtpCode();
    const codeHash = await bcrypt.hash(plainOtp, 10);

    await this.dataSource.transaction(async (manager) => {
      const otpRepo = manager.getRepository(Otp);

      await otpRepo.delete({ email, purpose });
      await otpRepo.save(
        otpRepo.create({
          email,
          codeHash,
          purpose,
          expiresAt: this.generateOtpExpiration(),
        }),
      );
    });

    const event: OtpGeneratedEvent = {
      email,
      plainOtp,
      purpose,
    };
    this.eventEmitter.emit("auth.otp_generated", event);
  }

  async passwordResetRequest(
    passwordResetRequestDto: PasswordResetRequestDto,
  ): Promise<void> {
    const startedAt = Date.now();
    const emailEntity = await this.userEmailRepository.findOne({
      where: { email: passwordResetRequestDto.email },
    });

    if (!emailEntity) {
      // Keep timing consistent for unknown emails.
      await bcrypt.hash("dummy", 10);
      await this.applyMinimumResetRequestDuration(startedAt);
      return;
    }

    const plainOtp = this.generateOtpCode();
    const codeHash = await bcrypt.hash(plainOtp, 10);

    await this.dataSource.transaction(async (manager) => {
      const otpRepo = manager.getRepository(Otp);

      await otpRepo.delete({
        email: passwordResetRequestDto.email,
        purpose: OtpPurpose.RESET_PASSWORD,
      });

      await otpRepo.save(
        otpRepo.create({
          email: passwordResetRequestDto.email,
          codeHash,
          purpose: OtpPurpose.RESET_PASSWORD,
          expiresAt: this.generateOtpExpiration(),
        }),
      );
    });

    const event: OtpGeneratedEvent = {
      email: passwordResetRequestDto.email,
      plainOtp,
      purpose: OtpPurpose.RESET_PASSWORD,
    };

    this.eventEmitter.emit("auth.reset_password_requested", event);
    await this.applyMinimumResetRequestDuration(startedAt);
  }

  async passwordResetVerify(
    passwordResetVerifyDto: PasswordResetVerifyDto,
  ): Promise<string> {
    if (passwordResetVerifyDto.purpose !== OtpPurpose.RESET_PASSWORD) {
      throw new BadRequestException(GENERIC_RESET_VERIFY_ERROR);
    }

    const emailEntity = await this.userEmailRepository.findOne({
      where: { email: passwordResetVerifyDto.email },
    });

    if (!emailEntity) {
      await bcrypt.compare(passwordResetVerifyDto.code, DUMMY_OTP_HASH);
      throw new BadRequestException(GENERIC_RESET_VERIFY_ERROR);
    }

    const userEntity = await this.userRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    if (!userEntity) {
      await bcrypt.compare(passwordResetVerifyDto.code, DUMMY_OTP_HASH);
      throw new BadRequestException(GENERIC_RESET_VERIFY_ERROR);
    }

    const verifyResult = await this.dataSource.transaction(
      async (manager): Promise<PasswordResetVerifyResult> => {
        const otpRepo = manager.getRepository(Otp);
        const otpEntity = await otpRepo
          .createQueryBuilder("otp")
          .setLock("pessimistic_write")
          .where("otp.email = :email", { email: passwordResetVerifyDto.email })
          .andWhere("otp.purpose = :purpose", {
            purpose: OtpPurpose.RESET_PASSWORD,
          })
          .getOne();

        if (
          !otpEntity ||
          otpEntity.attempts >= MAX_OTP_ATTEMPTS ||
          otpEntity.expiresAt.getTime() < Date.now()
        ) {
          return { isValid: false };
        }

        const otpIsValid = await bcrypt.compare(
          passwordResetVerifyDto.code,
          otpEntity.codeHash,
        );

        if (!otpIsValid) {
          otpEntity.attempts += 1;
          await otpRepo.save(otpEntity);
          return { isValid: false };
        }

        await otpRepo.delete({ id: otpEntity.id });

        return {
          isValid: true,
          userId: userEntity.user_id,
        };
      },
    );

    if (!verifyResult.isValid || !verifyResult.userId) {
      throw new BadRequestException(GENERIC_RESET_VERIFY_ERROR);
    }

    return this.jwtService.sign(
      {
        userId: verifyResult.userId,
        purpose: PASSWORD_RESET_AUTHORIZED_PURPOSE,
        tv: userEntity.tokenVersion ?? 1,
      },
      { expiresIn: "15m" },
    );
  }

  async passwordUpdate(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(user);
      const passwordRepo = manager.getRepository(user_password);

      const foundUser = await userRepo.findOne({ where: { user_id: userId } });
      if (!foundUser) {
        throw new BadRequestException("Invalid password update request");
      }

      const passwordEntity = await passwordRepo.findOne({
        where: { user_id: userId },
      });

      if (!passwordEntity) {
        await passwordRepo.save(
          passwordRepo.create({
            user_id: userId,
            password: hashedPassword,
          }),
        );
      } else {
        passwordEntity.password = hashedPassword;
        await passwordRepo.save(passwordEntity);
      }

      await userRepo
        .createQueryBuilder()
        .update(user)
        .set({ tokenVersion: () => `"tokenVersion" + 1` })
        .where("user_id = :userId", { userId })
        .execute();
    });
  }

  async validateUser(email: string, password: string): Promise<user> {
    const emailEntity = await this.userEmailRepository.findOne({
      where: { email },
    });

    if (!emailEntity) {
      throw new UnauthorizedException("Email not found");
    }

    const passwordEntity = await this.userPasswordRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    const userEntity = await this.userRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    if (!passwordEntity || !userEntity) {
      throw new UnauthorizedException("Email not found");
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Email is not verified");
    }

    const match = await bcrypt.compare(password, passwordEntity.password);
    if (!match) {
      throw new UnauthorizedException("Invalid password");
    }

    return userEntity;
  }

  async login(user: user): Promise<AuthTokens> {
    return await this.createAuthTokens(user);
  }

  async editUser(userId: string, EditUserDto: EditUserDto) {
    const user = await this.userRepository.findOneByOrFail({
      user_id: userId,
    });
    try {
      if (EditUserDto.username) user.username = EditUserDto.username;
      // This part will be uncommented when those arguments will be added in the user's infos
      // if (EditUserDto.phone) user.phone = EditUserDto.phone;
      // if (EditUserDto.profilePicture) user.profilePicture = EditUserDto.profilePicture;
      // if (EditUserDto.cv) user.cv = EditUserDto.cv;
      // if (EditUserDto.activitySector) user.activitySector = EditUserDto.activitySector;
      if (EditUserDto.email) {
        const emailEntity = await this.userEmailRepository.findOne({
          where: { user_id: userId },
        });
        if (emailEntity) {
          emailEntity.email = EditUserDto.email;
          await this.userEmailRepository.save(emailEntity);
        }
      }
      return await this.userRepository.save(user);
    } catch {
      throw new InternalServerErrorException(
        "Internal server error while editing the user's info.",
      );
    }
  }

  async getUserById(userId: string): Promise<user | null> {
    return this.userRepository.findOne({
      where: { user_id: userId },
    });
  }

  private async createAuthTokens(userEntity: user): Promise<AuthTokens> {
    const payload = {
      userId: userEntity.user_id,
      username: userEntity.username,
      tv: userEntity.tokenVersion ?? 1,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateOtpCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private isPgUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    );
  }

  private generateOtpExpiration(): Date {
    return new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  }

  private async applyMinimumResetRequestDuration(
    startedAt: number,
  ): Promise<void> {
    const elapsed = Date.now() - startedAt;
    const remaining = PASSWORD_RESET_REQUEST_MIN_RESPONSE_MS - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}
