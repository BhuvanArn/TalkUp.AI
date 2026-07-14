import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CLIENT } from "@common/redis/redis.constants";

import { CreateAiInterviewDto } from "../ai/dto/createAiInterview.dto";
import { loadSimulationConfig } from "./simulation.config";
import { SimRedisKeys } from "./simulation.redis-keys";
import { SimulationCapacityService } from "./simulation-capacity.service";

export type SimulationChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type SimulationSessionContext = {
  interviewId: string;
  userId: string;
  systemPrompt: string;
  history: SimulationChatTurn[];
};

const BASE_RECRUITER_PERSONA = `Tu es Sophie Martin, recruteuse senior IT chez une ESN francaise. Tu conduis un entretien d'embauche professionnel en visioconference. Tu es la meneuse de l'entretien : c'est TOI qui guides la conversation, poses les questions, fais les transitions entre les themes et conclus l'echange. Ne laisse jamais le candidat diriger seul l'entretien.

Style : chaleureuse, professionnelle, humaine et naturelle. Reponses orales concises (2 a 4 phrases en general, un peu plus pour l'accueil initial). Une seule prise de parole a la fois — ne simule pas plusieurs tours. N'ecris jamais de balises (system:, user:, assistant:) ni un dialogue multi-tours. Utilise l'historique pour rester coherent : reprends le prenom et les elements deja mentionnes, ne repose pas une question deja posee, ne contredis pas le candidat.

Structure de l'entretien (~15-20 minutes) — respecte cet ordre strict :
1. Accueil : salutations, remerciements, presentation de l'entreprise et du poste
2. Presentation du candidat : invite-le a se presenter AVANT toute question sur l'experience
3. Parcours : experiences passees, formations, evolutions de carriere
4. Competences : questions techniques ou metier selon le type de simulation
5. Motivation : pourquoi ce poste, projet professionnel, soft skills
6. Echange : propose au candidat de poser ses questions
7. Cloture : remerciements, prochaines etapes, au revoir chaleureux

Comportement proactif : pose TOUJOURS une question ou annonce clairement la prochaine etape a la fin de chaque reponse. Transitionne activement entre les phases. Rebondis sur les reponses du candidat avant d'enchaîner. Ne reponds jamais par un simple accord sans question de suivi.

Regles sur le prenom du candidat : n'utilise JAMAIS de placeholder entre crochets (ex. [Prenom du candidat], [Nom]). Si le prenom n'est pas explicitement connu dans le contexte, dis simplement « Bonjour » sans nom — le candidat se presentera ensuite.`;

@Injectable()
export class SimulationContextService {
  private readonly logger = new Logger(SimulationContextService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly capacity: SimulationCapacityService,
  ) {}

  buildSystemPrompt(dto: CreateAiInterviewDto): string {
    const language = dto.language?.trim() || "French";
    const interviewType = dto.type?.trim() || "general";
    const jobContext = dto.jobContext?.trim();

    let prompt = `${BASE_RECRUITER_PERSONA}\n\nLangue de l'entretien: ${language}.\nType de simulation: ${interviewType}.`;

    if (jobContext) {
      prompt += `\n\nContexte candidat et poste (a utiliser pour personnaliser tes questions, sans tout reciter):\n${jobContext}`;
    } else {
      prompt +=
        "\n\n(Pas de CV/offre detailles pour cette session — pose des questions generiques adaptees au type de simulation.)";
    }

    return prompt;
  }

  async storeContext(
    interviewId: string,
    userId: string,
    systemPrompt: string,
  ): Promise<void> {
    const { contextTtlSec } = loadSimulationConfig();
    const payload: SimulationSessionContext = {
      interviewId,
      userId,
      systemPrompt,
      history: [],
    };

    await this.redis.set(
      SimRedisKeys.context(interviewId),
      JSON.stringify(payload),
      "EX",
      contextTtlSec,
    );
  }

  async getContextForSts(
    interviewId: string,
  ): Promise<SimulationSessionContext> {
    const raw = await this.redis.get(SimRedisKeys.context(interviewId));
    if (!raw) {
      this.logger.warn(`No simulation context for interview ${interviewId}`);
      throw new NotFoundException("Simulation session context not found.");
    }

    return JSON.parse(raw) as SimulationSessionContext;
  }

  async appendTurn(
    interviewId: string,
    userText: string,
    assistantText: string,
  ): Promise<void> {
    const ctx = await this.getContextForSts(interviewId);
    const { contextTtlSec, historyMaxTurns } = loadSimulationConfig();

    ctx.history.push({ role: "user", content: userText });
    ctx.history.push({ role: "assistant", content: assistantText });

    if (ctx.history.length > historyMaxTurns * 2) {
      ctx.history = ctx.history.slice(-historyMaxTurns * 2);
    }

    await this.redis.set(
      SimRedisKeys.context(interviewId),
      JSON.stringify(ctx),
      "EX",
      contextTtlSec,
    );

    await this.capacity.touchHeartbeat(interviewId, ctx.userId);
  }

  async appendAssistantTurn(
    interviewId: string,
    assistantText: string,
  ): Promise<void> {
    const ctx = await this.getContextForSts(interviewId);
    const { contextTtlSec, historyMaxTurns } = loadSimulationConfig();

    ctx.history.push({ role: "assistant", content: assistantText });

    if (ctx.history.length > historyMaxTurns * 2) {
      ctx.history = ctx.history.slice(-historyMaxTurns * 2);
    }

    await this.redis.set(
      SimRedisKeys.context(interviewId),
      JSON.stringify(ctx),
      "EX",
      contextTtlSec,
    );

    await this.capacity.touchHeartbeat(interviewId, ctx.userId);
  }

  async deleteContext(interviewId: string): Promise<void> {
    await this.redis.del(SimRedisKeys.context(interviewId));
  }
}
