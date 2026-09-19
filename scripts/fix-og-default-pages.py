#!/usr/bin/env python3
"""FIX 2026-09-17: ganti hardcoded /uploads/og-default.webp (WebP mentah,
tidak dirender WhatsApp) di metadata halaman statis -> DEFAULT_OG_IMAGE_URL
(proxy /api/og-image?p=... yang menyajikan JPEG 1200x630 < 300KB).
"""
import re
import pathlib

ROOT = pathlib.Path("/home/z/my-project/webporto-ihsan/src/app")
LITERAL = 'url: "/uploads/og-default.webp"'
IMPORT_LINE = 'import { DEFAULT_OG_IMAGE_URL } from "@/lib/og-image";'

changed = []
for f in ROOT.rglob("*.tsx"):
    txt = f.read_text(encoding="utf-8")
    if LITERAL not in txt:
        continue
    new = txt.replace(LITERAL, "url: DEFAULT_OG_IMAGE_URL")

    if 'from "@/lib/og-image"' in new:
        # sudah ada import og-image -> pastikan DEFAULT_OG_IMAGE_URL termasuk
        def add_const(m):
            names = m.group(1).strip()
            if "DEFAULT_OG_IMAGE_URL" in names:
                return m.group(0)
            return f'import {{{names}, DEFAULT_OG_IMAGE_URL}} from "@/lib/og-image";'
        new = re.sub(r'import \{([^}]*)\} from "@/lib/og-image";', add_const, new, count=1)
    else:
        # sisipkan import baru setelah baris import terakhir
        imports = list(re.finditer(r'^import .*?;$', new, flags=re.M))
        if not imports:
            print(f"!! {f}: tidak ada import — skip")
            continue
        insert_at = imports[-1].end()
        new = new[:insert_at] + "\n" + IMPORT_LINE + new[insert_at:]

    f.write_text(new, encoding="utf-8")
    changed.append(str(f.relative_to(ROOT)))

print(f"{len(changed)} file diubah:")
for c in changed:
    print(" -", c)
