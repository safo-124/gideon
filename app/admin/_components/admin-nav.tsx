"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Counts = {
  blocks: number;
  units: number;
  cabinets: number;
  keys: number;
};

const navItems = [
  { href: "/admin", label: "Overview", countKey: null },
  { href: "/admin/blocks", label: "Blocks", countKey: "blocks" },
  { href: "/admin/units", label: "Units", countKey: "units" },
  { href: "/admin/cabinets", label: "Cabinets", countKey: "cabinets" },
  { href: "/admin/keys", label: "Keys", countKey: "keys" },
] as const;

export function AdminNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {navItems.map((item) => {
        const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            className={`flex h-10 items-center justify-between rounded-md px-3 text-sm font-medium transition ${
              active
                ? "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
            }`}
            href={item.href}
            key={item.href}
          >
            <span>{item.label}</span>
            {item.countKey && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs tabular-nums text-zinc-500 dark:bg-zinc-900">
                {counts[item.countKey]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
