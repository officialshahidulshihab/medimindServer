import app from '../src/index';
import { connectDB, syncIndexes } from '../src/lib/db';

// Ensure DB is connected before handling requests (cached across invocations)
let isInitialized = false;

async function initialize() {
  if (!isInitialized) {
    await connectDB();
    await syncIndexes();
    isInitialized = true;
  }
}

export default async function handler(req: any, res: any) {
  await initialize();
  // Delegate to Express
  return new Promise<void>((resolve, reject) => {
    (app as any)(req, res, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
