import Task from '../models/Task';
import { User } from '../models/User';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { sendReminderEmail } from './emailService';

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

    // Find tasks with reminders due in the next 5 minutes
    const tasks = await Task.find({
      reminderAt: {
        $gte: now,
        $lte: fiveMinutesFromNow
      },
      status: { $ne: 'completed' }
    }).populate('assignedTo');

    for (const task of tasks) {
      const user = task.assignedTo as any;
      if (user && user.email) {
        // Send email reminder
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: user.email,
          subject: `Reminder: Task "${task.title}" is due soon`,
          html: `
            <h2>Task Reminder</h2>
            <p>Your task "${task.title}" is due soon.</p>
            <p><strong>Description:</strong> ${task.description}</p>
            <p><strong>Due Date:</strong> ${task.dueDate.toLocaleString()}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p>Please log in to the system to update the task status.</p>
          `
        });

        // Update reminder time to avoid duplicate notifications
        task.reminderAt = new Date(task.dueDate);
        await task.save();
      }
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
};

// Function to start the reminder check interval
export const startReminderService = () => {
  // Check for reminders every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      // Find tasks with reminders due in the next 5 minutes
      const tasks = await Task.find({
        reminderAt: {
          $gte: now,
          $lte: fiveMinutesFromNow
        },
        status: { $ne: 'completed' }
      }).populate('assignedTo');

      // Send reminders for each task
      for (const task of tasks) {
        try {
          if (task.assignedTo && task.assignedTo.email) {
            await sendReminderEmail(
              task.assignedTo.email,
              task.title,
              task.dueDate
            );
            
            // Update reminderAt to prevent duplicate reminders
            task.reminderAt = new Date(task.dueDate);
            await task.save();
            console.log(`Reminder sent for task: ${task.title}`);
          }
        } catch (error) {
          console.error(`Failed to send reminder for task ${task._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in reminder service:', error);
    }
  });

  console.log('Reminder service started');
}; 