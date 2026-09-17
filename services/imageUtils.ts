import { BASE_URL } from "./api";

/**
 * Maps seed mock image filenames to high-quality Unsplash preview images
 * so existing demo items in the database render realistic photos.
 */
const SEED_IMAGE_MAP: Record<string, string> = {
  "wallet_01.png": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80",
  "earbuds_01.png": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  "id_01.png": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
  "laptop_01.png": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
  "keys_01.png": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80",
  "backpack_01.png": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
  "umbrella_01.png": "https://images.unsplash.com/photo-1517865288-978fcb780652?w=600&auto=format&fit=crop&q=80",
  "glasses_01.png": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  "book_01.png": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
  "calc_01.png": "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&auto=format&fit=crop&q=80",
  "bottle_01.png": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
  "cat_01.png": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80",
  "ring_01.png": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
  "watch_01.png": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
  "racket_01.png": "https://images.unsplash.com/photo-1617083934555-56326c2cfb37?w=600&auto=format&fit=crop&q=80",
  "keyboard_01.png": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  "guitar_01.png": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80",
  "keys_02.png": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80",
  "pouch_01.png": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
  "glasses_02.png": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  "scarf_01.png": "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80",
  "book_02.png": "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80",
  "shoes_01.png": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
  "hdd_01.png": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&auto=format&fit=crop&q=80",
};

/**
 * Resolves any item image source into a valid, displayable image URI.
 * Handles:
 * - Full remote URLs (Cloudinary, S3, Unsplash, HTTP/HTTPS)
 * - Localhost references redirected to BASE_URL
 * - Relative upload paths (/uploads/...)
 * - Base64 data URIs
 * - Seed demo filenames
 */
export function resolveItemImageUrl(rawImage?: string | null): string | null {
  if (!rawImage || typeof rawImage !== "string") return null;

  const image = rawImage.trim();
  if (!image || image === "placeholder.png" || image === "undefined" || image === "null") {
    return null;
  }

  // 1. Data URI
  if (image.startsWith("data:image/")) {
    return image;
  }

  // 2. Full HTTP/HTTPS URL
  if (image.startsWith("http://") || image.startsWith("https://")) {
    // If it points to localhost/127.0.0.1 and we have a cloud/mobile BASE_URL
    if (image.includes("localhost:3000") || image.includes("127.0.0.1:3000")) {
      return image
        .replace("http://localhost:3000", BASE_URL)
        .replace("http://127.0.0.1:3000", BASE_URL);
    }
    return image;
  }

  // 3. Relative uploads path from server
  if (image.startsWith("/uploads/")) {
    return `${BASE_URL}${image}`;
  }
  if (image.startsWith("uploads/")) {
    return `${BASE_URL}/${image}`;
  }

  // 4. Seed demo filename mapping
  if (SEED_IMAGE_MAP[image]) {
    return SEED_IMAGE_MAP[image];
  }

  return null;
}
