// emailTemplates.js

const platformUrl = process.env.PLATFORM_URL || 'https://sustainfood.com';
const BASE_URL = process.env.VERIFYING_EMAIL_URL || 'http://localhost:5000'; // Adjust based on your frontend URL

// Welcome Email Template
export const createWelcomeEmail = (name, role) => {
    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    h2 {
                        color: #ff7043;
                        font-size: 26px;
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    p {
                        color: #555;
                        font-size: 16px;
                        line-height: 1.5;
                        text-align: center;
                    }
                    .button {
                        display: inline-block;
                        background-color: #ff7043;
                        color: #fff;
                        padding: 12px 25px;
                        font-size: 16px;
                        font-weight: bold;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 20px;
                        text-align: center;
                        display: block;
                        width: 100%;
                    }
                    .button:hover {
                        background-color: #e64a19;
                    }
                    .footer {
                        font-size: 12px;
                        color: #aaa;
                        text-align: center;
                        margin-top: 30px;
                    }
                    .footer a {
                        color: #ff7043;
                        text-decoration: none;
                    }
                    @media screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
                        h2 {
                            font-size: 22px;
                        }
                        .button {
                            padding: 10px 20px;
                            font-size: 14px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Hello, ${name}!</h2>
                    <p>Thank you for registering on our platform as a <b>${role}</b>.</p>
                    <p>We are excited to have you on board!</p>
                    <a href="${platformUrl}" class="button">Get Started</a>
                    <div class="footer">
                        <p>Best Regards,</p>
                        <p>The Team</p>
                        <p><a href="${platformUrl}">Visit Our Website</a></p>
                    </div>
                </div>
            </body>
        </html>
    `;
};

// Password Reset Email Template
export const createPasswordResetEmail = (name, resetURL) => {
    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    h2 {
                        color: #ff7043;
                        font-size: 26px;
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    p {
                        color: #555;
                        font-size: 16px;
                        line-height: 1.5;
                        text-align: center;
                    }
                    .button {
                        display: inline-block;
                        background-color: #ff7043;
                        color: #fff;
                        padding: 12px 25px;
                        font-size: 16px;
                        font-weight: bold;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 20px;
                        text-align: center;
                        display: block;
                        width: 100%;
                    }
                    .button:hover {
                        background-color: #e64a19;
                    }
                    .footer {
                        font-size: 12px;
                        color: #aaa;
                        text-align: center;
                        margin-top: 30px;
                    }
                    .footer a {
                        color: #ff7043;
                        text-decoration: none;
                    }
                    @media screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
                        h2 {
                            font-size: 22px;
                        }
                        .button {
                            padding: 10px 20px;
                            font-size: 14px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Hello, ${name}!</h2>
                    <p>You requested a password reset. Click the button below to reset your password.</p>
                    <a href="${resetURL}" class="button">Reset Password</a>
                    <div class="footer">
                        <p>If you did not request this, please ignore this email.</p>
                        <p>Best Regards,</p>
                        <p>The Team</p>
                        <p><a href="${platformUrl}">Visit Our Website</a></p>
                    </div>
                </div>
            </body>
        </html>
    `;
};

// Email Confirmation Template
export const createEmailConfirmation = (confirmationLink) => {
    return `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    h2 {
                        color: #ff7043;
                        font-size: 26px;
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    p {
                        color: #555;
                        font-size: 16px;
                        line-height: 1.5;
                        text-align: center;
                    }
                    .button {
                        display: inline-block;
                        background-color: #ff7043;
                        color: #fff;
                        padding: 12px 25px;
                        font-size: 16px;
                        font-weight: bold;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 20px;
                        text-align: center;
                        display: block;
                        width: 100%;
                    }
                    .button:hover {
                        background-color: #e64a19;
                    }
                    .footer {
                        font-size: 12px;
                        color: #aaa;
                        text-align: center;
                        margin-top: 30px;
                    }
                    .footer a {
                        color: #ff7043;
                        text-decoration: none;
                    }
                    @media screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
                        h2 {
                            font-size: 22px;
                        }
                        .button {
                            padding: 10px 20px;
                            font-size: 14px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Confirm Your Email Address</h2>
                    <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
                    <a href="${confirmationLink}" class="button">Confirm Email</a>
                    <p>If the button above does not work, you can also use the following link:</p>
                    <p><a href="${confirmationLink}">${confirmationLink}</a></p>
                    <div class="footer">
                        <p>If you did not request this email, please ignore it.</p>
                        <p>Best Regards,</p>
                        <p>The Team</p>
                        <p><a href="${platformUrl}">Visit Our Website</a></p>
                    </div>
                </div>
            </body>
        </html>
    `;
};