import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspaceDocument extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: 'admin' | 'member';
    joinedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

WorkspaceSchema.index({ 'members.user': 1 });

export const Workspace = mongoose.model<IWorkspaceDocument>('Workspace', WorkspaceSchema);
