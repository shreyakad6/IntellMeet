import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscriptEntryItem {
  speakerId?: mongoose.Types.ObjectId;
  speakerName: string;
  timestamp: string;
  text: string;
  confidence?: number;
}

export interface ITranscriptDocument extends Document {
  meetingId: mongoose.Types.ObjectId;
  entries: ITranscriptEntryItem[];
  fullText: string;
  isDemoMode: boolean;
  audioDurationSeconds?: number;
  audioSource?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema = new Schema<ITranscriptDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true,
      index: true
    },
    entries: [
      {
        speakerId: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        speakerName: {
          type: String,
          required: true
        },
        timestamp: {
          type: String,
          default: '00:00'
        },
        text: {
          type: String,
          required: true
        },
        confidence: {
          type: Number,
          default: 0.95
        }
      }
    ],
    fullText: {
      type: String,
      required: true
    },
    isDemoMode: {
      type: Boolean,
      default: false
    },
    audioDurationSeconds: {
      type: Number,
      default: 0
    },
    audioSource: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Transcript = mongoose.model<ITranscriptDocument>('Transcript', TranscriptSchema);
