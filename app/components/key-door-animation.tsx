type KeyDoorAnimationProps = {
  className?: string;
  mode?: "loop" | "once";
  size?: "sm" | "md";
  tone?: "teal" | "zinc";
};

export function KeyDoorAnimation({ className = "", mode = "loop", size = "md", tone = "teal" }: KeyDoorAnimationProps) {
  const colorClass =
    tone === "teal"
      ? "bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900/50"
      : "bg-zinc-100 text-zinc-900 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700";
  const sizeClass = size === "sm" ? "h-10 w-14" : "h-14 w-20";
  const svgSizeClass = size === "sm" ? "h-9 w-12" : "h-12 w-16";

  return (
    <div
      aria-hidden="true"
      className={`auth-mark key-door-scene key-door-scene-${mode} flex items-center justify-center rounded-lg shadow-sm ring-1 ${sizeClass} ${colorClass} ${className}`}
    >
      <svg className={`key-door-svg ${svgSizeClass}`} fill="none" viewBox="0 0 120 88">
        <path className="key-door-glow" d="M58 16h34l14 56H58V16Z" fill="currentColor" opacity="0.1" />
        <rect className="key-door-frame" height="64" rx="5" stroke="currentColor" strokeWidth="4" width="42" x="54" y="14" />
        <g className="key-door-panel">
          <path d="M58 18h34v56H58V18Z" fill="currentColor" opacity="0.18" />
          <path d="M58 18h34v56H58V18Z" stroke="currentColor" strokeWidth="2.5" />
          <circle className="key-door-lock" cx="82" cy="46" fill="currentColor" r="3" />
        </g>
        <g className="key-door-key">
          <circle cx="24" cy="46" r="8" stroke="currentColor" strokeWidth="4" />
          <path d="M32 46h34" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
          <path d="M52 46v9m8-9v7" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
        </g>
        <path className="key-door-open-line" d="M57 19 91 10v68l-34-4V19Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}
