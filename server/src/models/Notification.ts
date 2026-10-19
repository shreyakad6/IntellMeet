import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'meeting_invite' | 'meeting_starting' | 'task_assigned' | 'action_item_assigned' | 'mention' | 'meeting_summary_ready';
  relatedMeetingId?: mongoose.Types.ObjectId;
  relatedTaskId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'meeting_invite',
        'meeting_starting',
        'task_assigned',
        'action_item_assigned',
        'mention',
        'meeting_summary_ready'
      ],
      required: true
    },
    relatedMeetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting'
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
