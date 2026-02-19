const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendBookingEmail = async (candidate, bookingLink) => {
  const subject = 'Invited: AI Interview Next Steps';
  const html = `
    <h3>Hello ${candidate.name},</h3>
    <p>We have reviewed your resume and would like to invite you to an AI-based technical interview.</p>
    <p>Please click the link below to book your interview slot:</p>
    <a href="${bookingLink}">Book Interview Slot</a>
    <p>This link is unique to you. Please do not share it.</p>
    <p>Best regards,<br>The Hiring Team</p>
  `;
  return sendEmail(candidate.email, subject, html);
};

const sendConfirmationEmail = async (candidate, slot, interviewLink) => {
  const subject = 'Confirmed: Your AI Interview Slot';
  const dateStr = new Date(slot.startTime).toLocaleString();
  const html = `
    <h3>Hello ${candidate.name},</h3>
    <p>Your interview has been scheduled for: <strong>${dateStr}</strong></p>
    <p>At the scheduled time, please join using this link:</p>
    <a href="${interviewLink}">Start Interview</a>
    <p>Good luck!</p>
  `;
  return sendEmail(candidate.email, subject, html);
};

const sendHRNotification = async (candidate, evaluation, reportLink) => {
    const subject = `Interview Completed: ${candidate.name} - ${evaluation.recommendation}`;
    const html = `
      <h3>Candidate: ${candidate.name}</h3>
      <p><strong>Status:</strong> ${evaluation.recommendation}</p>
      <p><strong>Score:</strong> ${evaluation.overall_score}/10</p>
      <p><strong>Strengths:</strong> ${evaluation.strengths.join(', ')}</p>
      <p><strong>Weaknesses:</strong> ${evaluation.weaknesses.join(', ')}</p>
      <p><a href="${reportLink}">View Full Report</a></p>
    `;
    // We assume there is an HR email set in ENV or fixed
    const hrEmail = process.env.HR_EMAIL || process.env.EMAIL_USER; 
    return sendEmail(hrEmail, subject, html);
};

module.exports = {
  sendBookingEmail,
  sendConfirmationEmail,
  sendHRNotification
};
