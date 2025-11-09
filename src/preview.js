const STRAPI_BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL || '').replace(/\/$/, '');

const originMatchesStrapi = (origin) => {
  if (!STRAPI_BASE_URL) {
    return false;
  }

  try {
    const expectedOrigin = new URL(STRAPI_BASE_URL).origin;
    return origin === expectedOrigin;
  } catch (_error) {
    return false;
  }
};

const isPreviewMode = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('preview') === 'true';
};

const initLivePreviewBridge = () => {
  if (typeof window === 'undefined') return;
  if (window.parent === window) return;
  if (!isPreviewMode()) return;

  const handleMessage = (event) => {
    const { origin, data } = event;

    if (!originMatchesStrapi(origin)) {
      return;
    }

    if (!data || typeof data !== 'object') {
      return;
    }

    if (data.type === 'strapiScript' && data.payload?.script) {
      const script = window.document.createElement('script');
      script.textContent = data.payload.script;
      window.document.head.appendChild(script);
    }

    if (data.type === 'strapiUpdate') {
      window.location.reload();
    }
  };

  window.addEventListener('message', handleMessage);

  // Notify Strapi that the preview frame is ready
  window.parent.postMessage({ type: 'previewReady' }, '*');

  // Cleanup
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('message', handleMessage);
  });
};

initLivePreviewBridge();

