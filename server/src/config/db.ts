import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;
let isConnecting = false;
let isExplicitDisconnect = false;
let listenersAttached = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || isConnecting) {
    return;
  }

  isExplicitDisconnect = false;
  isConnecting = true;
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });

    isConnected = true;
    isConnecting = false;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    if (!listenersAttached) {
      listenersAttached = true;
      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error event:', err);
      });

      mongoose.connection.on('disconnected', () => {
        isConnected = false;
        if (isExplicitDisconnect || config.NODE_ENV === 'test') {
          return;
        }
        console.warn('[MongoDB] Disconnected. Attempting reconnection...');
        setTimeout(() => {
          if (!isConnected && !isExplicitDisconnect && mongoose.connection.readyState === 0) {
            connectDB().catch(() => {});
          }
        }, 5000);
      });
    }
  } catch (error: any) {
    isConnected = false;
    isConnecting = false;
    console.error('[MongoDB] Connection attempt failed:', error.message || error);
    
    // Auto-retry connection in background after 10s if not test or explicit disconnect
    if (!isExplicitDisconnect && config.NODE_ENV !== 'test') {
      setTimeout(() => {
        if (!isConnected && !isExplicitDisconnect && mongoose.connection.readyState === 0) {
          console.log('[MongoDB] Retrying database connection...');
          connectDB().catch(() => {});
        }
      }, 10000);
    }

    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  isExplicitDisconnect = true;
  isConnected = false;
  isConnecting = false;
  await mongoose.disconnect();
};

export const getDbStatus = (): { connected: boolean; state: string } => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateCode = mongoose.connection.readyState;
  return {
    connected: stateCode === 1,
    state: states[stateCode] || 'unknown'
  };
};
