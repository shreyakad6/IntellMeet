import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;
let isConnecting = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || isConnecting) {
    return;
  }

  isConnecting = true;
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });

    isConnected = true;
    isConnecting = false;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error event:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting reconnection...');
      isConnected = false;
      setTimeout(() => {
        if (!isConnected && mongoose.connection.readyState === 0) {
          connectDB().catch(() => {});
        }
      }, 5000);
    });
  } catch (error: any) {
    isConnected = false;
    isConnecting = false;
    console.error('[MongoDB] Connection attempt failed:', error.message || error);
    
    // Auto-retry connection in background after 10s
    setTimeout(() => {
      if (!isConnected && mongoose.connection.readyState === 0) {
        console.log('[MongoDB] Retrying database connection...');
        connectDB().catch(() => {});
      }
    }, 10000);

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
