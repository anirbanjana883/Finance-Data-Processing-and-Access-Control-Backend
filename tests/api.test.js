import 'dotenv/config';
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Enterprise API Integration Tests", () => {
  // Variables to hold our tokens for the later tests
  let adminToken = "";
  let viewerToken = "";

  const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
  const VIEWER_EMAIL = process.env.TEST_VIEWER_EMAIL; 
  const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
  const VIEWER_PASSWORD = process.env.TEST_VIEWER_PASSWORD;
  const ORG_ID = process.env.TEST_ORG_ID ;

  console.log("🔍 CHECKING ENV:", ADMIN_EMAIL, ORG_ID, VIEWER_EMAIL);

  // AUTHENTICATION TESTS
  describe("1. Auth Tests", () => {
    it("✔ login success (Admin)", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, 
        orgId: ORG_ID,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");

      // Save the token for the Admin tests
      adminToken = response.body.data.token;
    });

    it("✔ login success (Viewer)", async () => {
      const response = await request(app).post("/api/auth/login").send({ 
        email: VIEWER_EMAIL, 
        password: VIEWER_PASSWORD, 
        orgId: ORG_ID 
    });

      expect(response.status).toBe(200);
      viewerToken = response.body.data.token;
    });

    it("✔ invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: ADMIN_EMAIL,
        password: "wrongpassword",
        orgId: ORG_ID,
      });

      // Should be rejected with a 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // RBAC (ROLE-BASED ACCESS CONTROL) TESTS
  describe("2. RBAC Tests", () => {
    it("✔ viewer cannot access /transactions", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${viewerToken}`);

      // Expect a 403 Forbidden because Viewers are blocked from raw ledger data
      expect(response.status).toBe(403);
      expect(response.body.message).toContain("not allowed");
    });

    it("✔ admin can access /transactions", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${adminToken}`);

      // Expect a 200 OK because Admins have full access
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // DASHBOARD ANALYTICS TESTS
  describe("3. Dashboard Tests", () => {
    it("✔ returns correct structure", async () => {
      const response = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Verify the elite structure we built exists
      const data = response.body.data;
      expect(data).toHaveProperty("summary");
      expect(data).toHaveProperty("monthlyComparison");
      expect(data).toHaveProperty("categoryBreakdown");
      expect(data).toHaveProperty("recentTransactions");
      expect(data).toHaveProperty("insights");
    });

    it("✔ returns data (not empty)", async () => {
      const response = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      const data = response.body.data;

      // Verify that the database actually aggregated numbers
      expect(typeof data.summary.totalBalance).toBe("number");
      expect(typeof data.summary.totalRecords).toBe("number");

      // Ensure arrays exist, even if they are empty depending on seed data
      expect(Array.isArray(data.recentTransactions)).toBe(true);
      expect(Array.isArray(data.monthlyComparison)).toBe(true);
    });
  });
});
