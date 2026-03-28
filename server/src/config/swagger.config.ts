import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from "@nestjs/swagger";

import { INestApplication } from "@nestjs/common";

// used for swagger
import { version } from "../../package.json";

export default function initSwagger(app: INestApplication) {
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("TalkUp API")
    .addApiKey(
      {
        type: "apiKey",
        in: "header",
        name: "x-org-provisioning-secret",
        description:
          "Internal-only secret for creating an organization (POST /organization). Must match server env ORG_PROVISIONING_SECRET. End-user routes use the httpOnly accessToken cookie from login/register, not this header.",
      },
      "org-provisioning",
    )
    .setDescription("This is the API documentation of Talkup's backend")
    .setVersion(version || "1.0.0")
    .addGlobalResponse({
      status: 500,
      description: "Internal server error",
    })
    .addGlobalResponse({
      status: 401,
      description: "Unauthorized",
    })
    .addGlobalResponse({
      status: 403,
      description: "Forbidden",
    })
    .build();

  const options: SwaggerCustomOptions = {
    useGlobalPrefix: true, // tells the UI path to use the global prefix.
  };

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, documentFactory, options); // the UI will be located in /v1/api/docs
}
