"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const themeOptions = [
  { Icon: SunIcon, label: "Light", value: "light" },
  { Icon: MoonIcon, label: "Dark", value: "dark" },
] as const;

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  return (
    <div
      aria-label="Theme"
      className={`theme-toggle inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
      role="group"
    >
      {themeOptions.map((option) => {
        const isSelected = mounted && resolvedTheme === option.value;
        const Icon = option.Icon;

        return (
          <button
            aria-label={`${option.label} mode`}
            aria-pressed={isSelected}
            className={`theme-toggle-button inline-flex h-8 w-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? "theme-toggle-button-active bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
            disabled={!mounted}
            key={option.value}
            onClick={() => setTheme(option.value)}
            title={`${option.label} mode`}
            type="button"
          >
            <Icon />
            <span className="sr-only">{option.label} mode</span>
          </button>
        );
      })}
    </div>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M12 3v2.25M12 18.75V21M4.22 4.22l1.59 1.59M18.19 18.19l1.59 1.59M3 12h2.25M18.75 12H21M4.22 19.78l1.59-1.59M18.19 5.81l1.59-1.59" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.75" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path
        d="M20.25 14.15A7.25 7.25 0 0 1 9.85 3.75 8.5 8.5 0 1 0 20.25 14.15Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
