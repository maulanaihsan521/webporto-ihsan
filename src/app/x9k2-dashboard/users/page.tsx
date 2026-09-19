import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { UsersManager } from "./users-manager";

export default async function AdminUsersPage() {
  const session = await requireAdminSession();

  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const data = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    image: u.image,
    bio: u.bio,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return <UsersManager data={data} currentUserId={session.id} currentUserRole={session.role} />;
}
