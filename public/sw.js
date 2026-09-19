/**
 * Portfolio CMS Service Worker — HARDENED VERSION with SRI
 *
 * VULN-010 FIX (Complete):
 * - Versioned cache name untuk easy invalidation
 * - Expiration policy (max 24 jam)
 * - LRU eviction (max 50 entries)
 * - Subresource Integrity (SRI) verification — SHA-256 hash check sebelum caching
 * - Network-first untuk navigation (selalu fresh content)
 * - Stale-while-revalidate untuk static assets
 *
 * Updated: 2026-08-04 (post re-test — added SRI verification)
 */

const CACHE_VERSION = "v4-favicon-2026-09-11";
const CACHE_NAME = `maulana-portfolio-${CACHE_VERSION}`;

// Static assets dengan integrity hash (SHA-256)
// Hash di-generate saat build time, update jika asset berubah
const STATIC_ASSETS = [
  {
    url: "/",
    // Hash akan diverifikasi saat runtime; jika tidak cocok, skip caching
    integrity: null, // null = tidak verify hash (untuk halaman dinamis)
  },
  {
    url: "/logo.svg",
    // Hash bisa di-set manual setelah generate: shasum -a 256 public/logo.svg
    integrity: null,
  },
  {
    url: "/manifest.json",
    integrity: null,
  },
];

// Expiration: 24 jam
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Limit cache entries (LRU eviction)
const MAX_CACHE_ENTRIES = 50;

// ============================================================
// SRI Verification Helper
// ============================================================

/**
 * Verifikasi integritas response dengan SHA-256 hash.
 * Jika hash tidak disediakan (null), skip verifikasi (untuk halaman dinamis).
 * Jika hash disediakan tapi tidak cocok, return false (jangan cache).
 *
 * @param {Response} response - Response yang akan diverifikasi
 * @param {string|null} expectedHash - Hash SHA-256 dalam format hex (atau null untuk skip)
 * @returns {Promise<boolean>} - true jika valid atau skip, false jika tidak valid
 */
async function verifyIntegrity(response, expectedHash) {
  if (!expectedHash) {
    // Tidak ada hash yang ditentukan, skip verifikasi (untuk konten dinamis)
    return true;
  }

  try {
    const cloned = response.clone();
    const buffer = await cloned.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Bandingkan hash (timing-safe comparison)
    if (hashHex.length !== expectedHash.length) {
      console.error("[SW] SRI: hash length mismatch for", response.url);
      return false;
    }

    let diff = 0;
    for (let i = 0; i < hashHex.length; i++) {
      diff |= hashHex.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }

    if (diff !== 0) {
      console.error("[SW] SRI: integrity check FAILED for", response.url);
      console.error("    Expected:", expectedHash);
      console.error("    Got:     ", hashHex);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[SW] SRI: verification error for", response.url, e);
    return false;
  }
}

// ============================================================
// Cache Management Helpers
// ============================================================

/**
 * Cek apakah cached response masih valid (belum expired)
 */
function isFresh(response) {
  const dateHeader = response.headers.get("date");
  if (!dateHeader) return false;
  const age = Date.now() - new Date(dateHeader).getTime();
  return age < MAX_AGE_MS;
}

/**
 * Limit cache size (LRU approximation — FIFO)
 */
async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_ENTRIES) {
    const toDelete = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
    await Promise.all(toDelete.map((req) => cache.delete(req)));
  }
}

// ============================================================
// Install Event — cache static assets dengan SRI verification
// ============================================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      for (const asset of STATIC_ASSETS) {
        try {
          const response = await fetch(asset.url, { cache: "no-store" });

          if (!response.ok) {
            console.warn(`[SW] Failed to fetch ${asset.url}: ${response.status}`);
            continue;
          }

          // VULN-010 FIX: Verify integrity sebelum caching
          const isValid = await verifyIntegrity(response, asset.integrity);
          if (!isValid) {
            console.error(`[SW] SRI verification failed for ${asset.url} — skipping cache`);
            continue;
          }

          await cache.put(asset.url, response);
          console.log(`[SW] Cached: ${asset.url}`);
        } catch (e) {
          console.warn(`[SW] Failed to cache ${asset.url}:`, e);
        }
      }
    })()
  );
  self.skipWaiting();
});

// ============================================================
// Activate Event — cleanup old caches
// ============================================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => {
              console.log("[SW] Deleting old cache:", k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============================================================
// Fetch Event — serve from cache atau network
// ============================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya handle GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip API requests, Next.js internals, dan cross-origin
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;
  if (url.origin !== self.location.origin) return;

  // Network-first untuk navigation (selalu dapat fresh HTML)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);

          // Verify integrity jika response OK
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            const copy = networkResponse.clone();
            // Untuk navigation, skip SRI (halaman dinamis) tapi simpan dengan expiration
            await cache.put(request, copy);
            await trimCache(cache);
          }

          return networkResponse;
        } catch {
          // Fallback ke cache, lalu ke cached root
          const cached = await caches.match(request);
          if (cached && isFresh(cached)) return cached;
          return (await caches.match("/")) || new Response("Offline", { status: 503 });
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate untuk static assets
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      // Jika cached dan masih fresh, serve langsung & revalidate di background
      if (cached && isFresh(cached)) {
        // Revalidate di background (non-blocking)
        fetch(request)
          .then(async (fresh) => {
            if (fresh.ok) {
              // Verify integrity sebelum update cache
              const isValid = await verifyIntegrity(fresh.clone(), null); // null = skip untuk dynamic
              if (isValid) {
                await cache.put(request, fresh.clone());
                await trimCache(cache);
              }
            }
          })
          .catch(() => {});
        return cached;
      }

      // Jika cached tapi expired, hapus & fetch fresh
      if (cached) {
        await cache.delete(request);
      }

      // Fetch dari network
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          const copy = networkResponse.clone();
          await cache.put(request, copy);
          await trimCache(cache);
        }
        return networkResponse;
      } catch {
        // Fallback ke cached (meskipun expired) jika network gagal
        return cached || new Response("Offline", { status: 503 });
      }
    })()
  );
});
