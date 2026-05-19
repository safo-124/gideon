import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { sendOverdueEmail, sendReminderEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const settings = await getSettings();
  const report = { reminders: 0, overdueUpdated: 0, overdueEmailed: 0 };

  // ── Reminder emails: due within 1 hour, not yet sent ──────────────────────
  const reminderCutoff = new Date(now.getTime() + 60 * 60 * 1000);
  const toRemind = await prisma.keyRequest.findMany({
    where: {
      status: "PICKED_UP",
      dueAt: { lte: reminderCutoff, gt: now },
      reminderSentAt: null,
    },
    include: { requester: true, apartment: { include: { block: true } } },
  });

  for (const req of toRemind) {
    try {
      await sendReminderEmail(
        req.requester.email,
        req.requester.fullName,
        `${req.apartment.block.name} / Apt ${req.apartment.number}`,
        req.dueAt!,
      );
      await prisma.keyRequest.update({
        where: { id: req.id },
        data: { reminderSentAt: now },
      });
      report.reminders++;
    } catch (err) {
      console.error(`[cron] reminder failed for request ${req.id}:`, err);
    }
  }

  // ── Overdue: accumulate fees + first-time overdue email ───────────────────
  const overdueRequests = await prisma.keyRequest.findMany({
    where: { status: "PICKED_UP", dueAt: { lt: now } },
    include: { requester: true, apartment: { include: { block: true } } },
  });

  for (const req of overdueRequests) {
    try {
      const hoursOver = Math.max(0, (now.getTime() - req.dueAt!.getTime()) / 3_600_000);
      const newFee = Math.ceil(hoursOver) * settings.overage_fee_cents_per_hour;
      const isFirstOverdue = req.overdueFeeCents === 0;

      await prisma.keyRequest.update({
        where: { id: req.id },
        data: { overdueFeeCents: newFee },
      });
      report.overdueUpdated++;

      if (isFirstOverdue) {
        await sendOverdueEmail(
          req.requester.email,
          req.requester.fullName,
          `${req.apartment.block.name} / Apt ${req.apartment.number}`,
          req.dueAt!,
        );
        report.overdueEmailed++;
      }
    } catch (err) {
      console.error(`[cron] overdue update failed for request ${req.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, at: now.toISOString(), ...report });
}
