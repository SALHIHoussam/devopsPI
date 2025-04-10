import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createEmailConfirmation } from './emailTemplates.js'; 

dotenv.config(); // Load environment variables

const transporter = nodemailer.createTransport({
    service: 'gmail', // Change this if using a different service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const BASE_URL = process.env.VERIFYING_EMAIL_URL || 'http://localhost:5000'; // Adjust based on your frontend URL
const EMAIL_SECRET = process.env.EMAIL_SECRET || 'your_secret_key'; 

/**
 * Send an email to a user
 * @param {string} to - Recipient's email
 * @param {string} subject - Email subject
 * @param {string} text - Email content (plain text)
 * @param {string} html - Email content (HTML)
 */
export const sendEmail = async (to, subject, text, html) => {
    try {
        const response = await transporter.sendMail({
            from: `"Sustain Food" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log(`Email sent to ${to}`);
        console.log("Response of email:", response);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email sending failed");
    }
};

/**
 * Send email confirmation link after signup
 * @param {string} userId - The ID of the user
 * @param {string} email - The recipient's email
 * @param {string} verificationToken - The verification token
 */
export const sendEmailConfirmation = async (userId, email, verificationToken) => {
    try {
        // Generate the confirmation link using the provided verification token
        const confirmationLink = `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

        // Email content
        const subject = "Confirm Your Email";
        const text = `Click the following link to confirm your email: ${confirmationLink}`;
        const html = createEmailConfirmation(confirmationLink); // Use the new template

        // Send email
        await sendEmail(email, subject, text, html);
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        throw new Error('Failed to send confirmation email');
    }
};