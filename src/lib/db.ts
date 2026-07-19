import mongoose from 'mongoose';

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; // Let the caller handle it (Vercel will return 500)
  }
}

export async function syncIndexes() {
  try {
    console.log('Syncing MongoDB indexes...');
    const models = mongoose.models;
    for (const modelName in models) {
      await models[modelName].syncIndexes();
    }
    console.log('Indexes synchronized successfully');
  } catch (error) {
    console.error('Error syncing indexes:', error);
  }
}
