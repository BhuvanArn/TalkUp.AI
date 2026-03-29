import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import * as request from "supertest";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

import { AppModule } from "../src/app.module";

dotenv.config({ path: `${__dirname}/../.env` });

/**
 * Hits a real Postgres (from .env) and the full Nest stack like production.
 * Requires ORG_PROVISIONING_SECRET and a running DB. Skips if secret is unset.
 */
describe("Organization API (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    if (!process.env.ORG_PROVISIONING_SECRET) {
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix("v1/api");
    await app.init();
    dataSource = app.get(DataSource);
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("POST /organization (provisioning) then GET /organization after admin is active", async () => {
    if (!process.env.ORG_PROVISIONING_SECRET || !app) {
      expect(true).toBe(true);
      return;
    }

    const secret = process.env.ORG_PROVISIONING_SECRET;
    const suffix = Date.now();
    const orgName = `E2EOrg_${suffix}`;
    const email = `e2e_org_${suffix}@example.com`;

    const createRes = await request(app.getHttpServer())
      .post("/v1/api/organization")
      .set("x-org-provisioning-secret", secret)
      .send({
        OrganizationName: orgName,
        OrganizationEmail: email,
      })
      .expect(201);

    const body = createRes.body as {
      adminUser: { username: string; email: string; password: string };
    };
    expect(body.adminUser.email).toBe(email);

    const rows = (await dataSource.query(
      `SELECT user_id FROM user_email WHERE email = $1`,
      [email],
    )) as { user_id: string }[];
    expect(rows.length).toBe(1);
    const userId = rows[0].user_id;

    await dataSource.query(
      `UPDATE "user" SET status = 'ACTIVE' WHERE user_id = $1`,
      [userId],
    );
    await dataSource.query(
      `UPDATE user_email SET is_verified = true WHERE user_id = $1`,
      [userId],
    );

    const agent = request.agent(app.getHttpServer());
    await agent
      .post("/v1/api/auth/login")
      .send({ email, password: body.adminUser.password })
      .expect(200);

    const me = await agent.get("/v1/api/organization").expect(200);
    const org = me.body as {
      organization_name: string;
      members?: { username: string; user_role: string }[];
    };
    expect(org.organization_name).toBe(orgName);
    expect(org.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_role: "admin" }),
      ]),
    );
  }, 60000);
});
