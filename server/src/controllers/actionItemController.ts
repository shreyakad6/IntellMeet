import { Response, NextFunction } from 'express';
import { ActionItem } from '../models/ActionItem.js';
import { Task } from '../models/Task.js';
import { Workspace } from '../models/Workspace.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getActionItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { meetingId, status, assignee } = req.query;

    const filter: any = {};
    if (meetingId) filter.meetingId = meetingId;
    if (status && status !== 'all') filter.status = status;
    if (assignee) filter.assignee = assignee;

    const items = await ActionItem.find(filter)
      .populate('assignee', 'name email avatar department')
      .populate('meetingId', 'title meetingCode scheduledAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      actionItems: items
    });
  } catch (error) {
    next(error);
  }
};

export const createActionItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { task, description, meetingId, assignee, priority, dueDate, sourceQuote, timestamp, speaker } = req.body;
    if (!task || !meetingId) {
      res.status(400).json({ success: false, message: 'Task and meetingId are required.' });
      return;
    }

    const actionItem = await ActionItem.create({
      task,
      description,
      meetingId,
      assignee: assignee || null,
      priority: priority || 'medium',
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
      sourceQuote: sourceQuote || '',
      timestamp: timestamp || '',
      speaker: speaker || ''
    });

    const populated = await ActionItem.findById(actionItem._id)
      .populate('assignee', 'name email avatar department')
      .populate('meetingId', 'title meetingCode');

    res.status(201).json({
      success: true,
      message: 'Action item created.',
      actionItem: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateActionItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { task, description, assignee, priority, status, dueDate, sourceQuote, timestamp, speaker } = req.body;

    const item = await ActionItem.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Action item not found.' });
      return;
    }

    if (task !== undefined) item.task = task;
    if (description !== undefined) item.description = description;
    if (assignee !== undefined) item.assignee = assignee || null;
    if (priority !== undefined) item.priority = priority;
    if (status !== undefined) item.status = status;
    if (dueDate !== undefined) item.dueDate = dueDate ? new Date(dueDate) : null;
    if (sourceQuote !== undefined) item.sourceQuote = sourceQuote;
    if (timestamp !== undefined) item.timestamp = timestamp;
    if (speaker !== undefined) item.speaker = speaker;

    await item.save();

    const populated = await ActionItem.findById(item._id)
      .populate('assignee', 'name email avatar department')
      .populate('meetingId', 'title meetingCode');

    res.status(200).json({
      success: true,
      message: 'Action item updated.',
      actionItem: populated
    });
  } catch (error) {
    next(error);
  }
};

export const convertToTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let { workspaceId } = req.body;

    const item = await ActionItem.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Action item not found.' });
      return;
    }

    // If workspace not supplied, pick default workspace
    if (!workspaceId) {
      const defaultWs = await Workspace.findOne();
      if (defaultWs) workspaceId = defaultWs._id;
    }

    if (!workspaceId) {
      res.status(400).json({ success: false, message: 'No workspace available to convert task.' });
      return;
    }

    let taskDescription = item.description || 'Converted from meeting action item';
    if (item.sourceQuote) {
      taskDescription += `\n\n> "${item.sourceQuote}" — ${item.speaker || 'Meeting Participant'}${item.timestamp ? ` [${item.timestamp}]` : ''}`;
    }

    const task = await Task.create({
      title: item.task,
      description: taskDescription,
      workspaceId,
      meetingId: item.meetingId,
      assignee: item.assignee,
      reporter: req.user!._id,
      priority: item.priority,
      status: item.status === 'completed' ? 'done' : 'todo',
      dueDate: item.dueDate,
      tags: ['Action Item', 'Meeting Follow-up'],
      sourceQuote: item.sourceQuote || '',
      timestamp: item.timestamp || '',
      speaker: item.speaker || ''
    });

    item.convertedToTaskId = task._id;
    await item.save();

    res.status(201).json({
      success: true,
      message: 'Action item converted to Workspace Task.',
      task
    });
  } catch (error) {
    next(error);
  }
};

export const deleteActionItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await ActionItem.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Action item not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Action item deleted.'
    });
  } catch (error) {
    next(error);
  }
};
