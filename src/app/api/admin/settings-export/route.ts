import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { clearSettingsCache } from "@/lib/settings";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await db.setting.findMany({ orderBy: { group: "asc" } });
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!Array.isArray(body)) return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  let count = 0;
  for (const item of body) {
    if (!item.key) continue;
    await db.setting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value || "", group: item.group || "GENERAL", type: item.type || "TEXT" },
      update: { value: item.value || "", group: item.group, type: item.type },
    });
    count++;
  }
  clearSettingsCache();
  await db.activityLog.create({ data: { action: "IMPORT", entity: "Setting", userId: session.id, detail: `Imported ${count} settings` } });
    revalidatePublicPages();
  return NextResponse.json({ ok: true, count });
}
