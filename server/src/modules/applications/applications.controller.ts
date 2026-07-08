import { Controller, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { ApplicationsService } from "./applications.service";

@ApiTags("Applications")
@UseGuards(AccessTokenGuard)
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}
}
