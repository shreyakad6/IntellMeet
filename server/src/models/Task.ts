import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  workspaceId: mongoose.Types.ObjectId;
  meetingId?: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId | null;
  reporter: mongoose.Types.ObjectId;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: Date | null;
  tags: string[];
  order: number;
  sourceQuote?: string;
  timestamp?: string;
  speaker?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      index: true
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      index: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    order: {
      type: Number,
      default: 0
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

TaskSchema.index({ workspaceId: 1, status: 1 });

export const Task = mongoose.model<ITaskDocument>('Task', TaskSchema);
