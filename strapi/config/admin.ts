import type { Core } from '@strapi/strapi';

declare const strapi: Core.Strapi;

const getPreviewUrl = (
  baseUrl: string,
  pathname: string,
  params: URLSearchParams,
): string => {
  const url = new URL(baseUrl);
  // ensure pathname is preserved (keeps existing pathname if provided)
  if (pathname) {
    url.pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  }

  if ([...params.keys()].length > 0) {
    url.search = params.toString();
  }

  return url.toString();
};

const getPreviewPathname = (
  uid: string,
): string => {
  switch (uid) {
    case 'api::homepage.homepage':
      return '/';
    case 'api::about.about':
      return '/';
    case 'api::tour-date.tour-date':
      return '/';
    case 'api::press-feature.press-feature':
      return '/';
    case 'api::video.video':
      return '/';
    default:
      return '/';
  }
};

export default ({ env }) => {
  const clientUrl = env('CLIENT_URL', 'http://localhost:3000');
  const previewUrl = env('PREVIEW_URL', clientUrl);
  const previewSecret = env('PREVIEW_SECRET');

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
    preview: {
      enabled: true,
      config: {
        allowedOrigins: [clientUrl],
        async handler(uid, { documentId, locale, status }) {
          const searchParams = new URLSearchParams({
            preview: 'true',
            uid,
          });

          if (documentId) {
            searchParams.set('documentId', documentId);
          }

          if (status) {
            searchParams.set('status', status);
          }

          if (locale) {
            searchParams.set('locale', locale);
          }

          if (previewSecret) {
            searchParams.set('secret', previewSecret);
          }

          const pathname = getPreviewPathname(uid);

          return getPreviewUrl(previewUrl, pathname, searchParams);
        },
      },
    },
    apiToken: {
      salt: env('API_TOKEN_SALT'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT'),
      },
    },
    secrets: {
      encryptionKey: env('ENCRYPTION_KEY'),
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    },
  };
};
