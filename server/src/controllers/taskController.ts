import { Response, NextFunction } from 'express';
import { Task } from '../models/Task.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceId, status, priority, assignee } = req.query;

    const filter: any = {};
    if (workspaceId) filter.workspaceId = workspaceId;
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar department')
      .populate('reporter', 'name email avatar')
      .populate('meetingId', 'title meetingCode')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, workspaceId, meetingId, assignee, priority, status, dueDate, tags } = req.body;

    if (!title || !workspaceId) {
      res.status(400).json({ success: false, message: 'Title and workspaceId are required.' });
      return;
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      workspaceId,
      meetingId: meetingId || undefined,
      assignee: assignee || null,
      reporter: req.user!._id,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: tags || []
    });

    if (assignee && assignee !== req.user!._id.toString()) {
      await Notification.create({
        recipient: assignee,
        title: 'New Task Assigned',
        message: `${req.user!.name} assigned task "${title}" to you.`,
        type: 'task_assigned',
        relatedTaskId: task._id
      });
    }

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar department')
      .populate('reporter', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Task created.',
      task: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, assignee, priority, status, dueDate, tags, order } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (assignee !== undefined) {
      const prevAssignee = task.assignee?.toString();
      task.assignee = assignee || null;
      if (assignee && assignee !== prevAssignee && assignee !== req.user!._id.toString()) {
        await Notification.create({
          recipient: assignee,
          title: 'Task Assigned',
          message: `${req.user!.name} assigned task "${task.title}" to you.`,
          type: 'task_assigned',
          relatedTaskId: task._id
        });
      }
    }
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) task.tags = tags;
    if (order !== undefined) task.order = order;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar department')
      .populate('reporter', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Task updated.',
      task: populated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
