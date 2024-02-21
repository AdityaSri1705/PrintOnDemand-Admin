const nodemailer = require('nodemailer');
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // Your SMTP server's host
    port: process.env.SMTP_PORT, // SMTP port (587 for TLS, 465 for SSL)
    secure: process.env.SMTP_PORT==465? true:false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USERNAME, // Your email address
        pass: process.env.SMTP_PASSWORD, // Your email password
    },
});

module.exports = transporter;