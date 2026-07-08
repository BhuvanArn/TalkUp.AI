import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { application } from "@entities/application.entity";
import { user_cv } from "@entities/userCV.entity";

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(application)
    private readonly applicationRepo: Repository<application>,
    @InjectRepository(user_cv)
    private readonly userCvRepo: Repository<user_cv>,
  ) {}
}
