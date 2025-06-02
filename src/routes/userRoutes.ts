import express from 'express';
import { auth, checkRole } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Get managed users (Manager only)
router.get('/managed', auth, checkRole('manager'), async (req, res) => {
  try {
    const users = await User.find({ managedBy: req.user._id }, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching managed users', error });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
});

// Update user role (Admin only)
router.put('/:id/role', auth, checkRole('admin'), async (req, res) => {
  try {
    const { role, managedBy } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role
    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    user.role = role;
    if (role === 'user' && managedBy) {
      user.managedBy = managedBy;
    } else {
      user.managedBy = undefined;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
});

export default router; 