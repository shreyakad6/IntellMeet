import { Response, NextFunction } from 'express';
import { Message } from '../models/Message.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getMessagesByMeeting = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { meetingCode } = req.params;

    const messages = await Message.find({ meetingCode: meetingCode.toUpperCase() })
      .populate('sender', 'name email avatar')
      .sort({ timestamp: 1 })
      .limit(200);

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    next(error);
  }
};
