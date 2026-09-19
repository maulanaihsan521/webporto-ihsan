#!/usr/bin/env python3
"""Task 12-f1: Enforce ADMIN role on all admin API routes.

Pattern di route admin:
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

Menjadi:
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

- Route yang SUDAH cek role (users, users/[id], backup) dilewati biar tidak dobel.
- contact route: PATCH/DELETE ditambah cek role (GET sudah cek).
"""
import re, glob, sys

OLD = 'if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });'
NEW = 'if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });'

changed, skipped, nomatch = [], [], []

files = sorted(glob.glob("src/app/api/admin/**/route.ts", recursive=True))
for f in files:
    src = open(f).read()
    if f not in ("src/app/api/admin/users/route.ts",
                 "src/app/api/admin/users/[id]/route.ts",
                 "src/app/api/admin/backup/route.ts"):
        if OLD in src:
            n = src.count(OLD)
            src = src.replace(OLD, NEW)
            open(f, "w").write(src)
            changed.append((f, n))
        elif "getSession()" in src:
            nomatch.append(f)  # pola beda — review manual
    else:
        skipped.append(f)

print(f"PATCHED {len(changed)} files:")
for f, n in changed:
    print(f"  {f} ({n}x)")
print(f"\nSKIPPED (already role-checked): {skipped}")
print(f"NEED MANUAL REVIEW (pattern not found): {nomatch}")

# --- admin-guard.ts: role check pada guard halaman admin ---
g = "src/lib/admin-guard.ts"
src = open(g).read()
old_guard = """export async function requireAdminSession() {
  const session = await getSession();
  if (!session) {
    redirect("/x9k2-dashboard/login");
  }
  return session;
}"""
new_guard = """export async function requireAdminSession() {
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
}"""
if old_guard in src:
    open(g, "w").write(src.replace(old_guard, new_guard))
    print("\nadmin-guard.ts: PATCHED (role check added)")
else:
    print("\nadmin-guard.ts: PATTERN NOT FOUND — check manually!")

# --- contact route: PATCH/DELETE perlu cek role (GET sudah) ---
c = "src/app/api/contact/route.ts"
src = open(c).read()
OLD_C = 'if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });'
NEW_C = 'if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });'
# PATCH/DELETE pakai pola sama; GET punya cek role terpisah (biarkan)
n = src.count(OLD_C)
if n:
    src = src.replace(OLD_C, NEW_C)
    open(c, "w").write(src)
    print(f"contact/route.ts: PATCHED ({n}x)")
else:
    print("contact/route.ts: pattern not found (cek manual)")
