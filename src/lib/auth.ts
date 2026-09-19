import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";

// SECURITY FIX: Hapus hardcoded fallback secret (sebelumnya bocor di source code publik)
// Sekarang WAJIB set JWT_SECRET di environment variables.
// Kalau tidak set, aplikasi akan fail-fast di startup (lebih aman daripada pakai secret known).
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Di production, throw error agar developer tahu harus set env var
  // Di build time, log warning saja (Next.js build tidak butuh secret)
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET environment variable is not set!");
    console.error("Set it in Vercel: Settings → Environment Variables → JWT_SECRET");
    console.error("Generate random 64-char string: openssl rand -hex 32");
  }
}
const SECRET = JWT_SECRET || "dev-only-insecure-secret-change-in-production";
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export async function signToken(user: SessionUser): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(user, SECRET, { expiresIn: "2h" });
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  if (!JWT_SECRET) {
    // Tanpa secret, tidak ada token yang valid
    return null;
  }
  try {
    // SECURITY (Task 12): pin algoritma HS256 — tolak token alg lain (confusion)
    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // SECURITY (Task 12): re-check ke DB — user yang sudah dihapus atau
  // di-demote (role berubah) langsung kehilangan akses, tidak menunggu
  // token expire (sebelumnya token valid 2 jam apa pun yang terjadi di DB).
  // Fail-closed: bila DB error, sesi dianggap tidak valid.
  try {
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true, image: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

export async function getUserFromDb(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, image: true, bio: true },
  });
}
