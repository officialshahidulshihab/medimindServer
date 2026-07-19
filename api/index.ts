import app from '../src/index';
import { connectDB, syncIndexes } from '../src/lib/db';

// Connection is cached across warm serverless invocations
let isReady = false;

export default async function handler(req: any, res: any) {
  if (!isReady) {
    await connectDB();
    await syncIndexes();
    isReady = true;
  }

  return new Promise<void>((resolve, reject) => {
    (app as any)(req, res, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
