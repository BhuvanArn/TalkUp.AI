import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { user_password, user_email } from "@entities/user.entity";
import { hashPassword } from "@common/utils/passwordHasher";
import { type Request, type Response } from "express";
import  {user_cv} from "@entities/userCV.entity";

@Injectable()
export class UsersService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(user_email)
    private emailRepo: Repository<user_email>,

    @InjectRepository(user_password)
    private passwordRepo: Repository<user_password>,

    @InjectRepository(user_cv)
    private user_cvRepo: Repository<user_cv>,
  ) {
    this.logger = new Logger(UsersService.name);
  }

  /**
   * Changes the password for a user identified by their email address.
   *
   * This method first verifies the existence of a user with the given email address.
   * If the user exists, it hashes the new password and updates or creates the password entity
   * associated with the user's ID. If no user is found, it throws an UnauthorizedException.
   *
   * @param email - The email address of the user whose password is to be changed.
   * @param newUserPassword - The new password to set for the user.
   * @returns A promise that resolves to `true` if the password was successfully changed.
   * @throws {NotFoundException} If no user exists with the provided email address.
   */
  async changeUserPassword(
    email: string,
    newUserPassword: string,
  ): Promise<boolean> {
    try {
      const emailEntity = await this.emailRepo.findOne({
        where: { email },
      });

      if (!emailEntity) {
        throw new NotFoundException("There is no user with that email");
      }

      const hashedPassword = await hashPassword(newUserPassword);

      const passwordEntity = await this.passwordRepo.findOne({
        where: { user_id: emailEntity.user_id },
      });

      if (!passwordEntity) {
        const newUserPasswordEntity = this.passwordRepo.create({
          password: hashedPassword,
          user_id: emailEntity.user_id,
        });
        await this.passwordRepo.save(newUserPasswordEntity);
      } else {
        passwordEntity.password = hashedPassword;
        await this.passwordRepo.save(passwordEntity);
      }
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to change password for email ${email}: ${error}`,
      );
      throw new InternalServerErrorException(
        "Internal server error while changing password.",
      );
    }
  }

  async uploadCV(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Upload a PDF file." });
      }

      const userId = (req as any).userId;
      const pdf = require("pdf-parse-debugging-disabled");
      const pdfData = await pdf(req.file.buffer);
      const rawText = pdfData.text;

      if (rawText.length === 0 || !rawText) {
        console.log("The file is empty!!!");
        return res
          .status(400)
          .json({ message: "The PDF file is empty or could not be parsed." });
      }
      console.log("Raw text extracted from PDF:", rawText);

      const Anthropic = require("@anthropic-ai/sdk");
      const client = new Anthropic();
      const prompt = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 2048,
  messages: [
    {
      role: "user",
      content: `You are a specialized CV analysis assistant. Analyze the following text extracted from a CV and return ONLY a valid JSON object (no markdown, no backticks, no comments) with exactly this structure:
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
      ${rawText}`,
          },
        ],
      });

      const responseText = prompt.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { type: string; text?: string }) =>
          block.type === "text" ? block.text : ""
        )
        .join("");
      let extractedData;
      try {
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        extractedData = JSON.parse(cleaned);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return res
          .status(500)
          .json({ message: "Failed to parse extracted CV data." });
      }

      const existingCV = await this.user_cvRepo.findOne({ where: { user_id: userId } });

      if (existingCV) {
        await this.user_cvRepo.update(
          { user_id: userId },
          {
            desired_job: extractedData.desired_job ?? null,
            resume: extractedData.resume ?? null,
            experiences: extractedData.experiences ?? [],
            education: extractedData.education ?? [],
            technical_skills: extractedData.technical_skills ?? [],
            languages: extractedData.languages ?? [],
          }
        );
        console.log("CV updated for user ID:", userId);
        return res.status(200).json({
          message: "CV uploaded successfully",
        });
      } else {
        const newCV = this.user_cvRepo.create({
          user_id: userId,
          desired_job: extractedData.desired_job ?? null,
          resume: extractedData.resume ?? null,
          experiences: extractedData.experiences ?? [],
          education: extractedData.education ?? [],
          technical_skills: extractedData.technical_skills ?? [],
          languages: extractedData.languages ?? [],
        });
        console.log("CV created for user ID:", userId);
        await this.user_cvRepo.save(newCV);
        return res.status(200).json({
          message: "CV uploaded successfully",
        });
      }
    } catch (error) {
      console.error("Parsing error:", error);
      res.status(500).json({ message: "Error processing the CV file." });
    }
  }
}

