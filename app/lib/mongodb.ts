import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

// ❌ Don't crash build on Vercel
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is not defined");
}

const globalWithMongoose = global as typeof global & {
  mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing"); // only fail at runtime
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}