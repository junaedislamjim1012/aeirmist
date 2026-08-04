export const BLANK_DP = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23090d16" /><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="%23ffffff" opacity="0.15"/></svg>`;

export function getAvatarUrl(photoURL?: string | null, seed?: string): string {
  if (photoURL && photoURL.trim() !== "" && photoURL !== "null") {
    return photoURL;
  }
  if (!seed) return BLANK_DP;
  
  // Use professional, modern avatars for fallback
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=09090b,18181b,27272a`;
}
