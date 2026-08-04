/**
 * Helper to convert Google Drive view/share links into a direct viewable thumbnail image URL.
 */
export function parseGoogleDriveImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Extract ID from Google Drive file links like /file/d/FILE_ID/view
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return `https://drive.google.com/thumbnail?id=${matchFileD[1]}&sz=w1000`;
  }

  // Extract ID from open?id=FILE_ID or uc?id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) {
    return `https://drive.google.com/thumbnail?id=${matchIdParam[1]}&sz=w1000`;
  }

  // Extract ID from lh3 or direct /d/FILE_ID paths
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    return `https://drive.google.com/thumbnail?id=${matchD[1]}&sz=w1000`;
  }

  return trimmed;
}
