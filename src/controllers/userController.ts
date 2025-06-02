import { Request, Response } from 'express';
import { User, UserRole } from '../models/User';

// Get all users (Admin only)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get users managed by manager
export const getManagedUsers = async (req: Request, res: Response) => {
  try {
    const managerId = req.user?.userId;
    const users = await User.find({ managedBy: managerId }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching managed users' });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role, managedBy } = req.body;
    const userId = req.params.id;

    // Prevent self-role update
    if (userId === req.user?.userId) {
      return res.status(400).json({ message: 'Cannot update your own role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update role and manager
    user.role = role as UserRole;
    if (role === UserRole.USER && managedBy) {
      const manager = await User.findById(managedBy);
      if (!manager || manager.role !== UserRole.MANAGER) {
        return res.status(400).json({ message: 'Invalid manager assigned' });
      }
      user.managedBy = managedBy;
    } else {
      user.managedBy = undefined;
    }

    await user.save();
    const updatedUser = await User.findById(userId).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
};

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();
    const updatedUser = await User.findById(userId).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile' });
  }
}; 