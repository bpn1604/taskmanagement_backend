import { Request, Response } from 'express';
import Task from '../models/Task';
import User from '../models/User';

// Create a new task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, dueDate, reminderAt, assignedTo } = req.body;

    // Validate if the assigned user exists and is managed by the current user (if manager)
    if (req.user.role === 'manager') {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser || assignedUser.managedBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only assign tasks to users you manage' });
      }
    }

    const task = new Task({
      title,
      description,
      priority,
      dueDate,
      reminderAt,
      assignedTo,
      createdBy: req.user._id
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
};

// Get tasks based on user role
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const query: any = {};
    
    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Role-based filtering
    if (req.user.role === 'user') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      const managedUsers = await User.find({ managedBy: req.user._id });
      const userIds = managedUsers.map(user => user._id);
      query.assignedTo = { $in: userIds };
    }
    // Admin can see all tasks

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// Get a single task
export const getTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

// Update a task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only allow status updates for regular users
    if (req.user.role === 'user') {
      if (Object.keys(updates).length > 1 || !updates.status) {
        return res.status(403).json({ message: 'Users can only update task status' });
      }
    }

    // For managers, check if they manage the assigned user
    if (req.user.role === 'manager' && updates.assignedTo) {
      const assignedUser = await User.findById(updates.assignedTo);
      if (!assignedUser || assignedUser.managedBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only assign tasks to users you manage' });
      }
    }

    Object.assign(task, updates);
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
};

// Delete a task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
};

// Update task status
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task status', error });
  }
}; 