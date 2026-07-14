import { randomInt, randomUUID } from "crypto";
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from "typeorm";

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
import { VerifyEmailDto } from "./dto/verifyEmail.dto";
import { PasswordResetRequestDto } from "./dto/passwordResetRequest.dto";
import { PasswordResetVerifyDto } from "./dto/passwordResetVerify.dto";
import { RegisterOrganizationDto } from "./dto/registerOrganization.dto";

import { buildAdminUsername } from "@common/utils/buildAdminUsername";
import { OtpPurpose } from "@common/enums/OtpPurpose";
import { UserStatus } from "@common/enums/UserStatus";
import { Otp } from "@entities/otp.entity";
import { user, user_password, user_email } from "@entities/user.entity";
import { organization_invite } from "@entities/organizationInvite.entity";
import { OrganizationInviteStatus } from "@common/enums/OrganizationInviteStatus";

import { OtpGeneratedEvent } from "./events/otp-generated.event";
import { hashPassword } from "@common/utils/passwordHasher";
import { OrganizationUserRole } from "@common/enums/organizationUserRole";
import { Organization } from "@entities/organization.entity";
import { ITokenStorage } from "@common/interfaces/token-storage";
import { getUserOrganizationId } from "@common/utils/organizationUser.util";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_SECRET,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "@common/constants/auth.constants";

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
// Precomputed bcrypt hash used to keep login timing constant on the
// email-not-found / missing-row paths (see validateUser).
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password", 10);
const PASSWORD_RESET_AUTHORIZED_PURPOSE = "PASSWORD_RESET_AUTHORIZED";
const GENERIC_RESET_VERIFY_ERROR = "Invalid or expired verification code";
// Single generic login failure message. Distinct messages for
// email-not-found / wrong-password / unverified leak which accounts exist.
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const PASSWORD_RESET_REQUEST_MIN_RESPONSE_MS = 120;
// Floor every resendOtp response to the same duration so the hit path (bcrypt
// hash + DB write + emit) is not timing-distinguishable from the silent miss
// paths (which skip the write). Set at/above the real send cost, matching the
// password-reset envelope. Without this floor, response latency still leaks
// which addresses exist even though status/body no longer do.
const OTP_RESEND_MIN_RESPONSE_MS = 120;

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
    private readonly tokenStorage: ITokenStorage,
  ) {}

  /**
   * @param trusted - When false (default), public signup ignores `organization_id`
   * and `user_role`, creating a standalone user with role `none`. When true, used by
   * organization bootstrap / member creation with full DTO semantics.
   * @param inviteEmailContext - When an org creates the user, pass its display name for the invite email.
   */
  async register(
    createUserDto: CreateUserDto,
    trusted = false,
    inviteEmailContext?: { organizationName: string },
  ): Promise<void> {
    let otpEvent: OtpGeneratedEvent | null = null;

    const { organizationId, userRole } = this.resolveRegistrationOrgFields(
      createUserDto,
      trusted,
    );

    // Retry once when a concurrent registration causes a unique-key race.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        otpEvent = await this.dataSource.transaction(async (manager) => {
          const userRepo = manager.getRepository(user);
          const userPasswordRepo = manager.getRepository(user_password);
          const userEmailRepo = manager.getRepository(user_email);
          const otpRepo = manager.getRepository(Otp);

          // F2: invite redemption is resolved INSIDE the transaction so that
          // validation, user link, and invite acceptance commit atomically —
          // a failed registration must not consume the code.
          const redemption =
            !trusted && createUserDto.organizationCode
              ? await this.resolveInviteRedemption(
                  manager,
                  createUserDto.organizationCode,
                  createUserDto.email,
                )
              : null;
          const effectiveOrgId = redemption?.organizationId ?? organizationId;
          const effectiveRole = redemption?.role ?? userRole;

          let registeredUserId: string;

          const emailEntity = await userEmailRepo.findOne({
            where: { email: createUserDto.email },
          });

          if (!emailEntity) {
            const newUser = userRepo.create({
              username: createUserDto.username,
              status: UserStatus.PENDING,
              organization_id: effectiveOrgId
                ? ({ organization_id: effectiveOrgId } as Organization)
                : null,
              user_role: effectiveRole,
            });
            const savedUser = await userRepo.save(newUser);
            registeredUserId = savedUser.user_id;

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

            // Trusted provisioning (org member creation) must never mutate a
            // pre-existing account: silently overwriting its password/username
            // and dropping the intended org/role would corrupt a foreign
            // account and produce a phantom member. Reject so the admin invites
            // the existing account instead.
            if (trusted) {
              throw new ConflictException(
                "An account with this email already exists",
              );
            }

            existingUser.username = createUserDto.username;
            existingUser.status = UserStatus.PENDING;

            if (redemption) {
              existingUser.organization_id = {
                organization_id: redemption.organizationId,
              } as Organization;
              existingUser.user_role = redemption.role;
            }

            await userRepo.save(existingUser);
            registeredUserId = existingUser.user_id;

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

          if (redemption && !redemption.alreadyAccepted) {
            const inviteRepo = manager.getRepository(organization_invite);
            redemption.invite.status = OrganizationInviteStatus.ACCEPTED;
            redemption.invite.accepted_by = registeredUserId;
            redemption.invite.accepted_at = new Date();
            await inviteRepo.save(redemption.invite);
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
      this.eventEmitter.emit(
        "auth.otp_generated",
        this.enrichRegisterOtpEvent(otpEvent, {
          organizationId,
          inviteEmailContext,
        }),
      );
    }
  }

  /**
   * F12: public self-serve org signup — creates the organization and its first
   * admin in one step, then rides the standard OTP email-verification.
   * Returns void (202); tokens only come from verifyEmail().
   *
   * NOT named registerOrganization: that name is the secret-gated ops
   * provisioning method on OrganizationService.
   */
  async signUpOrganization(dto: RegisterOrganizationDto): Promise<void> {
    const orgRepo = this.dataSource.getRepository(Organization);

    const nameExists = await orgRepo.findOne({
      where: { organization_name: dto.organizationName },
    });
    if (nameExists) {
      throw new ConflictException(
        "An organization with this name already exists",
      );
    }

    let savedOrganization: Organization;
    try {
      savedOrganization = await orgRepo.save(
        orgRepo.create({ organization_name: dto.organizationName }),
      );
    } catch (error) {
      // Unique-constraint violation: a concurrent signup won the race between
      // the pre-check above and this insert (Postgres error code 23505).
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === "23505"
      ) {
        throw new ConflictException(
          "An organization with this name already exists",
        );
      }
      throw error;
    }

    try {
      await this.register(
        {
          username: buildAdminUsername(dto.organizationName),
          email: dto.email,
          password: dto.password,
          organization_id: savedOrganization.organization_id,
          user_role: OrganizationUserRole.ADMIN,
        },
        true,
      );
    } catch (error) {
      // No orphan org when the admin account can't be created (e.g. email taken).
      await orgRepo.remove(savedOrganization).catch(() => undefined);
      throw error;
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
    const startedAt = Date.now();
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

    // Enumeration defense: a resend for an address we can't (or won't) mail —
    // unknown email, orphan email row, or an already-verified account — returns
    // the SAME silent success as a real resend. Throwing distinct errors here
    // (404/409) would let an attacker probe which addresses exist and which are
    // already verified. Mirrors passwordResetRequest. The dummy hash keeps the
    // bcrypt cost on par with the real path, and the OTP_RESEND_MIN_RESPONSE_MS
    // floor below masks the DB write the real send performs but these paths skip
    // — otherwise response timing alone would still leak which addresses exist.
    if (!emailEntity) {
      await bcrypt.compare("000000", DUMMY_OTP_HASH);
      await this.applyMinimumResetRequestDuration(
        startedAt,
        OTP_RESEND_MIN_RESPONSE_MS,
      );
      return;
    }

    const userEntity = await this.userRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    if (!userEntity) {
      await bcrypt.compare("000000", DUMMY_OTP_HASH);
      await this.applyMinimumResetRequestDuration(
        startedAt,
        OTP_RESEND_MIN_RESPONSE_MS,
      );
      return;
    }

    if (
      purpose === OtpPurpose.REGISTER &&
      userEntity.status === UserStatus.ACTIVE
    ) {
      await bcrypt.compare("000000", DUMMY_OTP_HASH);
      await this.applyMinimumResetRequestDuration(
        startedAt,
        OTP_RESEND_MIN_RESPONSE_MS,
      );
      return;
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

    let event: OtpGeneratedEvent = {
      email,
      plainOtp,
      purpose,
    };

    if (purpose === OtpPurpose.REGISTER) {
      const userWithOrg = await this.userRepository.findOne({
        where: { user_id: emailEntity.user_id },
        relations: ["organization_id"],
      });
      const orgEntity = userWithOrg?.organization_id;
      if (orgEntity?.organization_name) {
        event = {
          ...event,
          registrationChannel: "organization",
          organizationName: orgEntity.organization_name,
          verifyUrl: this.buildVerifyEmailUrl(email),
        };
      }
    }

    this.eventEmitter.emit("auth.otp_generated", event);

    // Floor the real send to the same duration as the silent miss paths above,
    // so a shorter/longer response can't reveal whether a mail was actually
    // dispatched. Emit is fire-and-forget, so this only bounds the send path's
    // own DB/hash work, keeping it indistinguishable from the skipped-write
    // paths.
    await this.applyMinimumResetRequestDuration(
      startedAt,
      OTP_RESEND_MIN_RESPONSE_MS,
    );
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

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.tokenStorage.incrementTokenVersion(userId);
  }

  async validateUser(email: string, password: string): Promise<user> {
    // Every failure branch below returns the SAME generic message. Distinct
    // messages ("email not found" vs "invalid password" vs "not verified")
    // are an account-enumeration leak: they let an attacker probe which emails
    // exist and which are unverified. Compare a password on the miss paths too
    // (dummy hash) so response timing doesn't leak the same information.
    const emailEntity = await this.userEmailRepository.findOne({
      where: { email },
    });

    if (!emailEntity) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordEntity = await this.userPasswordRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    const userEntity = await this.userRepository.findOne({
      where: { user_id: emailEntity.user_id },
    });

    if (!passwordEntity || !userEntity) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (userEntity.status !== UserStatus.ACTIVE) {
      await bcrypt.compare(password, passwordEntity.password);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const match = await bcrypt.compare(password, passwordEntity.password);
    if (!match) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return userEntity;
  }

  async login(user: user): Promise<AuthTokens> {
    return await this.createAuthTokens(user);
  }

  async getUserById(userId: string): Promise<user | null> {
    return this.userRepository.findOne({
      where: { user_id: userId },
    });
  }

  /**
   * B4: payload for GET /auth/status. The guard only attaches the bare user row;
   * the org relation must be loaded explicitly to expose organizationId.
   */
  async getAuthStatusPayload(userId: string): Promise<{
    authenticated: true;
    role: string;
    organizationId: string | null;
  }> {
    const u = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ["organization_id"],
    });

    if (!u) {
      throw new UnauthorizedException("User not found");
    }

    return {
      authenticated: true,
      role: u.user_role,
      organizationId: getUserOrganizationId(u),
    };
  }

  /**
   * Strict refresh-token rotation (RTR): one successful use consumes the old RT JTI,
   * then issues a new AT+RT pair. Concurrent refreshes with the same RT: only one
   * wins consumeRefreshJti; the other gets 401 (client should single-flight refresh).
   *
   * `jti`, `iat`, `exp` on the payload come from jsonwebtoken (jwtid + registered claims).
   */
  async refreshTokens(refreshTokenJwt: string): Promise<AuthTokens> {
    let payload: Record<string, unknown>;
    try {
      payload = (await this.jwtService.verifyAsync(refreshTokenJwt, {
        secret: REFRESH_SECRET,
      })) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    if (payload.typ !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    // jti comes from the jsonwebtoken library and is used to identify the refresh token
    const jti = payload.jti as string | undefined;
    const userId = payload.userId as string | undefined;
    const tv =
      typeof payload.tv === "number"
        ? payload.tv
        : typeof payload.tv === "string"
          ? Number(payload.tv)
          : NaN;

    if (!jti || !userId || Number.isNaN(tv)) {
      throw new UnauthorizedException("Invalid refresh token payload");
    }

    const foundUser = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    if (!foundUser || (foundUser.tokenVersion ?? 1) !== tv) {
      throw new UnauthorizedException("Session is no longer valid");
    }

    // exp comes from the jsonwebtoken library and is used to get the expiration time of the refresh token
    const exp = payload.exp as number | undefined;
    const nowSec = Math.floor(Date.now() / 1000);
    const ttlSeconds = exp
      ? exp - nowSec
      : Math.floor(REFRESH_TOKEN_MAX_AGE_MS / 1000);
    if (ttlSeconds <= 0) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Atomic claim: implements "use once" for this RT instance (see ITokenStorage).
    if (!(await this.tokenStorage.consumeRefreshJti(jti, ttlSeconds))) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    return this.createAuthTokens(foundUser);
  }

  /**
   * Primary logout: bump tokenVersion so every JWT with the old `tv` fails validation.
   * Optional refreshJti blacklist is defense-in-depth when SessionGuard authenticated
   * via RT (see SessionGuard); omitting it when AT was used is fine — tv bump is enough.
   */
  async logout(userId: string, refreshJti?: string): Promise<void> {
    await this.tokenStorage.incrementTokenVersion(userId);

    if (refreshJti) {
      const blacklistTtlSeconds = Math.floor(REFRESH_TOKEN_MAX_AGE_MS / 1000);
      await this.tokenStorage.blacklistToken(refreshJti, blacklistTtlSeconds);
    }
  }

  /**
   * AT: default JWT secret + typ access.
   * RT: REFRESH_SECRET + typ refresh — prevents swap attacks.
   */
  private async createAuthTokens(userEntity: user): Promise<AuthTokens> {
    const basePayload = {
      userId: userEntity.user_id,
      username: userEntity.username,
      tv: userEntity.tokenVersion ?? 1,
    };

    const accessToken = await this.jwtService.signAsync(
      { ...basePayload, typ: "access" },
      { expiresIn: ACCESS_TOKEN_EXPIRY as any, jwtid: randomUUID() },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...basePayload, typ: "refresh" },
      {
        expiresIn: REFRESH_TOKEN_EXPIRY as any,
        jwtid: randomUUID(),
        secret: REFRESH_SECRET,
      },
    );

    return { accessToken, refreshToken };
  }

  private generateOtpCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  private buildVerifyEmailUrl(email: string): string {
    const base = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
    if (!base) {
      return "";
    }
    return `${base}/verify-email?email=${encodeURIComponent(email)}`;
  }

  private enrichRegisterOtpEvent(
    event: OtpGeneratedEvent,
    options: {
      organizationId?: string;
      inviteEmailContext?: { organizationName: string };
    },
  ): OtpGeneratedEvent {
    if (
      event.purpose !== OtpPurpose.REGISTER ||
      !options.organizationId ||
      !options.inviteEmailContext?.organizationName
    ) {
      return event;
    }
    return {
      ...event,
      registrationChannel: "organization",
      organizationName: options.inviteEmailContext.organizationName,
      verifyUrl: this.buildVerifyEmailUrl(event.email),
    };
  }

  /**
   * F2: validates + locks an invite row for redemption. Runs inside the register
   * transaction (see callsite) so acceptance is atomic with user creation.
   * `alreadyAccepted` covers the pending-user re-register case: the same account
   * retrying registration with its own consumed code is a no-op, not an error.
   */
  private async resolveInviteRedemption(
    manager: EntityManager,
    code: string,
    email: string,
  ): Promise<{
    invite: organization_invite;
    organizationId: string;
    role: string;
    alreadyAccepted: boolean;
  }> {
    const inviteRepo = manager.getRepository(organization_invite);

    // One generic rejection for every unusable-code state on this PUBLIC
    // /auth/register path. Distinct messages (unknown / revoked / already-used /
    // expired / email-bound-to-someone-else) would be an error oracle: a
    // code-holder could probe invite state and confirm an email↔invite binding.
    // The authenticated org-admin view (listInvites → toInviteRow) still surfaces
    // the real per-invite status; only the anonymous path is redacted. (#187)
    const invalidCode = () =>
      new BadRequestException(
        "This organization code is invalid or cannot be used",
      );

    const invite = await inviteRepo
      .createQueryBuilder("invite")
      .setLock("pessimistic_write")
      .where("invite.code = :code", { code })
      .getOne();

    if (!invite) {
      throw invalidCode();
    }

    if (invite.status === OrganizationInviteStatus.REVOKED) {
      throw invalidCode();
    }

    if (invite.status === OrganizationInviteStatus.ACCEPTED) {
      // Idempotent path: same pending account re-registering with its own code.
      const emailRepo = manager.getRepository(user_email);
      const emailEntity = await emailRepo.findOne({
        where: { email },
      });
      if (emailEntity && emailEntity.user_id === invite.accepted_by) {
        return {
          invite,
          organizationId: invite.organization_id,
          role: invite.role,
          alreadyAccepted: true,
        };
      }
      throw invalidCode();
    }

    const isExpired =
      invite.status === OrganizationInviteStatus.EXPIRED ||
      invite.expires_at.getTime() < Date.now();
    if (isExpired) {
      // Expired-ness is derived on read (see toInviteRow in
      // organization.service.ts) — persisting the flip here would be
      // rolled back anyway by the throw below aborting this transaction.
      throw invalidCode();
    }

    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      throw invalidCode();
    }

    // No org-existence check needed: the FK is onDelete CASCADE, so a live
    // invite row implies a live organization.
    return {
      invite,
      organizationId: invite.organization_id,
      role: invite.role,
      alreadyAccepted: false,
    };
  }

  private resolveRegistrationOrgFields(
    createUserDto: CreateUserDto,
    trusted: boolean,
  ): { organizationId: string | undefined; userRole: string } {
    if (!trusted) {
      return {
        organizationId: undefined,
        userRole: OrganizationUserRole.NONE,
      };
    }
    if (createUserDto.organization_id) {
      return {
        organizationId: createUserDto.organization_id,
        userRole: createUserDto.user_role ?? OrganizationUserRole.USER,
      };
    }
    return {
      organizationId: undefined,
      userRole: createUserDto.user_role ?? OrganizationUserRole.NONE,
    };
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
    minMs: number = PASSWORD_RESET_REQUEST_MIN_RESPONSE_MS,
  ): Promise<void> {
    const elapsed = Date.now() - startedAt;
    const remaining = minMs - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}
