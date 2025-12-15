import { Repository } from "typeorm";

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
   * Registers a new organization with the provided credentials.
   *
   * This method performs the following steps:
   * 1. Checks if the email already exists in the system.
   * 2. Throws a `ConflictException` if the email is already registered.
   * 3. Creates a new organization with the given information.
   * 4. Save the new organization.
   * 5. Register a new user as the admin of the organization.
   *
   * @param CreateOrganizationDto
   * @returns An object containing the admin user credentials.
   * @throws {ConflictException} If an organization with the provided email already exists.
   */
  async registerOrganization(
    CreateOrganizationDto: CreateOrganizationDto,
  ): Promise<{
    message: string;
    adminUser: { username: string; email: string; password: string };
  }> {
    const nameExists = await this.organizationRepository.findOne({
      where: { organization_name: CreateOrganizationDto.OrganizationName },
    });

    if (nameExists) {
      throw new ConflictException(
        "An organization with this name already exists",
      );
    }

    const newOrganization = this.organizationRepository.create({
      organization_name: CreateOrganizationDto.OrganizationName,
    });

    const savedOrganization =
      await this.organizationRepository.save(newOrganization);

    const createUserDto: CreateUserDto = {
      username: `${savedOrganization.organization_name}_admin`,
      email: `${CreateOrganizationDto.OrganizationEmail}`,
      password: "helloworld",
      user_role: "organizationAdmin",
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

  /**
   * Delete an organization with the provided name.
   *
   * This method performs the following steps:
   * 1. Checks if the organization exists in the system.
   * 2. Throws a `ConflictException` if the organization doesn't exist.
   * 3. Deletes the organization.
   *
   * @param organizationName
   * @returns
   * @throws {ConflictException} If an account with the provided name doesn't exists.
   */
  async deleteOrganization(organizationName: string): Promise<void> {
    const nameExists = await this.organizationRepository.findOne({
      where: { organization_name: organizationName },
    });

    if (!nameExists) {
      throw new NotFoundException(
        "An organization with this name doesn't exist",
      );
    }
    await this.organizationRepository.remove(nameExists);
  }

  /**
   * Update an organization informations with the provided credentials.
   *
   * This method performs the following steps:
   * 1. Checks if the organization exist in the system.
   * 2. Throws a `ConflictException` if the organization doesn't exist.
   * 3. Updates the organization with the given information.
   *
   * @param currentName
   * @param updateData
   * @returns An object containing the admin user credentials.
   * @throws {ConflictException} If an account with the provided name doesn't exists.
   */
  async updateOrganization(
    currentName: string,
    updateData: { newName?: string; newProfilePicture?: string },
  ): Promise<void> {
    const organization = await this.organizationRepository.findOne({
      where: { organization_name: currentName },
    });

    if (!organization) {
      throw new ConflictException(
        "An organization with this name doesn't exist",
      );
    }

    if (updateData.newName) {
      organization.organization_name = updateData.newName;
    }
    if (updateData.newProfilePicture) {
      organization.profile_picture = updateData.newProfilePicture;
    }

    await this.organizationRepository.save(organization);
  }
}
