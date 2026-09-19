import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await getSession();
  if (!session) {
    redirect("/x9k2-dashboard/login");
  }
  // SECURITY (Task 12): non-ADMIN (EDITOR/VIEWER) tidak boleh membuka
  // halaman dashboard — arahkan ke login (aman dari loop: halaman login
  // tidak pernah auto-redirect saat session ada).
  if (session.role !== "ADMIN") {
    redirect("/x9k2-dashboard/login");
  }
  return session;
}
