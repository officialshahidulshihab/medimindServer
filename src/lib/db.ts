import "dotenv/config";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medimind";

export const mongoClient = new MongoClient(MONGO_URI);

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    await mongoClient.connect();
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    await Promise.all([mongoose.connect(MONGO_URI), mongoClient.connect()]);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function syncIndexes() {
  try {
    console.log("Syncing MongoDB indexes...");
    const models = mongoose.models;
    for (const modelName in models) {
      await models[modelName].syncIndexes();
    }
    console.log("Indexes synchronized successfully");
  } catch (error) {
    console.error("Error syncing indexes:", error);
  }
}
