// frontend/src/config/webcontainer.js

let webContainerInstance = null;

/**
 * In production (Vercel) or SSR (no window), return null.
 * In dev (vite), dynamically import @webcontainer/api and boot once.
 */
export async function getWebContainer() {
  const isProd = import.meta.env.PROD;
  const hasWindow = typeof window !== 'undefined';

  if (isProd || !hasWindow) return null;

  if (!webContainerInstance) {
    // Lazy import so the package isn't bundled for production
    const { WebContainer } = await import('@webcontainer/api');
    webContainerInstance = await WebContainer.boot();
  }
  return webContainerInstance;
}

export const isWebContainerAvailable =
  import.meta.env.DEV && typeof window !== 'undefined';
