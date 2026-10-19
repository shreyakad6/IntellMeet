import { Response, NextFunction } from 'express';
import { Workspace } from '../models/Workspace.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getWorkspaces = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user!._id }, { 'members.user': req.user!._id }]
    })
      .populate('owner', 'name email avatar department')
      .populate('members.user', 'name email avatar department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Workspace name is required.' });
      return;
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user!._id,
      members: [
        {
          user: req.user!._id,
          role: 'admin',
          joinedAt: new Date()
        }
      ]
    });

    const populated = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar department')
      .populate('members.user', 'name email avatar department');

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      workspace: populated
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found.' });
      return;
    }

    const isOwner = workspace.owner.toString() === req.user!._id.toString();
    const isAdminMember = workspace.members.some(
      (m) => m.user.toString() === req.user!._id.toString() && m.role === 'admin'
    );
    const isSystemAdmin = req.user!.role === 'admin';

    if (!isOwner && !isAdminMember && !isSystemAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only workspace owners or workspace administrators can invite members.'
      });
      return;
    }

    const alreadyMember = workspace.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      res.status(400).json({ success: false, message: 'User is already a member of this workspace.' });
      return;
    }

    workspace.members.push({
      user: userId,
      role: role === 'admin' ? 'admin' : 'member',
      joinedAt: new Date()
    });

    await workspace.save();

    const populated = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar department')
      .populate('members.user', 'name email avatar department');

    res.status(200).json({
      success: true,
      message: 'Member added successfully.',
      workspace: populated
    });
  } catch (error) {
    next(error);
  }
};
