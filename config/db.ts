import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const dbUri = 'mongodb://localhost/moment_social';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    } as any);
    console.log("We're connected to MongoDB!");
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
