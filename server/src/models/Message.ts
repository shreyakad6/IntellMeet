import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageDocument extends Document {
  meetingId: mongoose.Types.ObjectId;
  meetingCode: string;
  sender: mongoose.Types.ObjectId;
  senderName: string;
  senderAvatar?: string;
  content: string;
  isSystem: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true
    },
    meetingCode: {
      type: String,
      required: true,
      index: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderAvatar: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: 2000
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

MessageSchema.index({ meetingCode: 1, timestamp: 1 });

export const Message = mongoose.model<IMessageDocument>('Message', MessageSchema);
