import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find({ isActive: true })
      .select('_id name email role department avatar')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, department, avatar } = req.body;
    if (name) req.user.name = name.trim();
    if (department) req.user.department = department.trim();
    if (avatar !== undefined) req.user.avatar = avatar;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};
