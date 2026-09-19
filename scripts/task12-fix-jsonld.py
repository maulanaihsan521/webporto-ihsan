#!/usr/bin/env python3
"""Task 12-f3: Ganti semua JSON.stringify JSON-LD -> safeJsonLd + pastikan import."""
import re, glob

FILES = [
    "src/app/(site)/about/page.tsx",
    "src/app/(site)/blog/(list)/page.tsx",
    "src/app/(site)/blog/[slug]/page.tsx",
    "src/app/(site)/certificates/[slug]/page.tsx",
    "src/app/(site)/certificates/page.tsx",
    "src/app/(site)/contact/page.tsx",
    "src/app/(site)/education/page.tsx",
    "src/app/(site)/experience/page.tsx",
    "src/app/(site)/faq/page.tsx",
    "src/app/(site)/financial-market/(list)/page.tsx",
    "src/app/(site)/gallery/page.tsx",
    "src/app/(site)/portfolio/(list)/page.tsx",
    "src/app/(site)/portfolio/[slug]/page.tsx",
    "src/app/(site)/services/page.tsx",
    "src/app/(site)/skills/page.tsx",
    "src/app/(site)/testimonials/page.tsx",
    "src/app/layout.tsx",
]

# 1. replace dangerouslySetInnerHTML={{ __html: JSON.stringify(X) }}
pat = re.compile(r'dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\((\w+)\)\s*\}\}')
changed = []
for f in FILES:
    src = open(f).read()
    new, n = pat.subn(r'dangerouslySetInnerHTML={{ __html: safeJsonLd(\1) }}', src)
    if n == 0:
        print(f"NO MATCH: {f}")
        continue
    # 2. pastikan import safeJsonLd dari @/lib/utils
    if "safeJsonLd" not in new.split("dangerouslySetInnerHTML")[0] or True:
        # cari import dari @/lib/utils yang sudah ada
        m = re.search(r'import\s*\{([^}]*)\}\s*from\s*"@/lib/utils";', new)
        if m and "safeJsonLd" not in m.group(1):
            new = new.replace(m.group(0),
                'import {' + m.group(1).rstrip() + ', safeJsonLd } from "@/lib/utils";')
        elif not m:
            # tambah baris import setelah import terakhir
            imports = list(re.finditer(r'^import .*?;\s*$', new, re.M))
            last = imports[-1] if imports else None
            if last:
                new = new[:last.end()] + '\nimport { safeJsonLd } from "@/lib/utils";' + new[last.end():]
            else:
                new = 'import { safeJsonLd } from "@/lib/utils";\n' + new
    open(f, "w").write(new)
    changed.append((f, n))

print(f"PATCHED {len(changed)} files:")
for f, n in changed:
    print(f"  {f} ({n}x)")
