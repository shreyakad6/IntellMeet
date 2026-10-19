import { Router } from 'express';
import {
  generateMeetingTranscript,
  generateMeetingSummary,
  extractActionItems,
  getMeetingSummary,
  getMeetingTranscript
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(authenticate);

// Rate limiter for AI resource-intensive operations (30 requests / 60 seconds)
const aiRateLimit = rateLimiter({ maxRequests: 30, windowSeconds: 60 });

// Transcription
router.post('/meetings/:meetingId/transcribe', aiRateLimit, generateMeetingTranscript);
router.get('/meetings/:meetingId/transcript', getMeetingTranscript);

// Summarization
router.post('/meetings/:meetingId/summary', aiRateLimit, generateMeetingSummary);
router.post('/meetings/:meetingId/summarize', aiRateLimit, generateMeetingSummary);
router.get('/meetings/:meetingId/summary', getMeetingSummary);

// Action item extraction
router.post('/meetings/:meetingId/action-items', aiRateLimit, extractActionItems);

export default router;
