// ESM migration fix — src/lib/auth.ts — July 2025
import "dotenv/config";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient } from "./db.js";

const db = mongoClient.db();

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:5000");

const authSecret =
  process.env.BETTER_AUTH_SECRET || "medimind-dev-secret-change-me";

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: authSecret,
  baseURL,
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "patient",
        required: false,
        input: true,
      },
    },
  },
  session: {
    additionalFields: {
      role: {
        type: "string",
      },
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://medimind-client.vercel.app",
    baseURL,
  ].filter(Boolean),
  rateLimit: {
    enabled: false,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});
