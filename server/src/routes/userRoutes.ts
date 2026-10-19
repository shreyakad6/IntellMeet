import { Router } from 'express';
import { getAllUsers, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAllUsers);
router.patch('/profile', updateProfile);

export default router;
