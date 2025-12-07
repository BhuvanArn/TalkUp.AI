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

import { CreateOrganizationDto } from "./dto/createOrganization";
import { CreateUserDto } from "../auth/dto/createUser.dto";
import { AuthService } from "../auth/auth.service"

import { Organization } from "@entities/organization.entity";

import { hashPassword } from "@common/utils/passwordHasher";

@Injectable()
export class OrganizationService {
  logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization) private organizationRepository: Repository<Organization>,

    private jwtService: JwtService,

    private readonly authService: AuthService
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
    CreateOrganizationDto: CreateOrganizationDto,
  ): Promise<{ accessToken: string }> {
    const nameExists = await this.organizationRepository.findOne({
      where: { Organization_name: CreateOrganizationDto.OrganizationName },
    });

    if (nameExists) {
      throw new ConflictException("An organization with this email already exists");
    }

    const newOrganization= this.organizationRepository.create({
        Organization_name: CreateOrganizationDto.OrganizationName,
    });

    const savedOrganization = await this.organizationRepository.save(newOrganization);

    const createUserDto: CreateUserDto = {
        username: `${savedOrganization.Organization_name}_admin`,
        email: `${CreateOrganizationDto.OrganizationEmail}`,
        password: "helloworld",
        userRole: "organizationAdmin",
    };

    await this.authService.register(createUserDto);

    const payload = {
      organizationId: savedOrganization.organization_id,
      username: savedOrganization.Organization_name,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
