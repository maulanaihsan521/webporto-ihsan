import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "maulana-portfolio-cms-secret-key-2024";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export async function signToken(user: SessionUser): Promise<string> {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "2h" });
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
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
