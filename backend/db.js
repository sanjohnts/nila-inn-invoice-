import mongoose from 'mongoose';

export async function connectDB(uri, dbName){
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
    retryWrites: true,
    socketTimeoutMS: 45000,
  });
  console.log('MongoDB connected (database: ' + mongoose.connection.name + ')');
}
