export type PortalType = 'teacher' | 'parent';

/**
 * Retrieves the preferred portal by checking document.cookie first (better persistence across Safari PWA WebClips)
 * and falling back to localStorage.
 */
export function getPreferredPortal(): PortalType | null {
  if (typeof window === 'undefined') return null;
  try {
    const cookieMatch = document.cookie.match(/(?:^|; )iit_preferred_portal=([^;]*)/);
    if (cookieMatch && (cookieMatch[1] === 'teacher' || cookieMatch[1] === 'parent')) {
      return cookieMatch[1] as PortalType;
    }
    const local = localStorage.getItem('iit_preferred_portal');
    if (local === 'teacher' || local === 'parent') {
      return local as PortalType;
    }
  } catch (e) {
    // Graceful fallback for restricted environments
  }
  return null;
}

/**
 * Stores the user's preferred portal across both localStorage and long-lived cookies.
 */
export function setPreferredPortal(portal: PortalType): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('iit_preferred_portal', portal);
    document.cookie = `iit_preferred_portal=${portal}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    // Ignore errors if storage is blocked
  }
}

/**
 * Dynamically updates the active manifest link, apple-mobile-web-app-title,
 * theme-color, and document title so that Safari / iOS "Add to Home Screen"
 * uses the dedicated icons and start_url for each portal.
 */
export function syncPortalManifestAndTheme(portal: PortalType): void {
  if (typeof document === 'undefined') return;
  try {
    const manifestLink = document.getElementById('app-manifest-link') as HTMLLinkElement | null;
    const appleTitleMeta = document.getElementById('apple-app-title') as HTMLMetaElement | null;
    const themeColorMeta = document.getElementById('theme-color-meta') as HTMLMetaElement | null;

    if (portal === 'teacher') {
      if (manifestLink) manifestLink.href = '/manifest-maestros.webmanifest';
      if (appleTitleMeta) appleTitleMeta.content = 'IIT Docentes';
      if (themeColorMeta) themeColorMeta.content = '#166534';
      document.title = 'IIT Docentes — Instituto Inglés de Toluca';
    } else {
      if (manifestLink) manifestLink.href = '/manifest.webmanifest';
      if (appleTitleMeta) appleTitleMeta.content = 'IIT Pickup';
      if (themeColorMeta) themeColorMeta.content = '#000e27';
      document.title = 'IIT Pickup — Instituto Inglés de Toluca';
    }
  } catch (e) {
    // Ignore DOM manipulation errors
  }
}
