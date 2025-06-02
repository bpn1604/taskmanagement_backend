import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus
} from '../controllers/taskController';
import { auth, checkRole, isTaskOwnerOrAdmin } from '../middleware/auth';

const router = express.Router();

// Get all tasks (filtered by role)
router.get('/', auth, getTasks);

// Get single task
router.get('/:id', auth, isTaskOwnerOrAdmin, getTask);

// Create task (Admin and Manager only)
router.post('/', auth, checkRole('admin', 'manager'), createTask);

// Update task
router.put('/:id', auth, isTaskOwnerOrAdmin, updateTask);

// Delete task (Admin only)
router.delete('/:id', auth, checkRole('admin'), deleteTask);

// Update task status (All authenticated users)
router.post('/:id/status', auth, isTaskOwnerOrAdmin, updateTaskStatus);

export default router; 