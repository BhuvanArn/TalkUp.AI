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
      expect.arrayContaining([expect.objectContaining({ user_role: "admin" })]),
    );
  }, 60000);

  it("F12→F13→F2→F14: signup, invite, redeem, monitor", async () => {
    if (!process.env.ORG_PROVISIONING_SECRET || !app) {
      expect(true).toBe(true);
      return;
    }

    const suffix = Date.now();
    const orgName = `E2ESelfServe_${suffix}`;
    const adminEmail = `e2e_admin_${suffix}@example.com`;
    const adminPassword = "Abcdefg1*";

    // --- F12: public org signup (202, no tokens, no secret header) ---
    await request(app.getHttpServer())
      .post("/v1/api/auth/register-organization")
      .send({
        organizationName: orgName,
        email: adminEmail,
        password: adminPassword,
      })
      .expect(202);

    // Activate the admin directly in DB (mirrors the existing test's shortcut).
    const adminRows = (await dataSource.query(
      `SELECT user_id FROM user_email WHERE email = $1`,
      [adminEmail],
    )) as { user_id: string }[];
    expect(adminRows.length).toBe(1);
    await dataSource.query(
      `UPDATE "user" SET status = 'ACTIVE' WHERE user_id = $1`,
      [adminRows[0].user_id],
    );
    await dataSource.query(
      `UPDATE user_email SET is_verified = true WHERE user_id = $1`,
      [adminRows[0].user_id],
    );

    const admin = request.agent(app.getHttpServer());
    await admin
      .post("/v1/api/auth/login")
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const orgRes = await admin.get("/v1/api/organization").expect(200);
    const orgId = orgRes.body.organization_id as string;
    expect(orgRes.body.organization_name).toBe(orgName);

    // --- F13: create an invite (bound email, default user role) ---
    const memberEmail = `e2e_member_${suffix}@example.com`;
    const inviteRes = await admin
      .post(`/v1/api/organization/${orgId}/invites`)
      .send({ email: memberEmail })
      .expect(201);
    const code = inviteRes.body.code as string;
    expect(code).toHaveLength(12);
    expect(inviteRes.body.status).toBe("pending");

    // Wrong email must not redeem the bound code.
    await request(app.getHttpServer())
      .post("/v1/api/auth/register")
      .send({
        username: `intruder${suffix}`,
        email: `intruder_${suffix}@example.com`,
        password: "Abcdefg1*",
        organizationCode: code,
      })
      .expect(400);

    // --- F2: bound email redeems the code ---
    await request(app.getHttpServer())
      .post("/v1/api/auth/register")
      .send({
        username: `member${suffix}`,
        email: memberEmail,
        password: "Abcdefg1*",
        organizationCode: code,
      })
      .expect(202);

    const inviteList = await admin
      .get(`/v1/api/organization/${orgId}/invites`)
      .expect(200);
    expect(inviteList.body[0].status).toBe("accepted");

    // Redeemed code cannot be reused by anyone else.
    await request(app.getHttpServer())
      .post("/v1/api/auth/register")
      .send({
        username: `late${suffix}`,
        email: `late_${suffix}@example.com`,
        password: "Abcdefg1*",
        organizationCode: code,
      })
      .expect(400);

    // --- F14: member appears with stats fields; detail endpoint works ---
    const membersRes = await admin.get("/v1/api/organization").expect(200);
    const memberRow = (membersRes.body.members as any[]).find(
      (m) => m.username === `member${suffix}`,
    );
    expect(memberRow).toBeDefined();
    expect(memberRow.user_role).toBe("user");
    expect(memberRow.interviewCount).toBe(0);
    expect(memberRow.avgScore).toBeNull();

    const detail = await admin
      .get(`/v1/api/organization/${orgId}/members/${memberRow.user_id}`)
      .expect(200);
    expect(detail.body.email).toBe(memberEmail);
    expect(detail.body.recentInterviews).toEqual([]);

    // --- F13: promote to employee, then remove ---
    await admin
      .patch(`/v1/api/organization/${orgId}/members/${memberRow.user_id}/role`)
      .send({ role: "employee" })
      .expect(200);

    await admin
      .delete(`/v1/api/organization/${orgId}/members/${memberRow.user_id}`)
      .expect(200);

    // --- F13: revoke a fresh invite ---
    const invite2 = await admin
      .post(`/v1/api/organization/${orgId}/invites`)
      .send({})
      .expect(201);
    await admin
      .delete(`/v1/api/organization/${orgId}/invites/${invite2.body.invite_id}`)
      .expect(200);
    await request(app.getHttpServer())
      .post("/v1/api/auth/register")
      .send({
        username: `revoked${suffix}`,
        email: `revoked_${suffix}@example.com`,
        password: "Abcdefg1*",
        organizationCode: invite2.body.code,
      })
      .expect(400);

    // --- B4: status payload carries role + org ---
    const status = await admin.get("/v1/api/auth/status").expect(200);
    expect(status.body).toEqual({
      authenticated: true,
      role: "admin",
      organizationId: orgId,
    });
  }, 120000);
});
