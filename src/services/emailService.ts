import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendReminderEmail = async (
  to: string,
  taskTitle: string,
  dueDate: Date
) => {
  const formattedDate = new Date(dueDate).toLocaleString();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Task Manager" <noreply@taskmanager.com>',
    to,
    subject: `Reminder: Task "${taskTitle}" is due soon`,
    html: `
      <h2>Task Reminder</h2>
      <p>This is a reminder that your task "${taskTitle}" is due soon.</p>
      <p><strong>Due Date:</strong> ${formattedDate}</p>
      <p>Please make sure to complete the task before the deadline.</p>
      <br>
      <p>Best regards,</p>
      <p>Task Manager Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${to} for task "${taskTitle}"`);
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

// Verify email configuration on startup
transporter.verify((error) => {
  if (error) {
    console.error('Email service configuration error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
}); 