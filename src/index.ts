import { UAParser } from 'ua-parser-js';
import { isBot } from 'ua-parser-js/helpers';

import {
  KVNamespace,
  AnalyticsEngineDataset,
  ExecutionContext,
  Request,
} from '@cloudflare/workers-types';

export interface Env {
  BASE_URL: string;
  ENDEN_LINK_URLS: KVNamespace;
  ENDEN_LINK_VIEWS: AnalyticsEngineDataset;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    const slug = pathname.slice(1);
    let dest = slug.length > 0 ? await env.ENDEN_LINK_URLS.get(slug) : null;

    if (slug && !dest) {
      console.error(`Slug not found: ${slug}`);
      return new Response('Not Found', { status: 404 });
    }

    const userAgent = request.headers.get('user-agent');
    const parsedUserAgent = new UAParser(userAgent);

    const trackClick = !isBot(userAgent) && slug && slug[0] !== '_';
    if (trackClick) {
      const cf = request.cf;

      const browser = parsedUserAgent.getBrowser();
      const device = parsedUserAgent.getDevice();
      const os = parsedUserAgent.getOS();

      ctx.waitUntil(
        env.ENDEN_LINK_VIEWS.writeDataPoint({
          blobs: [
            slug,
            dest,
            request.headers.get('referer'),
            cf.city,
            cf.country,
            userAgent,
            browser.name,
            browser.version,
            device.vendor,
            device.model,
            os.name,
            os.version,
          ],
          doubles: [],
          indexes: [slug],
        }),
      );
    }

    return Response.redirect(dest ?? env.BASE_URL, 301);
  },
};
