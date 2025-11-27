import { Repository } from "typeorm";

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { CreateUserDto } from "./dto/createUser.dto";

import { user, user_password, user_email } from "@entities/user.entity";

import { hashPassword } from "@common/utils/passwordHasher";

@Injectable()
export class AuthService {
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

  async getUserById(userId: string): Promise<user | null> {
    return this.userRepository.findOne({
      where: { user_id: userId },
    });
  }
}
