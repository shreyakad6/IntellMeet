import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import meetingRoutes from './meetingRoutes.js';
import chatRoutes from './chatRoutes.js';
import aiRoutes from './aiRoutes.js';
import actionItemRoutes from './actionItemRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import taskRoutes from './taskRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/chat', chatRoutes);
router.use('/ai', aiRoutes);
router.use('/action-items', actionItemRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
