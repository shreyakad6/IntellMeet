import { Response, NextFunction } from 'express';
import { Meeting } from '../models/Meeting.js';
import { Transcript } from '../models/Transcript.js';
import { MeetingSummary } from '../models/MeetingSummary.js';
import { ActionItem } from '../models/ActionItem.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AiService } from '../services/aiService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const generateMeetingTranscript = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const { audioPath, customTranscript } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    let transcriptData;
    if (customTranscript) {
      transcriptData = {
        fullText: customTranscript,
        entries: [
          {
            speakerName: req.user?.name || 'Presenter',
            timestamp: '00:00',
            text: customTranscript,
            confidence: 0.99
          }
        ],
        isDemoMode: false
      };
    } else {
      transcriptData = await AiService.transcribeAudio(audioPath);
    }

    const transcript = await Transcript.findOneAndUpdate(
      { meetingId: meeting._id },
      {
        meetingId: meeting._id,
        entries: transcriptData.entries,
        fullText: transcriptData.fullText,
        isDemoMode: transcriptData.isDemoMode,
        audioDurationSeconds: meeting.duration || 600
      },
      { upsert: true, new: true }
    );

    meeting.hasTranscript = true;
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting transcript generated successfully.',
      transcript
    });
  } catch (error) {
    next(error);
  }
};

export const generateMeetingSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    // Get or auto-generate transcript
    let transcript = await Transcript.findOne({ meetingId: meeting._id });
    if (!transcript) {
      const transcriptData = await AiService.transcribeAudio();
      transcript = await Transcript.create({
        meetingId: meeting._id,
        entries: transcriptData.entries,
        fullText: transcriptData.fullText,
        isDemoMode: transcriptData.isDemoMode,
        audioDurationSeconds: meeting.duration || 600
      });
      meeting.hasTranscript = true;
      await meeting.save();
    }

    const summaryResult = await AiService.generateSummary(transcript.fullText);

    const summary = await MeetingSummary.findOneAndUpdate(
      { meetingId: meeting._id },
      {
        meetingId: meeting._id,
        summary: summaryResult.summary,
        keyPoints: summaryResult.keyPoints,
        decisions: summaryResult.decisions,
        topicsCovered: summaryResult.topicsCovered,
        sentiment: summaryResult.sentiment,
        generatedByAi: true,
        isDemoMode: summaryResult.isDemoMode,
        modelUsed: summaryResult.modelUsed
      },
      { upsert: true, new: true }
    );

    meeting.hasSummary = true;
    await meeting.save();

    // Trigger in-app notification to host
    await Notification.create({
      recipient: meeting.host,
      title: 'AI Summary Ready',
      message: `AI summary and key decisions are ready for meeting: ${meeting.title}`,
      type: 'meeting_summary_ready',
      relatedMeetingId: meeting._id
    });

    res.status(200).json({
      success: true,
      message: 'Meeting summary generated successfully.',
      summary
    });
  } catch (error) {
    next(error);
  }
};

export const extractActionItems = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    let transcript = await Transcript.findOne({ meetingId: meeting._id });
    if (!transcript) {
      const transcriptData = await AiService.transcribeAudio();
      transcript = await Transcript.create({
        meetingId: meeting._id,
        entries: transcriptData.entries,
        fullText: transcriptData.fullText,
        isDemoMode: transcriptData.isDemoMode
      });
    }

    const { actionItems, isDemoMode } = await AiService.extractActionItems(transcript.fullText);

    // Fetch team users to match assignee names if possible
    const users = await User.find({ isActive: true });

    const createdActionItems = [];
    for (const item of actionItems) {
      let matchedUserId = null;
      if (item.assigneeName) {
        const matchedUser = users.find(
          (u) =>
            u.name.toLowerCase().includes(item.assigneeName!.toLowerCase()) ||
            item.assigneeName!.toLowerCase().includes(u.name.toLowerCase())
        );
        if (matchedUser) {
          matchedUserId = matchedUser._id;
        }
      }

      const created = await ActionItem.create({
        task: item.task,
        description: item.description,
        assignee: matchedUserId,
        assigneeName: item.assigneeName || 'Unassigned',
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        priority: item.priority || 'medium',
        status: 'pending',
        meetingId: meeting._id,
        workspaceId: meeting.workspaceId,
        extractedByAi: true,
        sourceQuote: item.sourceQuote || '',
        timestamp: item.timestamp || '',
        speaker: item.speaker || ''
      });

      createdActionItems.push(created);

      // Notify matched assignee
      if (matchedUserId) {
        await Notification.create({
          recipient: matchedUserId,
          title: 'New Action Item Assigned',
          message: `You were assigned: "${item.task}" from meeting "${meeting.title}"`,
          type: 'action_item_assigned',
          relatedMeetingId: meeting._id
        });
      }
    }

    meeting.actionItemCount = createdActionItems.length;
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Action items extracted successfully.',
      isDemoMode,
      actionItems: createdActionItems
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const summary = await MeetingSummary.findOne({ meetingId });
    if (!summary) {
      res.status(404).json({ success: false, message: 'Summary not generated for this meeting yet.' });
      return;
    }

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingTranscript = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const transcript = await Transcript.findOne({ meetingId });
    if (!transcript) {
      res.status(404).json({ success: false, message: 'Transcript not generated for this meeting yet.' });
      return;
    }

    res.status(200).json({
      success: true,
      transcript
    });
  } catch (error) {
    next(error);
  }
};
