import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const h = await headers();
  const pathname = h.get("x-pathname") || "";

  // The login page should render without the shell
  // We detect it via the request path — but headers don't reliably include pathname in Next 16.
  // Fallback: if no session, render children bare (login page). If session, render with shell.
  // The login page itself redirects to /admin if already logged in (client-side).

  if (!session) {
    // Bare render for login page
    return <>{children}</>;
  }

  return <AdminShell user={session}>{children}</AdminShell>;
}
