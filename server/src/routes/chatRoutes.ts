import { Router } from 'express';
import { getMessagesByMeeting } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/:meetingCode', getMessagesByMeeting);

export default router;
