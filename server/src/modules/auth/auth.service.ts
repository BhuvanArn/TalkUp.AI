import { Repository } from "typeorm";

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { Logger } from "@nestjs/common";

import { CreateUserDto } from "./dto/createUser.dto";
import { EditUserDto } from "./dto/editUser.dto";

import { user, user_password, user_email } from "@entities/user.entity";

import { hashPassword } from "@common/utils/passwordHasher";

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(user) private userRepository: Repository<user>,
    @InjectRepository(user_password)
    private userPasswordRepository: Repository<user_password>,
    @InjectRepository(user_email)
    private userEmailRepository: Repository<user_email>,

    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new user with the provided credentials.
   *
   * This method performs the following steps:
   * 1. Checks if the email already exists in the system.
   * 2. Throws a `ConflictException` if the email is already registered.
   * 3. Creates a new user with the given username.
   * 4. Hashes and stores the user's password.
   * 5. Stores the user's email.
   * 6. Generates and returns a JWT access token for the newly registered user.
   *
   * @param createUserDto - Data transfer object containing the user's registration details (username, password, email).
   * @returns An object containing the generated JWT access token.
   * @throws {ConflictException} If an account with the provided email already exists.
   */
  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string }> {
    const emailExists = await this.userEmailRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (emailExists) {
      throw new ConflictException("An account with this email already exists");
    }

    const newUser = this.userRepository.create({
      username: createUserDto.username,
      organization_id: createUserDto.organization_id
        ? { organization_id: createUserDto.organization_id }
        : null,
      user_role: createUserDto.user_role ?? "user",
    });

    const savedUser = await this.userRepository.save(newUser);

    const newUserPassword = this.userPasswordRepository.create({
      password: await hashPassword(createUserDto.password),
      user_id: savedUser.user_id,
    });

    const newUserEmail = this.userEmailRepository.create({
      email: createUserDto.email,
      user_id: savedUser.user_id,
    });

    await this.userPasswordRepository.save(newUserPassword);
    await this.userEmailRepository.save(newUserEmail);

    const payload = {
      userId: savedUser.user_id,
      username: savedUser.username,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  /**
   * Validates a user's credentials using their email and password.
   *
   * This method performs the following steps:
   * 1. Finds the user entity associated with the provided email.
   * 2. Retrieves the password entity for the found user.
   * 3. Retrieves the user entity details.
   * 4. Throws an `UnauthorizedException` if the email or password is not found, or if the password does not match.
   * 5. Returns the user entity if validation is successful.
   *
   * @param email - The user's email to identify the account.
   * @param password - The user's plaintext password to validate.
   * @returns A promise that resolves to the user entity if validation succeeds.
   * @throws {UnauthorizedException} If the email is not found or the password is invalid.
   */
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

    const match = await bcrypt.compare(password, passwordEntity.password);
    if (!match) {
      throw new UnauthorizedException("Invalid password");
    }

    return userEntity;
  }

  /**
   * Authenticates a user and generates a JWT access token.
   *
   * @param user - The user object containing authentication details.
   * @returns An object containing the generated access token.
   */
  async login(user: user) {
    const payload = {
      userId: user.user_id,
      username: user.username,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  /**
   *Upadate some information from the user account
   * @param userId -It is the current user Id
   * @param EditUserDto -There is all the information that user whant to update in his/her account
   * @returns  A message if the user is upadte succesfully or not
   */
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

  /**
   * Verifies a JWT access token and returns the associated user.
   *
   * This method performs the following steps:
   * 1. Verifies the JWT token is valid and not expired.
   * 2. Extracts the userId from the token payload.
   * 3. Retrieves the user entity from the database.
   * 4. Throws an `UnauthorizedException` if the token is invalid or the user is not found.
   *
   * @param token - The JWT access token to verify.
   * @returns A promise that resolves to the user entity if verification succeeds.
   * @throws {UnauthorizedException} If the token is invalid, expired, or the user is not found.
   */
  async verifyAccessToken(token: string): Promise<user> {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (!payload.userId) {
        throw new UnauthorizedException("Invalid token payload");
      }

      const user = await this.getUserById(payload.userId);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`Access token verification failed:`, error);
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}
