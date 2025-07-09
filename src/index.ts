import { UAParser } from 'ua-parser-js';
import { isBot } from 'ua-parser-js/helpers';
import yaml from 'js-yaml';

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
    const { pathname, search } = new URL(request.url);

    const slug = pathname.slice(1);

    if (slug.length === 0) {
      return Response.redirect(env.BASE_URL, 301);
    }

    const targetYaml = await env.ENDEN_LINK_URLS.get(slug);
    if (!targetYaml) {
      console.error(`Slug not found: ${slug}`);
      return new Response('Not Found', { status: 404 });
    }

    const target = yaml.load(targetYaml);

    const userAgent = request.headers.get('user-agent');
    const parsedUserAgent = new UAParser(userAgent);

    const trackClick =
      !isBot(userAgent) && (target.track || target.track === undefined);
    if (trackClick) {
      const cf = request.cf;

      const browser = parsedUserAgent.getBrowser();
      const device = parsedUserAgent.getDevice();
      const os = parsedUserAgent.getOS();

      ctx.waitUntil(
        env.ENDEN_LINK_VIEWS.writeDataPoint({
          blobs: [
            slug + search,
            target.url,
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

    return Response.redirect(target.url ?? env.BASE_URL, 301);
  },
};
