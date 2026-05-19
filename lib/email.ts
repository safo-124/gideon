import nodemailer from "nodemailer";

function transporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_FROM ?? "Key Recovery <noreply@keyrecovery.app>";
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function send(to: string, subject: string, html: string) {
  const t = transporter();
  if (!t) {
    console.log(`[email] No SMTP — skipping "${subject}" to ${to}`);
    return;
  }
  await t.sendMail({ from: FROM, to, subject, html });
}

// ── Shared styles ─────────────────────────────────────────────────────────────

function layout(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden">
<tr><td style="background:#0f766e;padding:20px 28px">
  <span style="color:#fff;font-size:16px;font-weight:600">Key Recovery</span>
</td></tr>
<tr><td style="padding:28px">${content}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa">
  This is an automated message. Do not reply to this email.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#09090b">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46">${text}</p>`;
}

function infoBox(rows: [string, string][]) {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-size:13px;color:#71717a;width:40%">${label}</td>
         <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#09090b">${value}</td></tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:6px;margin:16px 0">${cells}</table>`;
}

function btn(href: string, text: string, danger = false) {
  const bg = danger ? "#dc2626" : "#0f766e";
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:${bg};color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px">${text}</a>`;
}

// ── Email: Tenant invite ──────────────────────────────────────────────────────

export async function sendInviteEmail(
  to: string,
  data: { fullName: string; apartmentLabel: string; inviteUrl: string; expiresAt: Date },
) {
  const dtFmt = new Intl.DateTimeFormat("en-FI", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await send(
    to,
    "You've been invited to Key Recovery",
    layout(`
      ${h1("Welcome to Key Recovery")}
      ${p(`Hi ${data.fullName}, your building manager has created an account for you.`)}
      ${infoBox([
        ["Apartment", data.apartmentLabel],
        ["Email", to],
        ["Invite expires", dtFmt.format(data.expiresAt)],
      ])}
      ${p("Click the button below to set your password and activate your account. The link is valid for <strong>7 days</strong>.")}
      ${btn(data.inviteUrl, "Activate my account")}
      ${p(`<span style="font-size:12px;color:#a1a1aa">If you weren't expecting this, you can ignore this email.</span>`)}
    `),
  );
}

// ── Email: Key ready (SELF) ───────────────────────────────────────────────────

export async function sendKeyReadyEmail(
  to: string,
  name: string,
  aptLabel: string,
  cabinetNumber: number,
  cabinetCode: string,
) {
  await send(
    to,
    "Your spare key is ready for pickup",
    layout(`
      ${h1("Your spare key is ready")}
      ${p(`Hi ${name}, your key request has been confirmed. Head to the cabinet below to pick it up.`)}
      ${infoBox([
        ["Apartment", aptLabel],
        ["Cabinet number", String(cabinetNumber)],
        ["Cabinet code", cabinetCode],
      ])}
      ${p("Open the cabinet using the 4-digit code, take your key, and close it again. You have <strong>6 hours</strong> to return the key before overage charges apply.")}
      ${p("Log in to mark the key as picked up and start your hold timer.")}
    `),
  );
}

// ── Email: Key ready (FOR_OTHER requester) ────────────────────────────────────

export async function sendForOtherKeyReadyEmail(
  to: string,
  requesterName: string,
  targetAptLabel: string,
  cabinetNumber: number,
  cabinetCode: string,
) {
  await send(
    to,
    "Spare key ready — requested on behalf of another tenant",
    layout(`
      ${h1("Spare key ready for pickup")}
      ${p(`Hi ${requesterName}, the spare key for <strong>${targetAptLabel}</strong> is now available.`)}
      ${infoBox([
        ["For apartment", targetAptLabel],
        ["Cabinet number", String(cabinetNumber)],
        ["Cabinet code", cabinetCode],
      ])}
      ${p("Pick up the key and pass it to the resident. You are responsible for returning it within <strong>6 hours</strong>.")}
    `),
  );
}

// ── Email: Dispute notification (apartment owner) ────────────────────────────

export async function sendDisputeEmail(
  to: string,
  residentName: string,
  aptLabel: string,
  requesterName: string,
  disputeToken: string,
  windowEndsAt: Date,
) {
  const disputeUrl = `${APP_URL}/dispute/${disputeToken}`;
  const dtFmt = new Intl.DateTimeFormat("en-FI", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });

  await send(
    to,
    `Someone requested a spare key for your apartment`,
    layout(`
      ${h1("Spare key requested for your apartment")}
      ${p(`Hi ${residentName}, a spare key for <strong>${aptLabel}</strong> was requested by <strong>${requesterName}</strong>.`)}
      ${infoBox([
        ["Apartment", aptLabel],
        ["Requested by", requesterName],
        ["Dispute deadline", dtFmt.format(windowEndsAt)],
      ])}
      ${p("If you authorized this request, no action is needed. If you did not, click the button below to block the key immediately.")}
      ${btn(disputeUrl, "Dispute this request", true)}
      ${p(`<span style="font-size:12px;color:#a1a1aa">This link expires at ${dtFmt.format(windowEndsAt)}.</span>`)}
    `),
  );
}

// ── Email: 1-hour reminder ────────────────────────────────────────────────────

export async function sendReminderEmail(
  to: string,
  name: string,
  aptLabel: string,
  dueAt: Date,
) {
  const dtFmt = new Intl.DateTimeFormat("en-FI", { hour: "2-digit", minute: "2-digit" });

  await send(
    to,
    "Reminder: return your spare key in 1 hour",
    layout(`
      ${h1("Key return reminder")}
      ${p(`Hi ${name}, your spare key for <strong>${aptLabel}</strong> is due back in approximately <strong>1 hour</strong>.`)}
      ${infoBox([["Return by", dtFmt.format(dueAt)]])}
      ${p("Please return the key to the cabinet you collected it from and mark it as returned in the app. Overage charges of €5.00/hr apply after the deadline.")}
    `),
  );
}

// ── Email: Overdue notification ───────────────────────────────────────────────

export async function sendOverdueEmail(
  to: string,
  name: string,
  aptLabel: string,
  dueAt: Date,
) {
  const dtFmt = new Intl.DateTimeFormat("en-FI", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });

  await send(
    to,
    "Your spare key is overdue — overage charges apply",
    layout(`
      ${h1("Key overdue")}
      ${p(`Hi ${name}, your spare key for <strong>${aptLabel}</strong> was due back at ${dtFmt.format(dueAt)} and has not been returned.`)}
      ${p("Overage charges of <strong>€5.00/hr</strong> are now accumulating. Please return the key as soon as possible and mark it as returned in the app.")}
      ${p("If you have already returned the key and forgot to mark it, please contact building management.")}
    `),
  );
}
