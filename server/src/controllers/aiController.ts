import { Response, NextFunction } from 'express';
import { Meeting } from '../models/Meeting.js';
import { Transcript } from '../models/Transcript.js';
import { MeetingSummary } from '../models/MeetingSummary.js';
import { ActionItem } from '../models/ActionItem.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { AiService } from '../services/aiService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Helper to parse custom text into structured transcript entries
 */
function parseCustomTranscript(text: string, defaultSpeaker = 'Presenter') {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const entryRegex = /^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?(?:([^:]+):\s*)?(.*)$/;
  const entries: { speakerName: string; timestamp: string; text: string; confidence: number }[] = [];

  for (const line of lines) {
    const match = line.match(entryRegex);
    if (match && match[3]) {
      const timestamp = match[1] || '00:00';
      const speakerName = (match[2] && match[2].trim()) || defaultSpeaker;
      const content = match[3].trim();
      if (content) {
        entries.push({
          speakerName,
          timestamp,
          text: content,
          confidence: 0.99
        });
      }
    } else {
      entries.push({
        speakerName: defaultSpeaker,
        timestamp: '00:00',
        text: line,
        confidence: 0.99
      });
    }
  }

  return entries.length > 0
    ? entries
    : [
        {
          speakerName: defaultSpeaker,
          timestamp: '00:00',
          text,
          confidence: 0.99
        }
      ];
}

/**
 * Resolves or compiles a transcript for a meeting from:
 * 1. Existing MongoDB Transcript document
 * 2. Custom transcript provided in request body
 * 3. Meeting chat messages from the live session
 * 4. Audio transcription (if audioPath or DEMO_MODE available)
 */
async function resolveMeetingTranscript(
  meeting: any,
  customTranscript?: string,
  audioPath?: string,
  defaultSpeaker = 'Presenter'
) {
  // 1. Check existing Transcript with valid text
  let transcript = await Transcript.findOne({ meetingId: meeting._id });
  if (transcript && transcript.fullText && transcript.fullText.trim()) {
    return transcript;
  }

  // 2. Custom transcript provided in request body
  if (customTranscript && customTranscript.trim()) {
    const entries = parseCustomTranscript(customTranscript, defaultSpeaker);
    transcript = await Transcript.findOneAndUpdate(
      { meetingId: meeting._id },
      {
        meetingId: meeting._id,
        entries,
        fullText: customTranscript.trim(),
        isDemoMode: false,
        audioDurationSeconds: meeting.duration || 600
      },
      { upsert: true, new: true }
    );
    meeting.hasTranscript = true;
    await meeting.save();
    return transcript;
  }

  // 3. In-meeting chat messages aggregation
  const chatMessages = await Message.find({ meetingId: meeting._id, isSystem: false }).sort({ timestamp: 1 });
  if (chatMessages.length > 0) {
    const entries = chatMessages.map((msg) => ({
      speakerName: msg.senderName || 'Participant',
      timestamp: new Date(msg.timestamp).toISOString().slice(11, 16),
      text: msg.content,
      confidence: 1.0
    }));
    const fullText = chatMessages
      .map((msg) => `[${new Date(msg.timestamp).toISOString().slice(11, 16)}] ${msg.senderName}: ${msg.content}`)
      .join('\n');

    transcript = await Transcript.findOneAndUpdate(
      { meetingId: meeting._id },
      {
        meetingId: meeting._id,
        entries,
        fullText,
        isDemoMode: false,
        audioDurationSeconds: meeting.duration || 600
      },
      { upsert: true, new: true }
    );
    meeting.hasTranscript = true;
    await meeting.save();
    return transcript;
  }

  // 4. Audio transcription via Whisper or DEMO_MODE fallback
  try {
    const transcriptData = await AiService.transcribeAudio(audioPath);
    transcript = await Transcript.findOneAndUpdate(
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
    return transcript;
  } catch {
    return null;
  }
}

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

    const transcript = await resolveMeetingTranscript(
      meeting,
      customTranscript,
      audioPath,
      req.user?.name || 'Presenter'
    );

    if (!transcript) {
      res.status(400).json({
        success: false,
        message:
          'No audio file, speech captions, or meeting chat available for transcription. Please record audio, enable live captions, or provide meeting notes.'
      });
      return;
    }

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
    const { customTranscript } = req.body || {};

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    const transcript = await resolveMeetingTranscript(
      meeting,
      customTranscript,
      undefined,
      req.user?.name || 'Presenter'
    );

    if (!transcript || !transcript.fullText || !transcript.fullText.trim()) {
      res.status(400).json({
        success: false,
        message:
          'No transcript or meeting discussion found to summarize. Please transcribe meeting audio, enable live captions, or provide meeting notes first.'
      });
      return;
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
    const { customTranscript } = req.body || {};

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found.' });
      return;
    }

    const transcript = await resolveMeetingTranscript(
      meeting,
      customTranscript,
      undefined,
      req.user?.name || 'Presenter'
    );

    if (!transcript || !transcript.fullText || !transcript.fullText.trim()) {
      res.status(400).json({
        success: false,
        message:
          'No transcript or meeting discussion found for action item extraction. Please transcribe audio, record captions, or provide notes.'
      });
      return;
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
