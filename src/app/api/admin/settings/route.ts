import { NextRequest, NextResponse } from "next/server";
import { revalidatePublicPages } from "@/lib/revalidate";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getSettings,
  setSettings,
  clearSettingsCache,
} from "@/lib/settings";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const items: { key: string; value: string; group?: string; type?: string }[] =
      body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items required" }, { status: 400 });
    }

    await setSettings(items);
    clearSettingsCache();

    await db.activityLog.create({
      data: {
        action: "UPDATE",
        entity: "Setting",
        userId: session.id,
        detail: `Updated ${items.length} setting(s): ${items.map((i) => i.key).join(", ")}`,
      },
    });

      revalidatePublicPages();
  return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Settings update error:", e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
