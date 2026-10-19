import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetingDocument extends Document {
  title: string;
  description?: string;
  meetingCode: string;
  host: mongoose.Types.ObjectId;
  participants: Array<{
    user: mongoose.Types.ObjectId;
    joinedAt?: Date;
    leftAt?: Date;
    isHost?: boolean;
    name?: string;
    avatar?: string;
  }>;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  duration?: number; // In seconds
  workspaceId?: mongoose.Types.ObjectId;
  recordingUrl?: string;
  recordingSize?: number;
  hasTranscript: boolean;
  hasSummary: boolean;
  actionItemCount: number;
  isFavorite?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeetingDocument>(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    meetingCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        leftAt: {
          type: Date
        },
        isHost: {
          type: Boolean,
          default: false
        },
        name: String,
        avatar: String
      }
    ],
    scheduledAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    startedAt: {
      type: Date
    },
    endedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    duration: {
      type: Number,
      default: 0
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true
    },
    recordingUrl: {
      type: String,
      default: ''
    },
    recordingSize: {
      type: Number,
      default: 0
    },
    hasTranscript: {
      type: Boolean,
      default: false
    },
    hasSummary: {
      type: Boolean,
      default: false
    },
    actionItemCount: {
      type: Number,
      default: 0
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

MeetingSchema.index({ host: 1, scheduledAt: -1 });
MeetingSchema.index({ status: 1, scheduledAt: -1 });

export const Meeting = mongoose.model<IMeetingDocument>('Meeting', MeetingSchema);
