import { requireTenant } from "@/lib/auth";
import { logout } from "./login/actions";

export const metadata = { title: "Home — Key Recovery" };

export default async function HomePage() {
  const tenant = await requireTenant();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {tenant.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {tenant.apartment.block.name} · Apt {tenant.apartment.number} ·{" "}
            {tenant.apartment.block.streetName} {tenant.apartment.block.zip}
          </p>
        </div>
        <form action={logout}>
          <button className="text-sm text-zinc-500 underline">Sign out</button>
        </form>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
        Phase 1 placeholder. The two action buttons (“Request spare key” and
        “Request for someone”) and the live timer arrive in Phase 2.
      </section>
    </main>
  );
}
