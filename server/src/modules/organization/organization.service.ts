import { Repository } from "typeorm";

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Logger } from "@nestjs/common";

import { CreateOrganizationDto } from "./dto/createOrganization.dto";
import { CreateUserDto } from "../auth/dto/createUser.dto";
import { AuthService } from "../auth/auth.service";

import { Organization } from "@entities/organization.entity";

import { generateSecurePassword } from "@common/utils/generateSecurePassword";

@Injectable()
export class OrganizationService {
  logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

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
   * @throws {ConflictException} If an organization with this name already exists.
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

    const initialAdminPassword = generateSecurePassword();

    const createUserDto: CreateUserDto = {
      username: `${savedOrganization.organization_name}_admin`,
      email: `${CreateOrganizationDto.OrganizationEmail}`,
      password: initialAdminPassword,
      user_role: "admin",
      organization_id: savedOrganization.organization_id,
    };

    await this.authService.register(createUserDto);

    return {
      message: "Creation successful",
      adminUser: {
        username: createUserDto.username,
        email: createUserDto.email,
        password: initialAdminPassword,
      },
    };
  }

  /**
   * Delete an organization with the provided id.
   *
   * This method performs the following steps:
   * 1. Checks if the organization exists in the system.
   * 2. Deletes the organization.
   *
   * @param id
   * @returns
   * @throws {NotFoundException} If an organization with the provided id doesn't exists.
   * @throws {InternalServerErrorException} If an error occurs while removing the organization.
   */
  async deleteOrganization(id: string): Promise<void> {
    const organization = await this.findOne(id);

    try {
      await this.organizationRepository.remove(organization);
    } catch (error) {
      this.logger.error(
        `Error removing organization ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while removing organization.",
      );
    }
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
   * @throws {NotFoundException} If an account with the provided name doesn't exists.
   */
  async updateOrganization(
    id: string,
    updateData: { newName?: string; newProfilePicture?: string },
  ): Promise<void> {
    const organization = await this.findOne(id);

    if (updateData.newName) {
      organization.organization_name = updateData.newName;
    }
    if (updateData.newProfilePicture) {
      organization.profile_picture = updateData.newProfilePicture;
    }

    await this.organizationRepository.save(organization);
  }

  /**
   * Find an organization by its id.
   *
   * This method performs the following steps:
   * 1. Checks if the organization exists in the system.
   * 2. Throws a `NotFoundException` if the organization doesn't exist.
   * 3. Returns the organization.
   *
   * @param organization_id
   * @returns The organization.
   * @throws {NotFoundException} If an organization with the provided id doesn't exists.
   */
  async findOne(organization_id: string) {
    try {
      const organization = await this.organizationRepository.findOne({ where: { organization_id } });

      if (!organization) throw new NotFoundException("Organization not found.");
      return organization;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Error retrieving organization ${organization_id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while retrieving organization.",
      );
    }
  }
}
