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
import * as pdf from "pdf-parse";
import type { Request, Response } from "express";

@Injectable()
export class UsersService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(user_email)
    private emailRepo: Repository<user_email>,

    @InjectRepository(user_password)
    private passwordRepo: Repository<user_password>,
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

      const pdf = require("pdf-parse-debugging-disabled");
      const pdfData = await pdf(req.file.buffer);
      const rawText = pdfData.text;

      if (rawText.length === 0) {
        return res
          .status(400)
          .json({ message: "The PDF file is empty or could not be parsed." });
      } else {
        console.log("Raw text extracted from PDF:", rawText);
        res.status(200).json({
          message: "CV analysé avec succès",
        });
      }
    } catch (error) {
      console.error("Parsing error:", error);
      res.status(500).json({ message: "Error processing the CV file." });
    }
  }
}

// router.post('/upload-cv', upload.single('cv'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "Aucun fichier téléchargé" });
//     }

//     // ÉTAPE A : Extraire le texte brut du PDF
//     const pdfData = await pdf(req.file.buffer);
//     const rawText = pdfData.text;

//     // ÉTAPE B : Envoyer le texte à Claude pour analyse
//     const msg = await anthropic.messages.create({
//       model: "claude-3-5-sonnet-20240620",
//       max_tokens: 1500,
//       temperature: 0, // 0 pour une réponse constante et précise
//       system: "Tu es un parseur de CV expert. Ton rôle est d'extraire les données au format JSON strict.",
//       messages: [
//         {
//           role: "user",
//           content: `Extrais les informations suivantes de ce texte de CV :
//           nom, poste_actuel, experiences (liste avec dates, poste, entreprise),
//           competences_techniques (liste), et diplomes.

//           Réponds uniquement avec le JSON, sans texte avant ou après.

//           Texte du CV : ${rawText}`
//         }
//       ],
//     });

//     // ÉTAPE C : Parser la réponse de Claude
//     const textResponse = msg.content[0].text;
//     const extractedData = JSON.parse(textResponse);

//     // ÉTAPE D : Réponse au front
//     res.status(200).json({
//       message: "CV analysé avec succès",
//       data: extractedData
//     });

//   } catch (error) {
//     console.error("Erreur parsing CV:", error);
//     res.status(500).json({ error: "Erreur lors du traitement du CV" });
//   }
// });
