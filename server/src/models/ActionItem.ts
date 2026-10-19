import mongoose, { Document, Schema } from 'mongoose';

export interface IActionItemDocument extends Document {
  task: string;
  description?: string;
  assignee?: mongoose.Types.ObjectId | null;
  assigneeName?: string;
  dueDate?: Date | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  meetingId: mongoose.Types.ObjectId;
  workspaceId?: mongoose.Types.ObjectId;
  convertedToTaskId?: mongoose.Types.ObjectId;
  extractedByAi: boolean;
  sourceQuote?: string;
  timestamp?: string;
  speaker?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema<IActionItemDocument>(
  {
    task: {
      type: String,
      required: [true, 'Task action is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assigneeName: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true
    },
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace'
    },
    convertedToTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    extractedByAi: {
      type: Boolean,
      default: true
    },
    sourceQuote: {
      type: String,
      default: ''
    },
    timestamp: {
      type: String,
      default: ''
    },
    speaker: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const ActionItem = mongoose.model<IActionItemDocument>('ActionItem', ActionItemSchema);
