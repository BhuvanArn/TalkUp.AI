import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

import { AppModule } from "./app.module";

import initSwagger from "@config/swagger.config";

// dotenv
import * as dotenv from "dotenv";
import * as cookieParser from "cookie-parser";
dotenv.config();

async function bootstrap() {
  try {
    process.stdout.write(`Starting application bootstrap...\n`);
    process.stdout.write(`Node version: ${process.version}\n`);
    process.stdout.write(`Platform: ${process.platform}\n`);

    const app = await NestFactory.create(AppModule, { abortOnError: false });
    const port = process.env.PORT ?? process.env.SERVER_PORT ?? 3000;
    process.stdout.write(`Using port: ${port}\n`);

    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    app.setGlobalPrefix("v1/api");

    const corsOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins =
      corsOrigin === "*" ? null : (corsOrigin?.split(",") ?? []);

    app.enableCors({
      origin: (
        origin: string,
        callback: (arg0: Error | null, arg1: boolean | undefined) => void,
      ) => {
        if (!origin) return callback(null, true);

        if (corsOrigin === "*") return callback(null, true);

        if (allowedOrigins?.includes(origin)) return callback(null, true);

        if (origin.includes("talk-up-ai") && origin.endsWith(".vercel.app")) {
          return callback(null, true);
        }

        if (origin.includes("localhost")) return callback(null, true);

        callback(new Error("Not allowed by CORS"), false);
      },
      methods: process.env.CORS_METHODS ?? "GET,PUT,PATCH,POST,DELETE",
      allowedHeaders:
        process.env.CORS_ALLOWED_HEADERS ?? "Content-Type,Accept,Authorization",
      exposedHeaders:
        process.env.CORS_EXPOSED_HEADERS ?? "Content-Type,Accept,Authorization",
      credentials: true,
    });

    initSwagger(app);

    // Listen on 0.0.0.0 to accept external connections (Railway requirement)
    await app.listen(port, "0.0.0.0");
    process.stdout.write(`Server is running on http://0.0.0.0:${port}\n`);
    process.stdout.write(
      `Environment: ${process.env.NODE_ENV ?? "development"}\n`,
    );
    process.stdout.write(`Process PID: ${process.pid}\n`);
    process.stdout.write(
      `Server started successfully at ${new Date().toISOString()}\n`,
    );

    // Keep the process alive
    process.stdout.write(`Keeping process alive...\n`);

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      process.stdout.write(
        `\nReceived ${signal} signal. Starting graceful shutdown...\n`,
      );
      process.stdout.write(`Timestamp: ${new Date().toISOString()}\n`);

      try {
        await app.close();
        process.stdout.write(`Server closed successfully.\n`);
        process.exit(0);
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        process.stdout.write(`Error during shutdown: ${error.message}\n`);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGUSR2", () => shutdown("SIGUSR2"));

    // Log unhandled errors
    process.on("uncaughtException", (error) => {
      process.stdout.write(`Uncaught Exception: ${error.message}\n`);
      process.stdout.write(`Stack: ${error.stack}\n`);
    });

    process.on("unhandledRejection", (reason) => {
      process.stdout.write(`Unhandled Rejection: ${reason}\n`);
    });

    // Ensure the process stays alive
    process.on("exit", (code) => {
      process.stdout.write(`Process exiting with code: ${code}\n`);
    });

    process.on("beforeExit", (code) => {
      process.stdout.write(`Before exit event with code: ${code}\n`);
    });

    // Log that we're waiting for connections
    process.stdout.write(`Bootstrap complete. Waiting for requests...\n`);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    process.stdout.write(`Fatal error during bootstrap: ${error.message}\n`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    process.stdout.write(`Stack: ${error.stack}\n`);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  process.stdout.write(`Unhandled bootstrap error: ${error.message}\n`);
  process.stdout.write(`Stack: ${error.stack}\n`);
  process.exit(1);
});
