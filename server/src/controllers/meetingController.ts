import { Response, NextFunction } from 'express';
import { Meeting } from '../models/Meeting.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { activeMeetingsGauge } from '../services/metricsService.js';

// Generate human-friendly meeting code: e.g. INT-924-817
const generateMeetingCode = (): string => {
  const segment1 = Math.floor(100 + Math.random() * 900);
  const segment2 = Math.floor(100 + Math.random() * 900);
  return `INT-${segment1}-${segment2}`;
};

export const createMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, scheduledAt, workspaceId, tags } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Meeting title is required.' });
      return;
    }

    let meetingCode = generateMeetingCode();
    // Ensure uniqueness
    let existing = await Meeting.findOne({ meetingCode });
    while (existing) {
      meetingCode = generateMeetingCode();
      existing = await Meeting.findOne({ meetingCode });
    }

    const meeting = new Meeting({
      title: title.trim(),
      description: description?.trim() || '',
      meetingCode,
      host: req.user!._id,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      status: 'scheduled',
      workspaceId: workspaceId || undefined,
      tags: Array.isArray(tags) ? tags : [],
      participants: [
        {
          user: req.user!._id,
          name: req.user!.name,
          avatar: req.user!.avatar,
          isHost: true,
          joinedAt: new Date()
        }
      ]
    });

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email avatar department role')
      .populate('participants.user', 'name email avatar department role');

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully.',
      meeting: populatedMeeting
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, from, to, favorite, hasSummary, tag } = req.query;

    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (favorite === 'true') {
      filter.isFavorite = true;
    }

    if (hasSummary === 'true') {
      filter.hasSummary = true;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { meetingCode: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
        { tags: { $regex: search as string, $options: 'i' } }
      ];
    }

    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from as string);
      if (to) filter.scheduledAt.$lte = new Date(to as string);
    }

    const meetings = await Meeting.find(filter)
      .populate('host', 'name email avatar department role')
      .populate('participants.user', 'name email avatar department role')
      .sort({ scheduledAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingByCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;
    const meetingCode = code?.toUpperCase().trim();

    const meeting = await Meeting.findOne({ meetingCode })
      .populate('host', 'name email avatar department role')
      .populate('participants.user', 'name email avatar department role');

    if (!meeting) {
      res.status(404).json({ success: false, message: `Meeting with code ${meetingCode} not found.` });
      return;
    }

    res.status(200).json({
      success: true,
      meeting
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id)
      .populate('host', 'name email avatar department role')
      .populate('participants.user', 'name email avatar department role');

    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      meeting
    });
  } catch (error) {
    next(error);
  }
};

export const startMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    meeting.status = 'active';
    meeting.startedAt = meeting.startedAt || new Date();
    await meeting.save();

    activeMeetingsGauge.inc();

    res.status(200).json({
      success: true,
      message: 'Meeting started.',
      meeting
    });
  } catch (error) {
    next(error);
  }
};

export const endMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    meeting.status = 'completed';
    meeting.endedAt = new Date();
    if (meeting.startedAt) {
      const durationSeconds = Math.round((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 1000);
      meeting.duration = durationSeconds;
    } else {
      meeting.duration = 600; // default 10m if start wasn't explicitly tracked
    }

    await meeting.save();

    activeMeetingsGauge.dec();

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully.',
      meeting
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    const isHost = meeting.host.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    if (!isHost && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only the meeting host or an administrator can delete this meeting.'
      });
      return;
    }

    await Meeting.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    meeting.isFavorite = !meeting.isFavorite;
    await meeting.save();

    res.status(200).json({
      success: true,
      isFavorite: meeting.isFavorite,
      message: meeting.isFavorite ? 'Meeting starred.' : 'Meeting unstarred.'
    });
  } catch (error) {
    next(error);
  }
};

