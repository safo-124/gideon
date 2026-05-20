import { KeyDoorAnimation } from "./key-door-animation";

export function UnlockTransition() {
  return (
    <div
      aria-live="polite"
      className="unlock-overlay fixed inset-0 z-50 flex items-center justify-center bg-white/90 px-4 backdrop-blur-md dark:bg-zinc-950/90"
      role="status"
    >
      <div className="unlock-overlay-panel w-full max-w-xs rounded-lg border border-teal-200 bg-white p-6 text-center shadow-xl dark:border-teal-900/60 dark:bg-zinc-900">
        <KeyDoorAnimation className="mx-auto h-24 w-36" mode="once" tone="teal" />
        <div className="mt-5 text-sm font-semibold text-zinc-950 dark:text-zinc-50">Opening your dashboard</div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-teal-100 dark:bg-teal-950">
          <div className="unlock-progress h-full rounded-full bg-teal-700 dark:bg-teal-400" />
        </div>
      </div>
    </div>
  );
}
