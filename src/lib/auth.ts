import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medimind",
);
const db = client.db();

let authInstance: any;

export async function getAuth() {
  if (authInstance) return authInstance;

  const [{ betterAuth }, { mongodbAdapter }] = await Promise.all([
    import("better-auth"),
    import("better-auth/adapters/mongodb"),
  ]);

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
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
    ],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
  });

  return authInstance;
}

function createLazyAuthProxy() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "api") {
          return new Proxy(
            {},
            {
              get(_apiTarget, apiProp) {
                return async (...args: any[]) => {
                  const instance = await getAuth();
                  return instance.api[apiProp](...args);
                };
              },
            },
          );
        }

        return async (...args: any[]) => {
          const instance = await getAuth();
          const value = instance[prop];

          if (typeof value === "function") {
            return value(...args);
          }

          return value;
        };
      },
    },
  ) as any;
}

export const auth = createLazyAuthProxy();
