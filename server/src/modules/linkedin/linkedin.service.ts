import { Repository } from "typeorm";

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";

import {
  user,
  user_email,
  user_oauth,
  user_profile,
} from "@entities/user.entity";

import { LinkedInProfile, LinkedInTokenDatas } from "@common/utils/types";
import { AuthProvider } from "@common/enums/AuthProvider";
import { ProfileVisibility } from "@common/enums/ProfileVisibility";

@Injectable()
export class LinkedInService {
  private clientId = process.env.LINKEDIN_CLIENT_ID ?? "";
  private clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? "";
  private redirectUri = process.env.LINKEDIN_OAUTH_CALLBACK ?? "";

  private readonly logger = new Logger(LinkedInService.name);

  constructor(
    @InjectRepository(user) private userRepository: Repository<user>,
    @InjectRepository(user_email)
    private userEmailRepository: Repository<user_email>,
    @InjectRepository(user_oauth)
    private userOauthRepository: Repository<user_oauth>,
    @InjectRepository(user_profile)
    private userProfileRepository: Repository<user_profile>,

    private jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Fetches the access token data from LinkedIn using the authorization code.
   * @param code - The authorization code (query) received from LinkedIn OAuth.
   * @returns {Promise<LinkedInTokenDatas>} An object containing the access token, expiration time, and scope.
   * @throws InternalServerErrorException if the access token cannot be fetched.
   */
  async getAccessTokenDatasFromQueryCode(
    code: string,
  ): Promise<LinkedInTokenDatas> {
    const params = new URLSearchParams();

    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", this.redirectUri);
    params.append("client_id", this.clientId);
    params.append("client_secret", this.clientSecret);

    try {
      const res: AxiosResponse<{
        access_token: string;
        scope: string;
        expires_in: string;
      }> = await this.httpService.axiosRef.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        params,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );

      return res.data;
    } catch (error) {
      this.logger.error("getAccessTokenDatas ->", error);
      throw new InternalServerErrorException("Failed to fetch access token");
    }
  }

  /**
   * Fetches the LinkedIn profile using the access token.
   * @param {string} accessToken - The access token obtained from LinkedIn OAuth.
   * @returns {Promise<LinkedInProfile>} profile - The LinkedIn profile data.
   * @throws InternalServerErrorException if the profile cannot be fetched.
   */
  async getLinkedInProfileFromAccessToken(
    accessToken: string,
  ): Promise<LinkedInProfile> {
    try {
      const profile: AxiosResponse<LinkedInProfile> =
        await this.httpService.axiosRef.get(
          "https://api.linkedin.com/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

      return profile.data;
    } catch (error) {
      this.logger.error("getLinkedInProfile ->", error);
      throw new InternalServerErrorException(
        "Failed to fetch LinkedIn profile",
      );
    }
  }

  /**
   * Saves the OAuth token data for a user.
   * @param {string} userId - The ID of the user.
   * @param {LinkedInTokenDatas} tokenData - The token data to save.
   * @return {Promise<void>} A promise that resolves when the token data is saved.
   * @throws InternalServerErrorException if there is an error saving the token data.
   */
  async saveTokenDataFromUser(
    userId: string,
    tokenData: LinkedInTokenDatas,
  ): Promise<void> {
    const oauthData = this.userOauthRepository.create({
      user_id: userId,
      provider: AuthProvider.LINKEDIN,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      refresh_token_expires_in: tokenData.refresh_token_expires_in,
      scope: tokenData.scope,
    });

    await this.userOauthRepository.save(oauthData);
  }

  /**
   * Saves a LinkedIn user profile and returns a JWT token.
   * @param {LinkedInProfile} linkedInProfile - The LinkedIn profile data.
   * @param {LinkedInTokenDatas} tokenData - The OAuth token data.
   * @returns {Promise<{ accessToken: string;}>} token JWT.
   */
  async saveLinkedInUser(
    linkedInProfile: LinkedInProfile,
    tokenData: LinkedInTokenDatas,
  ): Promise<{ accessToken: string }> {
    // Check if the user already exists
    const existingUser = await this.userRepository.findOne({
      where: { username: linkedInProfile.name },
    });

    if (existingUser) {
      const payload = {
        userId: existingUser.user_id,
        username: existingUser.username,
      };
      return {
        accessToken: await this.jwtService.signAsync(payload),
      };
    }

    const newUser = this.userRepository.create({
      username: linkedInProfile.name,
      provider: AuthProvider.LINKEDIN,
    });

    const savedUser = await this.userRepository.save(newUser);

    const newProfile = this.userProfileRepository.create({
      user_id: savedUser.user_id,
      profile_picture: linkedInProfile.picture ?? null,
      profile_visibility: ProfileVisibility.PUBLIC,
    });
    await this.userProfileRepository.save(newProfile);

    try {
      // Create OAuth data
      await this.saveTokenDataFromUser(savedUser.user_id, tokenData);
    } catch (error) {
      this.logger.error("Error saving OAuth data:", error);
      throw new InternalServerErrorException("Failed to save OAuth data");
    }

    // Create user_email entity
    const newUserEmail = this.userEmailRepository.create({
      email: linkedInProfile.email,
      is_verified: linkedInProfile.email_verified,
      user_id: savedUser.user_id,
    });

    // Save the email to the database
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
   * Handles the complete LinkedIn OAuth flow from authorization code to user creation.
   * @param {string} code - The authorization code from LinkedIn OAuth callback.
   * @returns {Promise<{ accessToken: string }>} JWT token for the authenticated user.
   */
  async handleLinkedInCallback(code: string): Promise<{ accessToken: string }> {
    // Get access token from LinkedIn
    const tokenData = await this.getAccessTokenDatasFromQueryCode(code);

    // Get user profile from LinkedIn
    const linkedInProfile = await this.getLinkedInProfileFromAccessToken(
      tokenData.access_token,
    );

    // Save user and return JWT
    return await this.saveLinkedInUser(linkedInProfile, tokenData);
  }
}
