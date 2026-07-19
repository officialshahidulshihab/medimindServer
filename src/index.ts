import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB, syncIndexes } from "./lib/db.js";
import { auth } from "./lib/auth.js";
import { toNodeHandler } from "better-auth/node";

import doctorRoutes from "./routes/doctors.route.js";
import reviewRoutes from "./routes/reviews.route.js";
import bookmarkRoutes from "./routes/bookmarks.route.js";
import healthProfileRoutes from "./routes/health-profile.route.js";
import healthDocumentRoutes from "./routes/health-documents.route.js";
import drugCheckRoutes from "./routes/drug-checks.route.js";
import symptomSessionRoutes from "./routes/symptom-sessions.route.js";
import blogRoutes from "./routes/blog.route.js";
import aiRoutes from "./routes/ai.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import adminRoutes from "./routes/admin.route.js";
import appointmentRoutes from "./routes/appointments.route.js";
import userRoutes from "./routes/users.route.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Middleware — CORS must be first
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://medimind-client.vercel.app",
      process.env.CLIENT_URL || "",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.options(/(.*)/, cors());
app.use(helmet());
app.use(morgan("dev"));

// BetterAuth handler — must come BEFORE express.json()
app.use("/api/auth", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

// Mount Routes
app.use("/api/doctors", doctorRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/health-profile", healthProfileRoutes);
app.use("/api/health-documents", healthDocumentRoutes);
app.use("/api/drug-checks", drugCheckRoutes);
app.use("/api/symptom-sessions", symptomSessionRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
// Global Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  },
);

// Start Server
export async function startServer() {
  try {
    await connectDB();
    await syncIndexes();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  if (process.env.VERCEL) {
    // In Vercel serverless, we must not call app.listen()
    // We just connect to the database asynchronously.
    connectDB().catch(console.error);
  } else {
    // Local execution
    startServer();
  }
}

export default app;
