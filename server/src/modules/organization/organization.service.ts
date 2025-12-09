import { Repository } from "typeorm";

import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { Logger } from "@nestjs/common";

import { CreateOrganizationDto } from "./dto/createOrganization";
import { CreateUserDto } from "../auth/dto/createUser.dto";
import { AuthService } from "../auth/auth.service";

import { Organization } from "@entities/organization.entity";

@Injectable()
export class OrganizationService {
  logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    private jwtService: JwtService,

    private readonly authService: AuthService,
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
   * @returns An object containing the admin user credentials.
   * @throws {ConflictException} If an account with the provided email already exists.
   */
  async register(CreateOrganizationDto: CreateOrganizationDto): Promise<{
    message: string;
    adminUser: { username: string; email: string; password: string };
  }> {
    const nameExists = await this.organizationRepository.findOne({
      where: { Organization_name: CreateOrganizationDto.OrganizationName },
    });

    if (nameExists) {
      throw new ConflictException(
        "An organization with this name already exists",
      );
    }

    const newOrganization = this.organizationRepository.create({
      Organization_name: CreateOrganizationDto.OrganizationName,
    });

    const savedOrganization =
      await this.organizationRepository.save(newOrganization);

    const createUserDto: CreateUserDto = {
      username: `${savedOrganization.Organization_name}_admin`,
      email: `${CreateOrganizationDto.OrganizationEmail}`,
      password: "helloworld",
      userRole: "organizationAdmin",
    };

    await this.authService.register(createUserDto);

    return {
      message: "Creation successful",
      adminUser: {
        username: createUserDto.username,
        email: createUserDto.email,
        password: createUserDto.password,
      },
    };
  }

  async delete(organizationName: string): Promise<void> {
    const nameExists = await this.organizationRepository.findOne({
      where: { Organization_name: organizationName },
    });

    if (!nameExists) {
      throw new ConflictException(
        "An organization with this name doesn't exists",
      );
    }
    await this.organizationRepository.remove(nameExists);
  }

  async updateOrganization(
    currentName: string,
    updateData: { newName?: string; newProfilePicture?: string },
  ): Promise<void> {
    const organization = await this.organizationRepository.findOne({
      where: { Organization_name: currentName },
    });

    if (!organization) {
      throw new ConflictException(
        "An organization with this name doesn't exist",
      );
    }

    if (updateData.newName) {
      organization.Organization_name = updateData.newName;
    }
    if (updateData.newProfilePicture) {
      organization.profile_picture = updateData.newProfilePicture;
    }

    await this.organizationRepository.save(organization);
  }
}
