import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : undefined,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\\s+/g, '') : undefined
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.warn("Email service is not configured correctly or .env is missing. Emails will gracefully fail to send.");
  } else {
    console.log("Email server is ready to take our messages!");
  }
});

export const sendBookingConfirmation = async (user_email, user_name, court_name, location, date, time_slot) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Skipping email send. Configure EMAIL_USER and EMAIL_PASS in .env.");
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user_email,
    subject: `Booking Confirmed: ${court_name} on ${date}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <h2 style="color: #333; margin-top: 0;">Hi ${user_name}, you're all set!</h2>
          <p style="color: #555; font-size: 16px;">We have successfully reserved your spot. Here are the details of your booking:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
            <p style="margin: 5px 0;"><strong>Facility:</strong> ${court_name}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${time_slot}</p>
          </div>
          
          <p style="color: #555; font-size: 14px;">If you need to cancel or change your booking, please log in to your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Thank you for using SportZone Booking.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};

export const sendEventRegistrationEmail = async (user_email, user_name, event_title, location, date, time) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Skipping email send. Configure EMAIL_USER and EMAIL_PASS in .env.");
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user_email,
    subject: `Event Registration Confirmed: ${event_title}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <h2 style="color: #6366f1; margin-top: 0;">You're in, ${user_name}!</h2>
          <p style="color: #555; font-size: 16px;">We have successfully registered you for the upcoming event. Here are the details:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #eee;">
            <p style="margin: 5px 0;"><strong>Event:</strong> ${event_title}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
          </div>
          
          <p style="color: #555; font-size: 14px;">Please arrive 15 minutes early and bring your A-game!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px;" />
          <p style="color: #999; font-size: 12px; text-align: center;">See you on the court,<br/>SportZone Team</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Event registration email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending event registration email:", error);
    return false;
  }
};
