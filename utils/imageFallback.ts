/**
 * Utility functions for safe image handling, avatar generation, and fallback handling
 */

export const DEFAULT_LION_LOGO = 'images/logo.png';

export const DEFAULT_ACTIVITY_FALLBACK = 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop';
export const DEFAULT_GALLERY_FALLBACK = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop';

/**
 * Generates an institutional Lionistic avatar with the person's initials and brand colors (#002B66 / #F59E0B)
 */
export const getSafeAvatarUrl = (photoUrl?: string, name?: string): string => {
  if (photoUrl && !photoUrl.includes('firebasestorage.googleapis.com')) {
    // If it's a valid data URL, local image, or valid remote image, return it
    if (photoUrl.startsWith('data:image') || photoUrl.startsWith('http') || photoUrl.startsWith('./') || photoUrl.startsWith('/')) {
      return photoUrl;
    }
  }

  const cleanName = encodeURIComponent((name || 'Socio León').trim());
  return `https://ui-avatars.com/api/?name=${cleanName}&background=002B66&color=F59E0B&bold=true&size=256`;
};

/**
 * Returns a safe URL for activities, avoiding broken storage URLs
 */
export const getSafeActivityUrl = (imageUrl?: string): string => {
  if (imageUrl && !imageUrl.includes('firebasestorage.googleapis.com')) {
    return imageUrl;
  }
  return DEFAULT_ACTIVITY_FALLBACK;
};

/**
 * Returns a safe URL for gallery items
 */
export const getSafeGalleryUrl = (imageUrl?: string): string => {
  if (imageUrl && !imageUrl.includes('firebasestorage.googleapis.com')) {
    return imageUrl;
  }
  return DEFAULT_GALLERY_FALLBACK;
};

/**
 * Image onError event handler that replaces broken image with appropriate fallback
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = DEFAULT_ACTIVITY_FALLBACK
) => {
  const target = e.currentTarget;
  if (target.src !== fallbackUrl) {
    target.onerror = null; // Prevent infinite loop if fallback also fails
    target.src = fallbackUrl;
  }
};

/**
 * Avatar onError event handler
 */
export const handleAvatarError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  name?: string
) => {
  const target = e.currentTarget;
  const fallback = getSafeAvatarUrl(undefined, name);
  if (target.src !== fallback) {
    target.onerror = null;
    target.src = fallback;
  }
};
