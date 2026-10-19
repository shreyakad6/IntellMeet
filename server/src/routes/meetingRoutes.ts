import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingByCode,
  getMeetingById,
  startMeeting,
  endMeeting,
  deleteMeeting,
  toggleFavorite
} from '../controllers/meetingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/code/:code', getMeetingByCode);
router.get('/:id', getMeetingById);
router.patch('/:id/start', startMeeting);
router.patch('/:id/end', endMeeting);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteMeeting);

export default router;
