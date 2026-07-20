import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-guard";
import { MessagesManager } from "./messages-manager";

export default async function AdminMessagesPage() {
  await requireAdminSession();

  const messages = await db.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const data = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    read: m.read,
    starred: m.starred,
    replied: m.replied,
    reply: m.reply,
    createdAt: m.createdAt.toISOString(),
  }));

  return <MessagesManager data={data} />;
}
