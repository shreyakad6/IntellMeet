import { Router } from 'express';
import { getWorkspaces, createWorkspace, addMember } from '../controllers/workspaceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.post('/:id/members', addMember);

export default router;
