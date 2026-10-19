import { Router } from 'express';
import {
  getActionItems,
  createActionItem,
  updateActionItem,
  convertToTask,
  deleteActionItem
} from '../controllers/actionItemController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getActionItems);
router.post('/', createActionItem);
router.patch('/:id', updateActionItem);
router.post('/:id/convert-to-task', convertToTask);
router.delete('/:id', deleteActionItem);

export default router;
