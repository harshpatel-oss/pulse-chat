import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS } from "../config/index.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendResetEmail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};
