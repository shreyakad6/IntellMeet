import { Response, NextFunction } from 'express';
import { Meeting } from '../models/Meeting.js';
import { ActionItem } from '../models/ActionItem.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Meeting counts & durations
    const totalMeetings = await Meeting.countDocuments();
    const completedMeetings = await Meeting.countDocuments({ status: 'completed' });
    const scheduledMeetings = await Meeting.countDocuments({ status: 'scheduled' });
    const activeMeetings = await Meeting.countDocuments({ status: 'active' });

    const completedMeetingDocs = await Meeting.find({ status: 'completed' }).select('duration');
    const totalDurationSeconds = completedMeetingDocs.reduce((sum, m) => sum + (m.duration || 0), 0);
    const avgDurationMinutes = completedMeetings > 0 ? Math.round(totalDurationSeconds / completedMeetings / 60) : 0;

    // 2. Action Items
    const totalActionItems = await ActionItem.countDocuments();
    const completedActionItems = await ActionItem.countDocuments({ status: 'completed' });
    const pendingActionItems = await ActionItem.countDocuments({ status: { $in: ['pending', 'in_progress'] } });
    const actionItemCompletionRate = totalActionItems > 0 ? Math.round((completedActionItems / totalActionItems) * 100) : 0;

    // 3. Tasks
    const totalTasks = await Task.countDocuments();
    const todoTasks = await Task.countDocuments({ status: 'todo' });
    const inProgressTasks = await Task.countDocuments({ status: 'in_progress' });
    const doneTasks = await Task.countDocuments({ status: 'done' });

    // 4. Activity across last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMeetings = await Meeting.find({ scheduledAt: { $gte: sevenDaysAgo } }).select('scheduledAt title');

    // Aggregate by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMeetingCounts: { [key: string]: number } = {};
    days.forEach((d) => (dailyMeetingCounts[d] = 0));

    recentMeetings.forEach((m) => {
      const day = days[new Date(m.scheduledAt).getDay()];
      dailyMeetingCounts[day] = (dailyMeetingCounts[day] || 0) + 1;
    });

    const weeklyActivity = days.map((day) => ({
      day,
      meetings: dailyMeetingCounts[day] || 0
    }));

    // 5. Total active users in the enterprise
    const totalUsers = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      analytics: {
        meetings: {
          total: totalMeetings,
          completed: completedMeetings,
          scheduled: scheduledMeetings,
          active: activeMeetings,
          avgDurationMinutes
        },
        actionItems: {
          total: totalActionItems,
          completed: completedActionItems,
          pending: pendingActionItems,
          completionRate: actionItemCompletionRate
        },
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          done: doneTasks
        },
        weeklyActivity,
        totalUsers
      }
    });
  } catch (error) {
    next(error);
  }
};
