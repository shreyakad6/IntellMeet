import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Rate limit login/register attempts: 20 per 15 minutes
const authRateLimit = rateLimiter({ maxRequests: 20, windowSeconds: 900 });

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
