import "dotenv/config";
import nodemailer from "nodemailer";

const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function main() {
  console.log("Verifying SMTP connection...");
  await t.verify();
  console.log("✓ SMTP connected");

  console.log("Sending test email to", process.env.SMTP_USER);
  const info = await t.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.SMTP_USER,
    subject: "Key Recovery — email test",
    html: `<p>Email is working. SMTP host: <strong>${process.env.SMTP_HOST}</strong></p>`,
  });
  console.log("✓ Sent:", info.messageId);
}

main().catch((err) => { console.error("✗", err.message); process.exit(1); });
