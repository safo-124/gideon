import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { getAdminCounts } from "../_lib/data";
import { AdminNav } from "../_components/admin-nav";
import { logoutAdmin } from "../login/actions";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const [admin, counts] = await Promise.all([requireAdmin(), getAdminCounts()]);

  return (
    <main className="min-h-full flex-1 bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_1fr]">
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-6">
          <div className="border-b border-zinc-200 px-2 pb-3 dark:border-zinc-800">
            <div className="text-sm font-semibold">Key Recovery</div>
            <div className="mt-1 text-xs text-zinc-500">{admin.username}</div>
          </div>
          <div className="py-3">
            <AdminNav counts={counts} />
          </div>
          <form action={logoutAdmin} className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <button className="h-9 w-full rounded-md px-3 text-left text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white">
              Sign out
            </button>
          </form>
        </aside>

        <div>{children}</div>
      </div>
    </main>
  );
}
