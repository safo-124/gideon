import { prisma } from "./prisma";

export type SettingsMap = {
  base_fee_cents: number;
  overage_fee_cents_per_hour: number;
  lost_key_fee_cents: number;
  hold_hours: number;
  dispute_window_minutes: number;
};

export const SETTING_KEYS = [
  "base_fee_cents",
  "overage_fee_cents_per_hour",
  "lost_key_fee_cents",
  "hold_hours",
  "dispute_window_minutes",
] as const satisfies ReadonlyArray<keyof SettingsMap>;

export const DEFAULTS: SettingsMap = {
  base_fee_cents: 2000,
  overage_fee_cents_per_hour: 500,
  lost_key_fee_cents: 10000,
  hold_hours: 6,
  dispute_window_minutes: 30,
};

export async function getSettings(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const result: SettingsMap = { ...DEFAULTS };
  for (const row of rows) {
    if (SETTING_KEYS.includes(row.key as keyof SettingsMap)) {
      (result as Record<string, number>)[row.key] = Number(row.value);
    }
  }
  return result;
}
