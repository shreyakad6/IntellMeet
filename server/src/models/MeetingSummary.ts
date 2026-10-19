import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetingSummaryDocument extends Document {
  meetingId: mongoose.Types.ObjectId;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  topicsCovered: string[];
  followUpSuggestions: string[];
  sentiment: 'positive' | 'neutral' | 'constructive' | 'mixed';
  generatedByAi: boolean;
  isDemoMode: boolean;
  modelUsed: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSummarySchema = new Schema<IMeetingSummaryDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true,
      index: true
    },
    summary: {
      type: String,
      required: true
    },
    keyPoints: {
      type: [String],
      default: []
    },
    decisions: {
      type: [String],
      default: []
    },
    topicsCovered: {
      type: [String],
      default: []
    },
    followUpSuggestions: {
      type: [String],
      default: []
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'constructive', 'mixed'],
      default: 'neutral'
    },
    generatedByAi: {
      type: Boolean,
      default: true
    },
    isDemoMode: {
      type: Boolean,
      default: false
    },
    modelUsed: {
      type: String,
      default: 'gpt-4o-mini'
    }
  },
  {
    timestamps: true
  }
);

export const MeetingSummary = mongoose.model<IMeetingSummaryDocument>('MeetingSummary', MeetingSummarySchema);
