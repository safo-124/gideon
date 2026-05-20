import { Buffer } from "node:buffer";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM;

export async function sendSms(to: string | null | undefined, body: string) {
  if (!to) return;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[sms] No Twilio config — skipping SMS to ${to}`);
    return;
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    body: new URLSearchParams({
      Body: body,
      From: fromNumber,
      To: to,
    }),
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio SMS failed: ${response.status} ${errorText}`);
  }
}
