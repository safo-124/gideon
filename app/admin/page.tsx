import { requireAdmin } from "@/lib/auth";
import { logoutAdmin } from "./login/actions";

export const metadata = { title: "Admin — Key Recovery" };

export default async function AdminHomePage() {
  const admin = await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {admin.username}
          </p>
        </div>
        <form action={logoutAdmin}>
          <button className="text-sm text-zinc-500 underline">Sign out</button>
        </form>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
        Phase 1 placeholder. CRUD for apartments, blocks, keys, and cabinet
        management arrives in Phase 3.
      </section>
    </main>
  );
}
