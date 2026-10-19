import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error event:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting reconnection...');
      isConnected = false;
    });
  } catch (error) {
    console.error('[MongoDB] Initial connection error:', error);
    // Don't kill process immediately to allow graceful status reporting
    throw error;
  }
};

export const getDbStatus = (): { connected: boolean; state: string } => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    connected: stateCode === 1,
    state: states[stateCode] || 'unknown'
  };
};
