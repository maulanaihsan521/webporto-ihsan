import { NextResponse } from "next/server";

/**
 * VULN-013 FIX: Sebelumnya return {"message":"Hello, world!"}
 * yang mengkonfirmasi keberadaan API. Sekarang return 404 untuk obscure.
 */
export async function GET() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
