#!/usr/bin/env python3
"""Task 12-f4: Generic error message untuk 500 responses (jangan bocorkan e.message).
Pola 34x: error: e?.message || "Failed" → error: "Internal server error" + console.error(e)"""
import glob

OLD = 'return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });'
NEW = 'console.error(e);\n    return NextResponse.json({ error: "Internal server error" }, { status: 500 });'

changed = 0
for f in sorted(glob.glob("src/app/api/**/route.ts", recursive=True)):
    src = open(f).read()
    if OLD in src:
        n = src.count(OLD)
        src = src.replace(OLD, NEW)
        open(f, "w").write(src)
        changed += n
        print(f"  {f} ({n}x)")

print(f"\nTOTAL patched: {changed}")
